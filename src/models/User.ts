
import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string; 
  avatarUrl?: string;
  role: 'user' | 'admin';
  stripeCustomerId?: string; 
  projectsUsed?: number; // Conceptual field for usage limits
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
    stripeCustomerId: { 
      type: String,
      unique: true,
      sparse: true, 
    },
    projectsUsed: { // Conceptual field for usage limits
        type: Number,
        default: 0,
    }
  },
  {
    timestamps: true, 
  }
);

const User = models.User || model<IUser>('User', UserSchema);

export default User;
