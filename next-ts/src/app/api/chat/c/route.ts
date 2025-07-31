import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkMessageLimit, incrementMessageCount } from '@/lib/usage-limits';
import {NextRequest, NextResponse} from 'next/server';

// get all the chats
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({error:"Unauthorized"}, { status: 401 });
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

// create new chat
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({error:"Unauthorized"}, { status: 401 });
  }


  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({error:"User not found"}, { status: 404 });
  }
  // Check message limit
  const limitCheck = await checkMessageLimit(user.id);
  
  if (!limitCheck.canSendMessage) {
    return NextResponse.json({
      error: 'Message limit exceeded',
      message: limitCheck.message,
      currentCount: limitCheck.currentCount,
      maxAllowed: limitCheck.maxAllowed,
    }, {status:403});
  }
  const { text, documentId } = await req.json();
  if (!text){
    return NextResponse.json({error:"text is required"}, { status: 404 });
  }
  // create new chat
  const chat = await prisma.chatHistory.create({
    data: {
      title:text,
      userId: user.id,
    },
  });


  console.log("new chat:" , chat.id)

  const message = await prisma.message.create({
    data: {
      text,
      isUser : true,
      userId: user.id,
      chatId: chat.id
    },
  });
  await incrementMessageCount(user.id);
  
  return NextResponse.json(message);
}
