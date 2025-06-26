
import mongoose, { Schema, model, models, type Document } from 'mongoose';

export type AiInteractionStatus = 'success' | 'error' | 'clarification_needed';

export interface IAiInteractionLog extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  websiteId?: mongoose.Schema.Types.ObjectId;
  prompt: string;
  response?: string; // The user-facing explanation from the AI
  status: AiInteractionStatus;
  errorDetails?: string; // If status is 'error'
  createdAt: Date;
  updatedAt: Date;
}

const AiInteractionLogSchema = new Schema<IAiInteractionLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: 'Website',
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['success', 'error', 'clarification_needed'],
      required: true,
    },
    errorDetails: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

AiInteractionLogSchema.index({ userId: 1 });
AiInteractionLogSchema.index({ status: 1 });
AiInteractionLogSchema.index({ websiteId: 1 });


const AiInteractionLog =
  models.AiInteractionLog || model<IAiInteractionLog>('AiInteractionLog', AiInteractionLogSchema);

export default AiInteractionLog;
