
import mongoose, { Schema, type Document } from 'mongoose';

export interface IPageComponent extends Document {
  _id?: string | mongoose.Types.ObjectId;
  type: string;
  config: any; // Using `any` for maximal flexibility, as Zod/AI will handle structure.
  order: number;
  label?: string; // For editor UI, if different from type
  createdAt?: Date;
  updatedAt?: Date;
}

export const PageComponentSchema = new Schema<IPageComponent>(
  {
    type: {
      type: String,
      required: [true, 'Component type is required.'],
    },
    config: {
      type: Schema.Types.Mixed,
      required: [true, 'Component configuration is required.'],
      default: {},
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    label: { // Optional label for editor UI
      type: String,
    }
  },
  { _id: true, timestamps: true }
);

// No need to register as a model if only embedded
