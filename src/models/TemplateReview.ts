
import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface ITemplateReview extends Document {
  templateId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  rating: number; // e.g., 1 to 5
  comment?: string;
  isApproved: boolean; // For admin moderation of reviews
  createdAt: Date;
  updatedAt: Date;
}

const TemplateReviewSchema = new Schema<ITemplateReview>(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isApproved: { // For admin moderation
      type: Boolean,
      default: false, // Reviews might need approval before being public
    },
  },
  {
    timestamps: true,
  }
);

TemplateReviewSchema.index({ templateId: 1, userId: 1 }, { unique: true }); // User can review a template once
TemplateReviewSchema.index({ templateId: 1, isApproved: 1, createdAt: -1 }); // For fetching approved reviews

const TemplateReview = models.TemplateReview || model<ITemplateReview>('TemplateReview', TemplateReviewSchema);

export default TemplateReview;
