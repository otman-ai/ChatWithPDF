import { prisma } from "@/lib/prisma";
import { stripe } from "./stripe";

export async function createOrUpdateUser(
  email: string,
  name?: string,
  stripeCustomerId?: string
) {
  return await prisma.user.upsert({
    where: { email },
    update: {
      name: name || undefined,
      stripeCustomerId: stripeCustomerId || undefined,
    },
    create: {
      email,
      name,
      stripeCustomerId,
      plan: "FREE",
      subscriptionStatus: "INACTIVE",
    },
  });
}

export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    stripeCurrentPeriodEnd?: Date;
    plan: "FREE" | "STARTER" | "PREMIUM";
    subscriptionStatus:
      | "ACTIVE"
      | "CANCELED"
      | "PAST_DUE"
      | "UNPAID"
      | "INACTIVE";
  }
) {
  return await prisma.user.update({
    where: { id: userId },
    data: subscriptionData,
  });
}

export async function updateUserByStripeCustomerId(
  stripeCustomerId: string,
  subscriptionData: {
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    stripeCurrentPeriodEnd?: Date;
    plan?: "FREE" | "STARTER" | "PREMIUM";
    subscriptionStatus:
      | "ACTIVE"
      | "CANCELED"
      | "PAST_DUE"
      | "UNPAID"
      | "INACTIVE";
  }
) {
  return await prisma.user.update({
    where: { stripeCustomerId },
    data: subscriptionData,
  });
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  return await prisma.user.findUnique({
    where: { stripeCustomerId },
  });
}

export async function logSubscriptionEvent(
  userId: string,
  eventData: {
    stripeEventId: string;
    eventType: string;
    subscriptionId?: string;
    customerId?: string;
    priceId?: string;
    status?: string;
  }
) {
  return await prisma.subscriptionEvent.create({
    data: {
      userId,
      ...eventData,
    },
  });
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  if (!user) return false;

  return (
    (user.plan === "PREMIUM" || user.plan === "STARTER") &&
    user.subscriptionStatus === "ACTIVE" &&
    !!user.stripeCurrentPeriodEnd &&
    user.stripeCurrentPeriodEnd > new Date()
  );
}
