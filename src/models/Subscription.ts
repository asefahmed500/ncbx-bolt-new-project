
import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Schema.Types.ObjectId; // Reference to the User
  stripeSubscriptionId: string; // Stripe's subscription ID
  stripeCustomerId: string; // Stripe's customer ID
  stripePriceId: string; // Stripe's price ID for the subscribed plan
  stripeCurrentPeriodEnd: Date; // When the current subscription period ends
  stripeSubscriptionStatus: Stripe.Subscription.Status | string; // e.g., 'active', 'past_due', 'canceled', 'unpaid'
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true, // Each Stripe subscription ID should be unique
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    stripePriceId: {
      type: String,
      required: true,
    },
    stripeCurrentPeriodEnd: {
      type: Date,
      required: true,
    },
    stripeSubscriptionStatus: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ stripeCustomerId: 1 });
// Index for stripeSubscriptionId is automatically created due to `unique: true`.

const Subscription = models.Subscription || model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;
