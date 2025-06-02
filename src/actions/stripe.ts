
"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Coupon from "@/models/Coupon";
import { headers } from "next/headers";
import { STRIPE_PRICE_ID_PRO_MONTHLY } from "@/config/plans"; // Import your Price ID
import type Stripe from "stripe";

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


export async function createOneTimePaymentIntent(
  amountInCents: number,
  currency: string = 'usd',
  couponCode?: string,
  metadata?: Record<string, string>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  if (!amountInCents || amountInCents <= 0) {
    return { error: "Invalid amount." };
  }
  if (!currency) {
    return { error: "Currency is required."};
  }

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
      // TODO: Add per-user usage limit check here if needed

      if (coupon.discountType === 'percentage') {
        discountApplied = Math.round(amountInCents * (coupon.discountValue / 100));
      } else if (coupon.discountType === 'fixed_amount') {
        discountApplied = coupon.discountValue; // Assuming this is in cents
      }
      finalAmountInCents = Math.max(0, amountInCents - discountApplied);
      appliedCouponId = coupon._id.toString();
      appliedCouponCode = coupon.code; // Store the code to pass in metadata
      console.log(`[CreatePaymentIntent Action] Coupon ${couponCode} validated. Original: ${amountInCents}, Discount: ${discountApplied}, Final: ${finalAmountInCents}`);
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
      ...(appliedCouponCode && { appliedCouponCode }), // Use validated coupon code
      ...(appliedCouponId && { appliedCouponId }), // Pass coupon's DB ID
      ...(metadata && metadata), // Spread any additional metadata
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

    // REMOVED: Coupon usage increment. This will be handled by the payment_intent.succeeded webhook.
    // if (couponId && paymentIntent.id) {
    //   await Coupon.findByIdAndUpdate(couponId, { $inc: { timesUsed: 1 } });
    //   console.log(`[CreatePaymentIntent Action] Incremented usage for coupon ID ${couponId}`);
    // }

    console.log(`[CreatePaymentIntent Action] Created PaymentIntent ${paymentIntent.id} for user ${userId}. Final amount: ${finalAmountInCents}. Metadata: ${JSON.stringify(paymentIntentMetadata)}`);
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

