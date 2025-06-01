
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Subscription from '@/models/Subscription';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
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

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  if (relevantEvents.has(event.type)) {
    try {
      await dbConnect();
      console.log('[Stripe Webhook] Database connected.');

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log('[Stripe Webhook] Handling checkout.session.completed for session ID:', session.id);
          if (!session.customer || !session.subscription || !session.metadata?.userId) {
            console.error('[Stripe Webhook] Error: Missing customer, subscription, or userId in session metadata for checkout.session.completed.');
            return NextResponse.json({ error: 'Missing data in session.' }, { status: 400 });
          }

          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          const userId = session.metadata.userId;

          // Retrieve the full subscription object to get price and period end
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
          console.log(`[Stripe Webhook] Updated User ${userId} with Stripe Customer ID ${customerId}`);
          
          await Subscription.create({
            userId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            stripeSubscriptionStatus: subscription.status,
          });
          console.log(`[Stripe Webhook] Created Subscription for User ${userId}, Subscription ID ${subscription.id}`);
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.created':
        case 'customer.subscription.deleted': { // Handles created, updated, and deleted (status change to canceled)
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
             // This might be redundant if checkout.session.completed is handled,
             // but good for subscriptions created directly via API/Stripe dashboard
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
              { stripeSubscriptionStatus: subscription.status } // Status will be e.g. 'past_due'
            );
            console.log(`[Stripe Webhook] Updated Subscription ${subscriptionId} status to ${subscription.status} on invoice.payment_failed.`);
          }
          // Optionally, send an email to the user about the failed payment.
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
