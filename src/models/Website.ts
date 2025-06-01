import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IWebsite extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  customDomain?: string;
  subdomain: string; // For *.yourapp.com, ensure it's unique
  // pages will reference the Page model
  pageIds: mongoose.Schema.Types.ObjectId[];
  templateId?: mongoose.Schema.Types.ObjectId; // Optional: if website was created from a template
  globalSettings?: {
    faviconUrl?: string;
    primaryColor?: string; // Example: can store theme overrides
    secondaryColor?: string;
    fontFamily?: string;
  };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSchema = new Schema<IWebsite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
    },
    name: {
      type: String,
      required: [true, 'Website name is required.'],
      trim: true,
    },
    customDomain: {
      type: String,
      trim: true,
      sparse: true, // Allows null/undefined values without violating uniqueness if set to unique
      // Add custom validation for domain format if needed
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      // Add validation for subdomain format (e.g., alphanumeric, no spaces)
    },
    pageIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Page',
    }],
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
      required: false,
    },
    globalSettings: {
      faviconUrl: String,
      primaryColor: String,
      secondaryColor: String,
      fontFamily: String,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
WebsiteSchema.index({ userId: 1 });
WebsiteSchema.index({ subdomain: 1 }, { unique: true });
WebsiteSchema.index({ customDomain: 1 }, { unique: true, sparse: true }); // sparse allows multiple nulls if not unique

const Website = models.Website || model<IWebsite>('Website', WebsiteSchema);

export default Website;
