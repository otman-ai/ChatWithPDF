import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkMessageLimit, incrementMessageCount } from "@/lib/usage-limits";
import { NextRequest, NextResponse } from "next/server";

// new message
export async function POST(req: NextRequest) {
  let { text, chatId, documentId } = await req.json();
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
  const limitCheck = await checkMessageLimit(user.id);

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
  // create new chat if chatId is not provided

  if (!chatId) {
    const chat = await prisma.chatHistory.create({
      data: {
        title: text,
        userId: user.id,
      },
    });
    chatId = chat.id;
  }

  const message = await prisma.message.create({
    data: {
      text,
      isUser: true,
      chatId,
      userId: user.id,
    },
  });
  await incrementMessageCount(user.id);

  return NextResponse.json(message);
}

// /api/your-endpoint?chatId=abc123

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  const chats = await prisma.message.findMany({
    where: {
      user: { email: session.user.email },
      chatId,
    },
    orderBy: { createdAt: "asc" }, // optional: order messages chronologically
  });

  return NextResponse.json(chats);
}
