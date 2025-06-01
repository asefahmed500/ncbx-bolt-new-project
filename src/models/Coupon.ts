
import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  isActive: boolean;
  usageLimit: number;
  timesUsed: number;
  userUsageLimit: number; // Max times a single user can use this. 0 for unlimited.
  expiresAt?: Date;
  minPurchaseAmount?: number; // In cents
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed_amount'],
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(this: ICoupon, value: number) {
          if (this.discountType === 'percentage') {
            return value >= 0 && value <= 100;
          }
          return value >= 0;
        },
        message: (props: any) => {
          if (props.parent.discountType === 'percentage') {
            return 'Percentage discount value must be between 0 and 100.';
          }
          return 'Discount value must be non-negative.';
        }
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: { // Total times this coupon can be used across all users
      type: Number,
      default: 100, // Default to 100 uses
      min: 0, // 0 for unlimited (though typically handled by a very large number or specific logic)
    },
    timesUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    userUsageLimit: { // Max times a single user can use this coupon
      type: Number,
      default: 1, // Default to once per user
      min: 0, // 0 for unlimited for a user
    },
    expiresAt: {
      type: Date,
    },
    minPurchaseAmount: { // In cents
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index is automatically created for `code` due to `unique: true`.
CouponSchema.index({ isActive: 1, expiresAt: 1 });

// Pre-save hook to ensure timesUsed does not exceed usageLimit (if usageLimit is not 0)
CouponSchema.pre('save', function(next) {
  if (this.usageLimit > 0 && this.timesUsed > this.usageLimit) {
    return next(new Error('Coupon usage limit exceeded.'));
  }
  // Consider per-user usage limit validation if a mechanism to track user uses is implemented
  next();
});


const Coupon = models.Coupon || model<ICoupon>('Coupon', CouponSchema);

export default Coupon;
