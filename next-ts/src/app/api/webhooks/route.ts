import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import {
  updateUserByStripeCustomerId,
  getUserByStripeCustomerId,
  logSubscriptionEvent,
  createOrUpdateUser,
} from "@/lib/subscription";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to determine plan based on price ID
function getPlanFromPriceId(priceId: string): "FREE" | "STARTER" | "PREMIUM" {
  switch (priceId) {
    case "price_1RgPSWA6n49uMd1tnwoWS4AJ": // Starter plan price ID
      return "STARTER";
    case "price_1RgPT8A6n49uMd1tAfOGHR7W": // Premium plan price ID
      return "PREMIUM";
    default:
      return "FREE";
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  console.log("sig:", sig);
  console.log("webhook secret:", process.env.STRIPE_WEBHOOK_SECRET!);

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log(`Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;

        if (session.mode === "subscription") {
          const subscription = (await stripe.subscriptions.retrieve(
            session.subscription as string
          )) as Stripe.Subscription;

          const customer = await stripe.customers.retrieve(
            session.customer as string
          );

          // Find or create user
          let user = await getUserByStripeCustomerId(
            session.customer as string
          );

          if (!user && "email" in customer) {
            user = await createOrUpdateUser(
              customer.email!,
              customer.name || undefined,
              session.customer as string
            );
          }

          if (user) {
            const priceId = subscription.items.data[0].price.id;
            const plan = getPlanFromPriceId(priceId);

            await updateUserByStripeCustomerId(session.customer as string, {
              stripeSubscriptionId: subscription.id,
              stripePriceId: priceId,
              plan,
              stripeCurrentPeriodEnd: new Date(
                subscription.items.data[0].current_period_end * 1000
              ),
              subscriptionStatus: "ACTIVE",
            });

            await logSubscriptionEvent(user.id, {
              stripeEventId: event.id,
              eventType: event.type,
              subscriptionId: subscription.id,
              customerId: session.customer as string,
              priceId: priceId,
              status: subscription.status,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await getUserByStripeCustomerId(
          subscription.customer as string
        );

        if (user) {
          const priceId = subscription.items.data[0].price.id;
          const plan =
            subscription.status === "active"
              ? getPlanFromPriceId(priceId)
              : "FREE";
          const status = subscription.status.toUpperCase() as any;

          // Fix: Use subscription item's current_period_end instead of subscription-level property
          const endDate = new Date(
            subscription.items.data[0].current_period_end * 1000
          );

          await updateUserByStripeCustomerId(subscription.customer as string, {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: endDate,
            plan,
            subscriptionStatus: status,
          });

          await logSubscriptionEvent(user.id, {
            stripeEventId: event.id,
            eventType: event.type,
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            priceId: priceId,
            status: subscription.status,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const user = await getUserByStripeCustomerId(
          subscription.customer as string
        );

        if (user) {
          await updateUserByStripeCustomerId(subscription.customer as string, {
            plan: "FREE",
            subscriptionStatus: "CANCELED",
          });

          await logSubscriptionEvent(user.id, {
            stripeEventId: event.id,
            eventType: event.type,
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            status: "canceled",
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.id) {
          const user = await getUserByStripeCustomerId(
            invoice.customer as string
          );

          if (user) {
            await updateUserByStripeCustomerId(invoice.customer as string, {
              subscriptionStatus: "PAST_DUE",
            });

            await logSubscriptionEvent(user.id, {
              stripeEventId: event.id,
              eventType: event.type,
              subscriptionId: invoice.id as string,
              customerId: invoice.customer as string,
              status: "past_due",
            });
          }
        }
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      {
        error: `Webhook Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
