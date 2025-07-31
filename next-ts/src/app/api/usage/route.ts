import {NextRequest, NextResponse} from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserUsageStats } from '@/lib/usage-limits';
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) { 

  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, {status:403});
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    }); 

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, {status:404});
    }

    const usageStats = await getUserUsageStats(user.id);
    return NextResponse.json(usageStats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, {status:500});
  }
}