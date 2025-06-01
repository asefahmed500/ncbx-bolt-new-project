
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
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
          console.log('[Stripe Webhook] Handling checkout.session.completed for session ID:', session.id);
          if (session.mode === 'subscription' && session.customer && session.subscription && session.metadata?.userId) {
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;
            const userId = session.metadata.userId;

            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
            console.log(`[Stripe Webhook] Updated User ${userId} with Stripe Customer ID ${customerId}`);
            
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
            console.log(`[Stripe Webhook] Ensured Subscription for User ${userId}, Subscription ID ${subscription.id}`);
          } else {
            console.log('[Stripe Webhook] Checkout session was not for a subscription or metadata missing, skipping subscription specific logic for ID:', session.id);
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.created':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Stripe Webhook] Handling ${event.type} for subscription ID:`, subscription.id);
          
          const existingSubscription = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
          if (existingSubscription) {
            existingSubscription.stripePriceId = subscription.items.data[0].price.id;
            existingSubscription.stripeCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
            existingSubscription.stripeSubscriptionStatus = subscription.status;
            await existingSubscription.save();
            console.log(`[Stripe Webhook] Updated Subscription ${subscription.id}, Status: ${subscription.status}`);
          } else if (event.type === 'customer.subscription.created') {
            const customerId = subscription.customer as string;
            const user = await User.findOne({ stripeCustomerId: customerId });
            if (user) {
              await Subscription.create({
                userId: user._id,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: customerId,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                stripeSubscriptionStatus: subscription.status,
              });
              console.log(`[Stripe Webhook] Created Subscription (via ${event.type}) for User ${user._id}, Subscription ID ${subscription.id}`);
            } else {
               console.warn(`[Stripe Webhook] User not found for customer ID ${customerId} during ${event.type}`);
            }
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
              }
            );
            console.log(`[Stripe Webhook] Updated Subscription ${subscriptionId} on invoice.payment_succeeded.`);
          } else if (invoice.payment_intent) {
            console.log(`[Stripe Webhook] Invoice ${invoice.id} paid, related to PaymentIntent ${invoice.payment_intent}. PaymentIntent success will handle main logic.`);
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
            console.log(`[Stripe Webhook] Updated Subscription ${subscriptionId} status to ${subscription.status} on invoice.payment_failed.`);
          }
          break;
        }
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Stripe Webhook] PaymentIntent ${paymentIntent.id} succeeded. Metadata:`, JSON.stringify(paymentIntent.metadata));
          
          const userId = paymentIntent.metadata.userId;
          const templateId = paymentIntent.metadata.templateId;

          if (userId && templateId) {
            console.log(`[Stripe Webhook] Payment for template purchase. User ID: ${userId}, Template ID: ${templateId}`);
            const user = await User.findById(userId);
            if (user) {
              if (!user.purchasedTemplateIds.map(id => id.toString()).includes(templateId)) {
                user.purchasedTemplateIds.push(new mongoose.Types.ObjectId(templateId));
                await user.save();
                console.log(`[Stripe Webhook] User ${userId} granted access to template ${templateId}.`);
              } else {
                console.log(`[Stripe Webhook] User ${userId} already had access to template ${templateId}.`);
              }
            } else {
              console.warn(`[Stripe Webhook] User ${userId} not found for template purchase.`);
            }
          } else if (userId) {
             console.log(`[Stripe Webhook] General payment for user ${userId} of ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()} succeeded.`);
             // TODO: Fulfill other types of purchases based on metadata
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
