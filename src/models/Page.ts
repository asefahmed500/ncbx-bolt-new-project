import mongoose, { Schema, model, models, type Document } from 'mongoose';
import { PageComponentSchema, type IPageComponent } from './PageComponent';

export interface IPage extends Document {
  websiteId: mongoose.Schema.Types.ObjectId;
  name: string; // e.g., "Homepage", "About Us"
  slug: string; // e.g., "/", "/about-us"
  elements: IPageComponent[]; // Embedded page components/elements
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'Website ID is required.'],
    },
    name: {
      type: String,
      required: [true, 'Page name is required.'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Page slug is required.'],
      trim: true,
      // Ensure slug is unique within the scope of a website (handled by compound index)
    },
    elements: [PageComponentSchema], // Array of embedded PageComponent documents
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure slug is unique per website
PageSchema.index({ websiteId: 1, slug: 1 }, { unique: true });
PageSchema.index({ websiteId: 1 });


const Page = models.Page || model<IPage>('Page', PageSchema);

export default Page;
