
import mongoose, { Schema, model, models, type Document } from 'mongoose';
import { PageComponentSchema, type IPageComponent } from './PageComponent';

// Define an interface for the structure of a page within a template
interface ITemplatePage {
  name: string;
  slug: string;
  elements: IPageComponent[]; // Embedded structure for template pages
  seoTitle?: string;
  seoDescription?: string;
}

// Define the schema for a page within a template
const TemplatePageSchema = new Schema<ITemplatePage>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  elements: [PageComponentSchema],
  seoTitle: { type: String, trim: true },
  seoDescription: { type: String, trim: true },
}, { _id: false }); // _id: false because these are subdocuments

export type TemplateStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface ITemplate extends Document {
  name: string;
  description?: string;
  previewImageUrl?: string;
  category?: string;
  pages: ITemplatePage[]; // Array of predefined pages for the template
  isPremium: boolean;
  price?: number; // In cents, only if isPremium is true
  liveDemoUrl?: string; // URL for a live interactive preview
  tags?: string[]; // For categorization and filtering
  viewCount: number; // How many times the template details have been viewed
  usageCount: number; // How many times the template has been used/selected
  status: TemplateStatus;
  createdByUserId?: mongoose.Schema.Types.ObjectId; // User who created this template
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: [true, 'Template name is required.'],
      trim: true,
      // Not necessarily unique if users can submit with same name initially, admin might rename
    },
    description: {
      type: String,
      trim: true,
    },
    previewImageUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    pages: [TemplatePageSchema], // Array of embedded template page structures
    isPremium: {
      type: Boolean,
      default: false,
    },
    price: { // Price in cents
      type: Number,
      min: 0,
      validate: {
        validator: function(this: ITemplate, value: number | undefined) {
          if (this.isPremium) {
            return typeof value === 'number' && value >= 0;
          }
          return true;
        },
        message: 'Price must be a non-negative number for premium templates.',
      },
    },
    liveDemoUrl: {
      type: String,
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected'],
      default: 'pending_approval', // Default for user submissions
      required: true,
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // System templates might not have this
    }
  },
  {
    timestamps: true,
  }
);

TemplateSchema.index({ name: 1 });
TemplateSchema.index({ category: 1 });
TemplateSchema.index({ isPremium: 1 });
TemplateSchema.index({ tags: 1 });
TemplateSchema.index({ status: 1 });
TemplateSchema.index({ createdByUserId: 1 });


const Template = models.Template || model<ITemplate>('Template', TemplateSchema);

export default Template;
