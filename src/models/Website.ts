
import mongoose, { Schema, model, models, type Document } from 'mongoose';

export type WebsiteStatus = 'draft' | 'published' | 'unpublished' | 'error_publishing';
export type DomainConnectionStatus = 'unconfigured' | 'pending_verification' | 'verified' | 'error_dns' | 'error_ssl';

export interface IWebsite extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  customDomain?: string;
  domainStatus?: DomainConnectionStatus;
  dnsInstructions?: string;
  subdomain: string;
  templateId?: mongoose.Schema.Types.ObjectId;
  status: WebsiteStatus;
  lastPublishedAt?: Date;

  // Version control fields
  currentVersionId?: mongoose.Schema.Types.ObjectId; // Points to the WebsiteVersion being edited
  publishedVersionId?: mongoose.Schema.Types.ObjectId; // Points to the live WebsiteVersion

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
    },
    domainStatus: {
      type: String,
      enum: ['unconfigured', 'pending_verification', 'verified', 'error_dns', 'error_ssl'],
      default: 'unconfigured',
    },
    dnsInstructions: {
      type: String,
      trim: true,
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is required.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
      required: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'unpublished', 'error_publishing'],
      default: 'draft',
      required: true,
    },
    lastPublishedAt: {
      type: Date,
    },
    currentVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'WebsiteVersion',
      required: false,
    },
    publishedVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'WebsiteVersion',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
WebsiteSchema.index({ userId: 1 });
WebsiteSchema.index({ subdomain: 1 }, { unique: true });
WebsiteSchema.index({ customDomain: 1 }, { unique: true, sparse: true });
WebsiteSchema.index({ currentVersionId: 1 });
WebsiteSchema.index({ publishedVersionId: 1 });

const Website = models.Website || model<IWebsite>('Website', WebsiteSchema);

export default Website;
