
"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User"; 
import Coupon from "@/models/Coupon"; 
import { headers } from "next/headers"; 

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
      allow_promotion_codes: true,
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

export async function createOneTimePaymentIntent(
  amountInCents: number,
  currency: string = 'usd',
  couponCode?: string,
  metadata?: Record<string, string> // Added metadata parameter
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
  let couponId: string | null = null;

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
        discountApplied = coupon.discountValue; 
      }
      finalAmountInCents = Math.max(0, amountInCents - discountApplied); 
      couponId = coupon._id.toString();
      console.log(`[CreatePaymentIntent Action] Coupon ${couponCode} applied. Original: ${amountInCents}, Discount: ${discountApplied}, Final: ${finalAmountInCents}`);
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

    const paymentIntentMetadata = {
      userId: user._id.toString(),
      originalAmount: amountInCents.toString(),
      discountApplied: discountApplied.toString(),
      ...(couponCode && { appliedCouponCode: couponCode }),
      ...(couponId && { appliedCouponId: couponId }),
      ...(metadata && metadata), // Merge additional metadata
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

    if (couponId && paymentIntent.id) {
      await Coupon.findByIdAndUpdate(couponId, { $inc: { timesUsed: 1 } });
      console.log(`[CreatePaymentIntent Action] Incremented usage for coupon ID ${couponId}`);
    }

    console.log(`[CreatePaymentIntent Action] Created PaymentIntent ${paymentIntent.id} for user ${userId}. Final amount: ${finalAmountInCents}. Metadata: ${JSON.stringify(paymentIntentMetadata)}`);
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      finalAmount: finalAmountInCents,
      discountApplied: discountApplied,
      originalAmount: amountInCents,
      couponApplied: !!couponCode,
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
