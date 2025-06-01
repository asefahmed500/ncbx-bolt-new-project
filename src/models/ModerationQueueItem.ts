
import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IModerationQueueItem extends Document {
  contentType: string; // E.g., 'userPost', 'comment', 'websiteContentBlock'
  contentId: mongoose.Schema.Types.ObjectId; // ID of the actual content item
  contentRefModel: string; // Name of the Mongoose model for contentId (for dynamic ref)
  userId?: mongoose.Schema.Types.ObjectId; // User who created/owns the content
  reporterId?: mongoose.Schema.Types.ObjectId; // User who reported the content (if applicable)
  reason: string; // E.g., 'reported_by_user', 'flagged_by_ai_profanity', 'manual_review_request'
  details?: string; // Additional details about the flag or report
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  moderatorNotes?: string; // Notes by the moderator
  moderatedBy?: mongoose.Schema.Types.ObjectId; // User ID of the moderator
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ModerationQueueItemSchema = new Schema<IModerationQueueItem>(
  {
    contentType: {
      type: String,
      required: true,
      trim: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'contentRefModel', // Dynamic reference based on contentType
    },
    contentRefModel: { // The Mongoose model name for the dynamic ref
      type: String,
      required: true,
    },
    userId: { // User who created the content
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reporterId: { // User who reported it
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'escalated'],
      default: 'pending',
      required: true,
    },
    moderatorNotes: {
      type: String,
      trim: true,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ModerationQueueItemSchema.index({ status: 1, createdAt: -1 }); // For easy querying of pending items
ModerationQueueItemSchema.index({ contentType: 1, contentId: 1 });
ModerationQueueItemSchema.index({ userId: 1 });

const ModerationQueueItem =
  models.ModerationQueueItem || model<IModerationQueueItem>('ModerationQueueItem', ModerationQueueItemSchema);

export default ModerationQueueItem;
