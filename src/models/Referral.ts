
import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IReferral extends Document {
  affiliateId: mongoose.Schema.Types.ObjectId; // Link to the Affiliate (or User) who made the referral
  referredUserId: mongoose.Schema.Types.ObjectId; // The user who was referred
  source: 'signup' | 'subscription' | 'one_time_payment'; // What triggered the referral
  sourceId?: string; // e.g., Stripe Subscription ID, PaymentIntent ID, or Order ID from your system
  originalAmount?: number; // Original amount of the transaction (in cents)
  commissionRateSnapshot?: number; // Commission rate at the time of referral (in case affiliate rate changes)
  commissionEarned: number; // Commission earned from this referral (in cents)
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'refunded';
  notes?: string; // Admin notes
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'Affiliate', // Or directly to 'User' if affiliates don't have a separate Affiliate record
      required: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: {
      type: String,
      enum: ['signup', 'subscription', 'one_time_payment'],
      required: true,
    },
    sourceId: {
      type: String, // Could be Stripe ID, order ID etc.
    },
    originalAmount: { // In cents
      type: Number,
      min: 0,
    },
    commissionRateSnapshot: { // Percentage
      type: Number,
      min: 0,
      max: 100,
    },
    commissionEarned: { // In cents
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected', 'refunded'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ReferralSchema.index({ affiliateId: 1, status: 1 });
ReferralSchema.index({ referredUserId: 1 });
ReferralSchema.index({ sourceId: 1 });

const Referral = models.Referral || model<IReferral>('Referral', ReferralSchema);

export default Referral;
