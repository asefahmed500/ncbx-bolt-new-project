
"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import dbConnect from "@/lib/dbConnect";
import User, { type IUser } from "@/models/User";
import { headers } from "next/headers"; // To get current URL for redirects

export async function createStripeCheckoutSession(priceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const userId = session.user.id;
  const appUrl = process.env.APP_URL || headers().get("origin") || "http://localhost:9003";

  if (!priceId) {
    return { error: "Price ID is required." };
  }

  try {
    await dbConnect();
    let user = await User.findById(userId);

    if (!user) {
      return { error: "User not found." };
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard`,
      metadata: {
        userId: user._id.toString(),
      },
    });

    if (!checkoutSession.url) {
      return { error: "Could not create Stripe Checkout session." };
    }

    return { sessionId: checkoutSession.id, url: checkoutSession.url };

  } catch (error: any) {
    console.error("[CreateCheckoutSession Action] Error:", error);
    return { error: `An unexpected error occurred: ${error.message}` };
  }
}

export async function createOneTimePaymentIntent(amountInCents: number, currency: string = 'usd') {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  if (!amountInCents || amountInCents <= 0) {
    return { error: "Invalid amount." };
  }
  if (!currency) {
    return { error: "Currency is required."}
  }

  try {
    await dbConnect();
    let user = await User.findById(userId);

    if (!user) {
      return { error: "User not found." };
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      customer: stripeCustomerId,
      automatic_payment_methods: {
        enabled: true, // Allows Stripe to manage payment methods like cards, wallets, etc.
      },
      metadata: {
        userId: user._id.toString(),
        description: "One-time payment", // Customize as needed
      },
    });

    if (!paymentIntent.client_secret) {
      return { error: "Could not create PaymentIntent." };
    }

    console.log(`[CreatePaymentIntent Action] Created PaymentIntent ${paymentIntent.id} for user ${userId}`);
    return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };

  } catch (error: any) {
    console.error("[CreatePaymentIntent Action] Error:", error);
    return { error: `An unexpected error occurred: ${error.message}` };
  }
}
