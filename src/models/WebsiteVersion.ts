
import mongoose, { Schema, model, models, type Document } from 'mongoose';
import { PageComponentSchema, type IPageComponent } from './PageComponent'; // Assuming this is the structure for elements

// Interface for a page snapshot within a WebsiteVersion
export interface IWebsiteVersionPage {
  name: string;
  slug: string;
  elements: IPageComponent[];
  seoTitle?: string;
  seoDescription?: string;
}

// Schema for a page snapshot within a WebsiteVersion
const WebsiteVersionPageSchema = new Schema<IWebsiteVersionPage>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  elements: [PageComponentSchema], // Embeds the actual component data
  seoTitle: { type: String, trim: true },
  seoDescription: { type: String, trim: true },
}, { _id: false });

export interface IWebsiteVersion extends Document {
  websiteId: mongoose.Schema.Types.ObjectId;
  versionNumber: number; // Could be auto-incrementing per website or timestamp-based
  name?: string; // User-defined name for the version
  description?: string; // User-defined description
  pages: IWebsiteVersionPage[]; // Snapshot of all pages and their content
  globalSettings?: { // Snapshot of global settings
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  createdAt: Date;
  createdByUserId?: mongoose.Schema.Types.ObjectId; // User who triggered this version save
}

const WebsiteVersionSchema = new Schema<IWebsiteVersion>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true, // Can be managed by an application-level counter or timestamp
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    pages: [WebsiteVersionPageSchema], // Array of embedded page structures
    globalSettings: {
      type: Schema.Types.Mixed, // Flexible object for global settings
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt for immutable versions
  }
);

WebsiteVersionSchema.index({ websiteId: 1, versionNumber: -1 }); // For ordering versions
WebsiteVersionSchema.index({ websiteId: 1, createdAt: -1 });

const WebsiteVersion =
  models.WebsiteVersion || model<IWebsiteVersion>('WebsiteVersion', WebsiteVersionSchema);

export default WebsiteVersion;
