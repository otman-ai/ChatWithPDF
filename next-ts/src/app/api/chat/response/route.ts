import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkMessageLimit } from "@/lib/usage-limits";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.id) {
    return NextResponse.json({ error: "User ID is missing" }, { status: 401 });
  }

  // Check message limit
  const limitCheck = await checkMessageLimit(user?.id);

  if (!limitCheck.canSendMessage) {
    return NextResponse.json(
      {
        error: "Message limit exceeded",
        message: limitCheck.message,
        currentCount: limitCheck.currentCount,
        maxAllowed: limitCheck.maxAllowed,
      },
      { status: 403 }
    );
  }

  const { query, chatId, documentId } = await req.json();

  if (!query || !chatId) {
    return NextResponse.json(
      { error: "Query and chatId are required" },
      { status: 400 }
    );
  }

  type Payload = {
    query: any;
    indexName?: string | null;
    namespace?: string | null;
    chat_history: string[];
  };

  // Fetch chat messages for this chatId
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
  });

  // Format chat history as list of strings
  const chat_history = messages.map(
    (m) => `${m.isUser ? "User" : "AI"}: ${m.text}`
  );
  let payload: Payload = {
    query: query,
    chat_history: chat_history,
  };

  if (documentId) {
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        userId: user?.id,
      },
    });

    payload.indexName = user?.id;
    payload.namespace = document?.namespace;
  }

  const headers: Record<string, string> = {
    "X-API-Key": process.env.CHAT_API_KEY ?? "",
    "Content-Type": "application/json",
  };
  try {
    const response = await fetch(process.env.CHAT_URL + "/get-response", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Getting AI response failed");
    }

    const contentType = response.headers.get("content-type");
    const isStreaming =
      contentType?.includes("text/plain") ||
      contentType?.includes("text/event-stream");

    if (isStreaming && response.body) {
      let fullResponse = "";

      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                // Save to database when streaming is complete
                await prisma.message.create({
                  data: {
                    text: fullResponse,
                    isUser: false,
                    chatId,
                    userId: user?.id,
                  },
                });

                controller.close();
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              fullResponse += chunk;

              // Send raw text chunk to client
              controller.enqueue(new TextEncoder().encode(chunk));
            }
          } catch (error) {
            console.error("Streaming error:", error);
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Fallback for non-streaming
      const aiMessage = await response.json();
      const message = await prisma.message.create({
        data: {
          text: aiMessage?.answer,
          isUser: false,
          chatId,
          userId: user?.id,
        },
      });

      return NextResponse.json(message);
    }
  } catch (error) {
    console.error("Getting AI response error:", error);
    return NextResponse.json(
      { error: "Getting AI response failed" },
      { status: 500 }
    );
  }
}
