
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

export interface ITemplate extends Document {
  name: string;
  description?: string;
  previewImageUrl?: string;
  category?: string;
  pages: ITemplatePage[]; // Array of predefined pages for the template
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: [true, 'Template name is required.'],
      unique: true,
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

TemplateSchema.index({ name: 1 });
TemplateSchema.index({ category: 1 });

const Template = models.Template || model<ITemplate>('Template', TemplateSchema);

export default Template;
