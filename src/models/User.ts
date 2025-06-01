
import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string; 
  avatarUrl?: string;
  role: 'user' | 'admin';
  stripeCustomerId?: string; // Added for Stripe integration
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true, 
      trim: true,
      lowercase: true, 
      match: [/.+@.+\..+/, 'Please enter a valid email address.'],
    },
    password: {
      type: String,
      select: false, 
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user', 
      required: true,
    },
    stripeCustomerId: { // For associating the user with a Stripe Customer object
      type: String,
      unique: true,
      sparse: true, // Allows multiple null/undefined values but ensures uniqueness for actual values
    },
  },
  {
    timestamps: true, 
  }
);

// The unique: true option on the email field automatically creates the necessary index.
// UserSchema.index({ email: 1 }); // This was removed as it's redundant

const User = models.User || model<IUser>('User', UserSchema);

export default User;
