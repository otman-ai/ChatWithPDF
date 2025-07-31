import {NextRequest, NextResponse} from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) { 

    try {
      const { priceId, userId } = await request.json();

      console.log(priceId)
      const authSession = await getServerSession(authOptions);
      const email = authSession?.user?.email ?? undefined;

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, {status:404});
      }

      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: {
            userId: user.id,
          },
        });
        
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `https://chat.tswira.com/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://chat.tswira.com/pricing`,
        allow_promotion_codes: true,
        metadata: {
          userId: user.id,
        },
      });

      return NextResponse.json({ sessionId: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return NextResponse.json({ error: 'Error creating checkout session' }, {status:500});
    }
  } 