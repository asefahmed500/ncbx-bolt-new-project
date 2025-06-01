
import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string; 
  avatarUrl?: string;
  role: 'user' | 'admin';
  isActive: boolean; // Added for admin management
  stripeCustomerId?: string; 
  projectsUsed?: number; // Conceptual field for usage limits
  purchasedTemplateIds: mongoose.Schema.Types.ObjectId[]; // For paid templates
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
    isActive: { // For admin to suspend/activate users
      type: Boolean,
      default: true,
    },
    stripeCustomerId: { 
      type: String,
      unique: true,
      sparse: true, 
    },
    projectsUsed: { // Conceptual field for usage limits
        type: Number,
        default: 0,
    },
    purchasedTemplateIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Template'
    }]
  },
  {
    timestamps: true, 
  }
);

// Indexes are automatically created for fields with `unique: true`.
// Explicit UserSchema.index({ email: 1 }); and UserSchema.index({ stripeCustomerId: 1 }); are redundant.
UserSchema.index({ isActive: 1 });


const User = models.User || model<IUser>('User', UserSchema);

export default User;
