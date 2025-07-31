import {NextRequest, NextResponse} from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/prisma'

export async function POST(request: NextRequest) { 
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, {status:403});
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, {status:404});
    }

    NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    NextResponse.json({ error: 'Internal server error' }, {status:500});
  }
}