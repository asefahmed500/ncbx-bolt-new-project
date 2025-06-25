
"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Coupon from "@/models/Coupon";
import { headers } from "next/headers";
import { z } from "zod";
import type Stripe from "stripe";

const CreateOneTimePaymentIntentInputSchema = z.object({
  amountInCents: z.number().int().positive("Amount must be a positive integer."),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code.").default('usd'),
  couponCode: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});
export type CreateOneTimePaymentIntentInput = z.infer<typeof CreateOneTimePaymentIntentInputSchema>;

export async function createStripeCheckoutSession(priceId: string, isSubscription: boolean = true) {
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
    const user = await User.findById(userId);

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

    const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: isSubscription ? "subscription" : "payment",
        success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/dashboard`,
        metadata: {
          userId: user._id.toString(),
        },
    };
    if (isSubscription) {
        checkoutSessionParams.allow_promotion_codes = true;
    }


    const checkoutSession = await stripe.checkout.sessions.create(checkoutSessionParams);

    if (!checkoutSession.url) {
      return { error: "Could not create Stripe Checkout session." };
    }

    return { sessionId: checkoutSession.id, url: checkoutSession.url };

  } catch (error: any) {
    console.error("[CreateCheckoutSession Action] Error:", error);
    return { error: `An unexpected error occurred: ${error.message}` };
  }
}

export async function createStripeCustomerPortalSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  try {
    await dbConnect();
    const user = await User.findById(userId);

    if (!user || !user.stripeCustomerId) {
      return { error: "Stripe customer ID not found for this user." };
    }
    
    const appUrl = process.env.APP_URL || headers().get("origin") || "http://localhost:9003";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    if (!portalSession.url) {
        return { error: "Could not create Stripe Customer Portal session." };
    }
    return { url: portalSession.url };

  } catch (error: any) {
    console.error("[CreateStripeCustomerPortalSession Action] Error:", error);
    return { error: `An unexpected error occurred: ${error.message}` };
  }
}


export async function createOneTimePaymentIntent(input: CreateOneTimePaymentIntentInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  const parsedInput = CreateOneTimePaymentIntentInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { error: `Invalid input: ${JSON.stringify(parsedInput.error.flatten())}` };
  }
  const { amountInCents, currency, couponCode, metadata } = parsedInput.data;

  let finalAmountInCents = amountInCents;
  let discountApplied = 0;
  let appliedCouponId: string | null = null;
  let appliedCouponCode: string | null = null;

  try {
    await dbConnect();

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

      if (!coupon) {
        return { error: "Invalid or inactive coupon code." };
      }
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return { error: "Coupon code has expired." };
      }
      if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
        return { error: "Coupon usage limit reached." };
      }
      if (coupon.minPurchaseAmount && amountInCents < coupon.minPurchaseAmount) {
        return { error: `Minimum purchase of ${coupon.minPurchaseAmount / 100} ${currency.toUpperCase()} required for this coupon.` };
      }

      if (coupon.discountType === 'percentage') {
        discountApplied = Math.round(amountInCents * (coupon.discountValue / 100));
      } else if (coupon.discountType === 'fixed_amount') {
        discountApplied = coupon.discountValue; // Assuming this is in cents
      }
      finalAmountInCents = Math.max(0, amountInCents - discountApplied);
      appliedCouponId = coupon._id.toString();
      appliedCouponCode = coupon.code;
    }

    const user = await User.findById(userId);
    if (!user) {
      return { error: "User not found." };
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    const paymentIntentMetadata: Record<string, string> = {
      userId: user._id.toString(),
      originalAmountInCents: amountInCents.toString(),
      discountAppliedInCents: discountApplied.toString(),
      finalAmountInCents: finalAmountInCents.toString(),
      ...(appliedCouponCode && { appliedCouponCode }),
      ...(appliedCouponId && { appliedCouponId }),
      ...(metadata && metadata),
    };

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmountInCents,
      currency: currency,
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: paymentIntentMetadata,
    });

    if (!paymentIntent.client_secret) {
      return { error: "Could not create PaymentIntent." };
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      finalAmount: finalAmountInCents,
      discountApplied: discountApplied,
      originalAmount: amountInCents,
      couponApplied: !!appliedCouponCode,
    };

  } catch (error: any) {
    console.error("[CreatePaymentIntent Action] Error:", error);
    if (error.name === 'MongoServerError' && error.code === 11000) {
        return { error: "A database error occurred with coupon data."};
    }
    if (error.message?.includes('Coupon usage limit exceeded')) {
        return { error: "Coupon usage limit exceeded."};
    }
    return { error: `An unexpected error occurred: ${error.message}` };
  }
}
