
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
  const appUrl = process.env.APP_URL || headers().get("origin") || "http://localhost:9002";

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
      // Create a new Stripe customer
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

    // Create a Stripe Checkout session
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
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`, // Or a dedicated success page
      cancel_url: `${appUrl}/dashboard`, // Or a dedicated cancel page
      metadata: {
        userId: user._id.toString(), // Pass userId to identify user in webhook
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
