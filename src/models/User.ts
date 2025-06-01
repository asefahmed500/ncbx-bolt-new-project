import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string; // Password should be hashed before saving
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
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
      // Select: false to prevent password from being returned by default
    },
    avatarUrl: {
      type: String,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// Indexes
UserSchema.index({ email: 1 });

const User = models.User || model<IUser>('User', UserSchema);

export default User;
