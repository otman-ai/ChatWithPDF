import { prisma } from '@/lib/prisma';

// Define limits
export const USAGE_LIMITS = {
  FREE: {
    maxDocuments: 1,
    maxMessagesPerMonth: 20,
  },
  STARTER: {
    maxDocuments: 10,
    maxMessagesPerMonth: 100,
  },
  PREMIUM: {
    maxDocuments: -1, 
    maxMessagesPerMonth: -1,
  },
} as const;

export async function checkDocumentLimit(userId: string): Promise<{
  canUpload: boolean;
  currentCount: number;
  maxAllowed: number;
  message?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      plan: true,
      subscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
      _count: {
        select: {
          documents: {
            where: { isActive: true }
          }
        }
      }
    },
  });

  if (!user) {
    return {
      canUpload: false,
      currentCount: 0,
      maxAllowed: 0,
      message: 'User not found',
    };
  }

  const isPremium = user.plan === 'PREMIUM' && 
                   user.subscriptionStatus === 'ACTIVE' &&
                   user.stripeCurrentPeriodEnd &&
                   user.stripeCurrentPeriodEnd > new Date();

  const isStarter = user.plan === 'STARTER' && 
                   user.subscriptionStatus === 'ACTIVE' &&
                   user.stripeCurrentPeriodEnd &&
                   user.stripeCurrentPeriodEnd > new Date();

  const limits = isPremium ? USAGE_LIMITS.PREMIUM : isStarter? USAGE_LIMITS.STARTER : USAGE_LIMITS.FREE;
  const currentCount = user._count.documents;
  
  if (limits.maxDocuments === -1) {
    return {
      canUpload: true,
      currentCount,
      maxAllowed: -1,
    };
  }

  const canUpload = currentCount < limits.maxDocuments;
  
  return {
    canUpload,
    currentCount,
    maxAllowed: limits.maxDocuments,
    message: canUpload 
      ? undefined 
      : `You've reached your limit of ${limits.maxDocuments} document${limits.maxDocuments === 1 ? '' : 's'}. Upgrade to Premium for unlimited uploads.`,
  };
}

export async function checkMessageLimit(userId: string): Promise<{
  canSendMessage: boolean;
  currentCount: number;
  maxAllowed: number;
  message?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      plan: true,
      subscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
      messageCount: true,
      messageCountResetAt: true,
    },
  });

  if (!user) {
    return {
      canSendMessage: false,
      currentCount: 0,
      maxAllowed: 0,
      message: 'User not found',
    };
  }
  const isPremium = user.plan === 'PREMIUM' && 
                   user.subscriptionStatus === 'ACTIVE' &&
                   user.stripeCurrentPeriodEnd &&
                   user.stripeCurrentPeriodEnd > new Date();

  const isStarter = user.plan === 'STARTER' && 
                   user.subscriptionStatus === 'ACTIVE' &&
                   user.stripeCurrentPeriodEnd &&
                   user.stripeCurrentPeriodEnd > new Date();

  const limits = isPremium ? USAGE_LIMITS.PREMIUM : isStarter? USAGE_LIMITS.STARTER : USAGE_LIMITS.FREE;

  if (limits.maxMessagesPerMonth === -1) {
    return {
      canSendMessage: true,
      currentCount: user.messageCount,
      maxAllowed: -1,
    };
  }

  // Check if we need to reset monthly count
  const now = new Date();
  const lastReset = new Date(user.messageCountResetAt);
  const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);
  
  let currentCount = user.messageCount;
  
  // Reset count if it's been more than 30 days
  if (daysSinceReset >= 30) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        messageCount: 0,
        messageCountResetAt: now,
      },
    });
    currentCount = 0;
  }

  const canSendMessage = currentCount < limits.maxMessagesPerMonth;
  
  return {
    canSendMessage,
    currentCount,
    maxAllowed: limits.maxMessagesPerMonth,
    message: canSendMessage 
      ? undefined 
      : `You've reached your limit of ${limits.maxMessagesPerMonth} messages this month. Upgrade to Premium for unlimited messaging.`,
  };
}

export async function incrementMessageCount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      messageCount: true,
      messageCountResetAt: true,
    },
  });
 
  if (!user) return;

  // Check if we need to reset (same logic as above)
  const now = new Date();
  const lastReset = new Date(user.messageCountResetAt);
  const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceReset >= 30) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        messageCount: 1,
        messageCountResetAt: now,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        messageCount: user.messageCount + 1,
      },
    });
  }
}

export async function deactivateDocument(documentId: string, userId: string): Promise<boolean> {
  try {
    await prisma.document.update({
      where: { 
        id: documentId,
        userId: userId, // Ensure user owns the document
      },
      data: { isActive: false },
    });
    return true;
  } catch (error) {
    console.error('Error deactivating document:', error);
    return false;
  }
}

export async function getUserUsageStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

    const documents = await prisma.document.findMany({
      where: {
        userId: userId,
      }
    });

  if (!user) return null;

  const isPremium = user.plan === 'PREMIUM' && 
                   user.subscriptionStatus === 'ACTIVE' &&
                   user.stripeCurrentPeriodEnd &&
                   user.stripeCurrentPeriodEnd > new Date();
  const isStarter = user.plan === 'STARTER' && 
                   user.subscriptionStatus === 'ACTIVE' &&
                   user.stripeCurrentPeriodEnd &&
                   user.stripeCurrentPeriodEnd > new Date();
  const limits = isPremium ? USAGE_LIMITS.PREMIUM : isStarter? USAGE_LIMITS.STARTER : USAGE_LIMITS.FREE;

  return {
    plan: user.plan,
    isPremium,
    subscriptionStatus:user.subscriptionStatus,
    documents: {
      current: documents.length,
      max: limits.maxDocuments,
      canUpload: limits.maxDocuments === -1 || documents.length < limits.maxDocuments,
    },
    messages: {
      current: user.messageCount,
      max: limits.maxMessagesPerMonth,
      canSend: limits.maxMessagesPerMonth === -1 || user.messageCount < limits.maxMessagesPerMonth,
    },
  };
}