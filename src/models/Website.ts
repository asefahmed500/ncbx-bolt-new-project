

import mongoose, { Schema, model, models, type Document, type Types } from 'mongoose';
import type { IPageComponent } from './PageComponent'; // Ensure this path is correct

export type WebsiteStatus = 'draft' | 'published' | 'unpublished' | 'error_publishing';
export type DomainConnectionStatus = 'unconfigured' | 'pending_verification' | 'verified' | 'error_dns' | 'error_ssl';

// Interface for a page snapshot within a WebsiteVersion (used here as well for clarity on what WebsiteVersion.pages holds)
export interface IWebsiteVersionPage {
  _id?: string | Types.ObjectId; // Added _id as it's useful for client-side keying, Mongoose subdocs can have it
  name: string;
  slug: string;
  elements: IPageComponent[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: Date; // Mongoose subdocs can have timestamps if schema configured
  updatedAt?: Date;
}


export interface IWebsiteVersion extends Document {
  websiteId: Types.ObjectId;
  versionNumber: number;
  name?: string;
  description?: string;
  pages: IWebsiteVersionPage[];
  globalSettings?: {
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    siteName?: string; // Added siteName to global settings
  };
  createdAt: Date;
  createdByUserId?: Types.ObjectId;
}


export interface IWebsite extends Document {
  userId: Types.ObjectId;
  name: string;
  customDomain?: string;
  domainStatus?: DomainConnectionStatus;
  dnsInstructions?: string;
  subdomain: string;
  templateId?: Types.ObjectId;
  status: WebsiteStatus;
  lastPublishedAt?: Date;
  currentVersionId?: Types.ObjectId;
  publishedVersionId?: Types.ObjectId;
  // For convenience, currentVersion can be populated if needed, but it's not stored directly on IWebsite
  currentVersion?: IWebsiteVersion; 
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
WebsiteSchema.index({ customDomain: 1 }, { unique: true, sparse: true });
WebsiteSchema.index({ currentVersionId: 1 });
WebsiteSchema.index({ publishedVersionId: 1 });

const Website = models.Website || model<IWebsite>('Website', WebsiteSchema);

export default Website;
