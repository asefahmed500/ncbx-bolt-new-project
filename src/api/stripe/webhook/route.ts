
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

  console.log(`[Stripe Webhook] Received event: ${event.type}, ID: ${event.id}`);

  if (relevantEvents.has(event.type)) {
    try {
      await dbConnect();
      console.log('[Stripe Webhook] Database connected.');

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log('[Stripe Webhook] Handling checkout.session.completed for session ID:', session.id, "Mode:", session.mode);
          
          const userId = session.metadata?.userId;
          const customerId = session.customer as string;

          if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            console.warn('[Stripe Webhook] checkout.session.completed: Missing or invalid userId in metadata. Session ID:', session.id);
            break;
          }
           if (!customerId) {
            console.warn('[Stripe Webhook] checkout.session.completed: Missing customerId. Session ID:', session.id);
            break;
          }

          await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
          console.log(`[Stripe Webhook] User ${userId} updated with Stripe Customer ID ${customerId} if not already set.`);

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
            console.log(`[Stripe Webhook] Subscription created/updated for User ${userId}, Subscription ID ${subscription.id}, Status: ${subscription.status}`);
          } else if (session.mode === 'payment') {
            console.log(`[Stripe Webhook] Checkout session ${session.id} was for a one-time payment. PaymentIntent events will handle fulfillment.`);
          } else {
            console.log('[Stripe Webhook] Checkout session was not for a subscription or metadata missing, skipping subscription specific logic for ID:', session.id);
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Stripe Webhook] Handling ${event.type} for subscription ID:`, subscription.id);
          
          const customerId = subscription.customer as string;
          let user = await User.findOne({ stripeCustomerId: customerId });
          
          if (!user && subscription.metadata?.userId && mongoose.Types.ObjectId.isValid(subscription.metadata.userId)) {
             user = await User.findById(subscription.metadata.userId);
          }

          if (!user) {
            console.warn(`[Stripe Webhook] ${event.type}: User not found for customer ID ${customerId} or via metadata. Sub ID: ${subscription.id}`);
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
          console.log(`[Stripe Webhook] ${event.type}: Subscription ${subscription.id} updated/created for User ${user._id}. Status: ${subscription.status}, Price ID: ${subscription.items.data[0].price.id}`);
          break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            console.log(`[Stripe Webhook] Handling customer.subscription.deleted for subscription ID:`, subscription.id);
            const updatedSub = await Subscription.findOneAndUpdate(
              { stripeSubscriptionId: subscription.id },
              { stripeSubscriptionStatus: 'canceled' },
              { new: true }
            );
             if (updatedSub) {
                console.log(`[Stripe Webhook] Subscription ${subscription.id} marked as canceled for user ${updatedSub.userId}.`);
            } else {
                console.warn(`[Stripe Webhook] customer.subscription.deleted: Subscription ${subscription.id} not found in local DB to mark as canceled.`);
            }
            break;
        }
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log('[Stripe Webhook] Handling invoice.payment_succeeded for invoice ID:', invoice.id);
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
            console.log(`[Stripe Webhook] Subscription ${subscriptionId} updated on invoice.payment_succeeded. Status: ${subscription.status}`);
          } else if (invoice.payment_intent) {
            console.log(`[Stripe Webhook] Invoice ${invoice.id} paid (one-time or non-subscription). PaymentIntent ${invoice.payment_intent} success will handle specific fulfillment if needed.`);
          }
          break;
        }
         case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log('[Stripe Webhook] Handling invoice.payment_failed for invoice ID:', invoice.id);
           if (invoice.subscription) {
            const subscriptionId = invoice.subscription as string;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId); 
             await Subscription.findOneAndUpdate(
              { stripeSubscriptionId: subscriptionId },
              { stripeSubscriptionStatus: subscription.status } 
            );
            console.log(`[Stripe Webhook] Subscription ${subscriptionId} status updated to ${subscription.status} on invoice.payment_failed.`);
          }
          break;
        }
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Stripe Webhook] PaymentIntent ${paymentIntent.id} succeeded. Metadata:`, JSON.stringify(paymentIntent.metadata));

          const userId = paymentIntent.metadata.userId;
          const templateId = paymentIntent.metadata.templateId; // For template purchases
          const appliedCouponId = paymentIntent.metadata.appliedCouponId; // Get coupon ID from metadata

          if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            if (templateId && mongoose.Types.ObjectId.isValid(templateId)) {
              console.log(`[Stripe Webhook] Payment for template purchase. User ID: ${userId}, Template ID: ${templateId}`);
              const user = await User.findById(userId);
              if (user) {
                const templateObjectId = new mongoose.Types.ObjectId(templateId);
                if (!user.purchasedTemplateIds.some(id => id.equals(templateObjectId))) {
                  user.purchasedTemplateIds.push(templateObjectId);
                  await user.save();
                  console.log(`[Stripe Webhook] User ${userId} granted access to template ${templateId}.`);
                } else {
                  console.log(`[Stripe Webhook] User ${userId} already had access to template ${templateId}.`);
                }
              } else {
                console.warn(`[Stripe Webhook] User ${userId} not found for template purchase.`);
              }
            } else {
              console.log(`[Stripe Webhook] General payment (non-template specific) for user ${userId} of ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()} succeeded.`);
              // Other types of one-time purchases can be fulfilled here based on metadata.
            }

            // Increment coupon usage if a coupon was applied to this PaymentIntent
            if (appliedCouponId && mongoose.Types.ObjectId.isValid(appliedCouponId)) {
              const coupon = await Coupon.findById(appliedCouponId);
              if (coupon) {
                if (coupon.usageLimit === 0 || coupon.timesUsed < coupon.usageLimit) {
                  coupon.timesUsed += 1;
                  await coupon.save();
                  console.log(`[Stripe Webhook] Incremented usage for coupon ID ${appliedCouponId}. New count: ${coupon.timesUsed}`);
                } else {
                  console.warn(`[Stripe Webhook] Coupon ${appliedCouponId} usage limit already reached or issue with limit logic.`);
                }
              } else {
                console.warn(`[Stripe Webhook] Applied coupon ID ${appliedCouponId} not found in database for incrementing usage.`);
              }
            }

          } else {
            console.warn(`[Stripe Webhook] payment_intent.succeeded: Missing or invalid userId in PaymentIntent metadata. PI_ID: ${paymentIntent.id}`);
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.warn(`[Stripe Webhook] PaymentIntent ${paymentIntent.id} failed. Reason: ${paymentIntent.last_payment_error?.message}`);
          if (paymentIntent.metadata?.userId) {
            console.warn(`[Stripe Webhook] Payment failure for user ${paymentIntent.metadata.userId}.`);
          }
          break;
        }
        default:
          console.warn(`[Stripe Webhook] Unhandled relevant event type: ${event.type}`);
      }
    } catch (error) {
      console.error('[Stripe Webhook] Error processing webhook event:', error);
      return NextResponse.json({ error: 'Webhook handler failed. See server logs.' }, { status: 500 });
    }
  } else {
    console.log(`[Stripe Webhook] Received event type ${event.type}, which is not in relevantEvents set. Skipping.`);
  }

  return NextResponse.json({ received: true });
}
