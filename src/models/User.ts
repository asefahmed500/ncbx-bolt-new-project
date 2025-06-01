
import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string; // Optional because it's not always returned, and not present for OAuth users (if added later)
  avatarUrl?: string;
  role: 'user' | 'admin';
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
      unique: true, // This implies an index and handles uniqueness at DB level
      trim: true,
      lowercase: true, // Ensures email is stored in lowercase
      match: [/.+@.+\..+/, 'Please enter a valid email address.'],
    },
    password: {
      type: String,
      select: false, // Prevent password from being returned by default in queries
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user', // Default role for new users
      required: true,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// The unique: true option on the email field automatically creates the necessary index.
// No need for UserSchema.index({ email: 1 });

const User = models.User || model<IUser>('User', UserSchema);

export default User;
