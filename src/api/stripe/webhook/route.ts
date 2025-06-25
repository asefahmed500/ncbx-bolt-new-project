
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import Coupon from '@/models/Coupon'; // Import Coupon model
import mongoose from 'mongoose';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[Stripe Webhook] Error: Missing stripe-signature or webhook secret.');
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error constructing event: ${err.message}`);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }


  if (relevantEvents.has(event.type)) {
    try {
      await dbConnect();

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          const userId = session.metadata?.userId;
          const customerId = session.customer as string;

          if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            break;
          }
           if (!customerId) {
            break;
          }

          await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });

          if (session.mode === 'subscription' && session.subscription) {
            const subscriptionId = session.subscription as string;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            await Subscription.findOneAndUpdate(
              { stripeSubscriptionId: subscription.id },
              {
                userId,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: customerId,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                stripeSubscriptionStatus: subscription.status,
              },
              { upsert: true, new: true }
            );
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          
          const customerId = subscription.customer as string;
          let user = await User.findOne({ stripeCustomerId: customerId });
          
          if (!user && subscription.metadata?.userId && mongoose.Types.ObjectId.isValid(subscription.metadata.userId)) {
             user = await User.findById(subscription.metadata.userId);
          }

          if (!user) {
            break;
          }

          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            {
              userId: user._id,
              stripeCustomerId: customerId,
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              stripeSubscriptionStatus: subscription.status,
            },
            { upsert: true, new: true }
          );
          break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            await Subscription.findOneAndUpdate(
              { stripeSubscriptionId: subscription.id },
              { stripeSubscriptionStatus: 'canceled' },
              { new: true }
            );
            break;
        }
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            const subscriptionId = invoice.subscription as string;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await Subscription.findOneAndUpdate(
              { stripeSubscriptionId: subscriptionId },
              {
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                stripeSubscriptionStatus: subscription.status,
              },
              { new: true }
            );
          }
          break;
        }
         case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
           if (invoice.subscription) {
            const subscriptionId = invoice.subscription as string;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId); 
             await Subscription.findOneAndUpdate(
              { stripeSubscriptionId: subscriptionId },
              { stripeSubscriptionStatus: subscription.status } 
            );
          }
          break;
        }
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          const userId = paymentIntent.metadata.userId;
          const templateId = paymentIntent.metadata.templateId;
          const appliedCouponId = paymentIntent.metadata.appliedCouponId; 

          if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            if (templateId && mongoose.Types.ObjectId.isValid(templateId)) {
              const user = await User.findById(userId);
              if (user) {
                const templateObjectId = new mongoose.Types.ObjectId(templateId);
                if (!user.purchasedTemplateIds.some(id => id.equals(templateObjectId))) {
                  user.purchasedTemplateIds.push(templateObjectId);
                  await user.save();
                }
              }
            }

            // Increment coupon usage if a coupon was applied to this PaymentIntent
            if (appliedCouponId && mongoose.Types.ObjectId.isValid(appliedCouponId)) {
              const coupon = await Coupon.findById(appliedCouponId);
              if (coupon) {
                if (coupon.usageLimit === 0 || coupon.timesUsed < coupon.usageLimit) {
                  coupon.timesUsed += 1;
                  await coupon.save();
                }
              }
            }

          }
          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.warn(`[Stripe Webhook] PaymentIntent ${paymentIntent.id} failed. Reason: ${paymentIntent.last_payment_error?.message}`);
          break;
        }
        default:
          console.warn(`[Stripe Webhook] Unhandled relevant event type: ${event.type}`);
      }
    } catch (error) {
      console.error('[Stripe Webhook] Error processing webhook event:', error);
      return NextResponse.json({ error: 'Webhook handler failed. See server logs.' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

    