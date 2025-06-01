
import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IAffiliate extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  referralCode: string;
  commissionRate: number; // Percentage, e.g., 20 for 20%
  balance: number; // Current unpaid commission balance (in cents)
  totalEarned: number; // Total commission earned historically (in cents)
  isActive: boolean;
  // paymentDetails for Stripe Connect ID, PayPal, etc. - to be added later
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateSchema = new Schema<IAffiliate>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // A user can only be an affiliate once
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Consider adding a default generator for referral codes
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100, // Assuming percentage
      default: 10, // Example: 10% commission
    },
    balance: { // In cents
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: { // In cents
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // paymentDetails: Schema.Types.Mixed, // For future payment integration
  },
  {
    timestamps: true,
  }
);

AffiliateSchema.index({ userId: 1 });
AffiliateSchema.index({ referralCode: 1 });

const Affiliate = models.Affiliate || model<IAffiliate>('Affiliate', AffiliateSchema);

export default Affiliate;
