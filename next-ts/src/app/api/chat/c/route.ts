import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// get all the chats
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chats = await prisma.chatHistory.findMany({
    where: {
      user: { email: session.user.email },
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },

    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json(chats);
}
