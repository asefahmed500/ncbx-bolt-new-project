
"use server";

import dbConnect from "@/lib/dbConnect";
import Template, { type ITemplate, type TemplateStatus } from "@/models/Template";
import TemplateReview, { type ITemplateReview } from "@/models/TemplateReview";
import User from "@/models/User"; 
import { z } from "zod";
import { auth } from "@/auth"; 
import type { IPageComponent } from "@/models/PageComponent";
import mongoose from "mongoose";

// Helper to deeply serialize an object, converting ObjectIds and other non-plain types
const serializeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof mongoose.Types.ObjectId) {
    return obj.toString();
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeObject);
  }
  
  if (typeof obj === 'object') {
    const plainObject: { [key: string]: any } = {};
    const source = typeof obj.toObject === 'function' ? obj.toObject({ transform: false, virtuals: false }) : obj;

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        plainObject[key] = serializeObject(source[key]);
      }
    }
    if (source._id && source._id instanceof mongoose.Types.ObjectId) plainObject._id = source._id.toString();
    if (source.userId && source.userId instanceof mongoose.Types.ObjectId) plainObject.userId = source.userId.toString();
    if (source.templateId && source.templateId instanceof mongoose.Types.ObjectId) plainObject.templateId = source.templateId.toString();
    if (source.createdByUserId && source.createdByUserId instanceof mongoose.Types.ObjectId) plainObject.createdByUserId = source.createdByUserId.toString();
    
    // For ITemplate specific nested serialization
    if (source.pages && Array.isArray(source.pages)) {
      plainObject.pages = source.pages.map((page: any) => {
        const plainPage = serializeObject(page);
        if (page.elements && Array.isArray(page.elements)) {
          plainPage.elements = page.elements.map((el: any) => serializeObject(el));
        }
        return plainPage;
      });
    }
    return plainObject;
  }
  return obj;
};


const CreateTemplateInputSchema = z.object({
  name: z.string().min(3, "Template name must be at least 3 characters long.").max(100),
  description: z.string().max(500).optional(),
  pages: z.array(z.object({ 
    name: z.string(),
    slug: z.string(),
    elements: z.array(z.object({ 
        type: z.string(),
        config: z.record(z.any()),
        order: z.number()
    })).optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  })).min(1, "Template must have at least one page."),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPremium: z.boolean().default(false),
  price: z.number().min(0).optional(),
  previewImageUrl: z.string().url().optional(),
  liveDemoUrl: z.string().url().optional(),
});

export type CreateTemplateInput = z.infer<typeof CreateTemplateInputSchema>;

interface CreateTemplateOutput {
  success?: string;
  error?: string;
  template?: ITemplate; 
}

export async function createTemplate(input: CreateTemplateInput): Promise<CreateTemplateOutput> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated. Please log in." };
  }
  const userId = session.user.id;

  try {
    const parsedInput = CreateTemplateInputSchema.safeParse(input);
    if (!parsedInput.success) {
      const fieldErrors = parsedInput.error.flatten().fieldErrors;
      const errorMessages = Object.values(fieldErrors).flat().join(" ");
      return { error: `Invalid input: ${errorMessages || "Check your fields."}` };
    }

    const { name, description, pages, category, tags, isPremium, price, previewImageUrl, liveDemoUrl } = parsedInput.data;

    await dbConnect();

    const newTemplate = new Template({
      name,
      description,
      pages: pages.map(p => ({
        name: p.name,
        slug: p.slug,
        elements: p.elements || [], 
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
      })),
      category,
      tags,
      isPremium,
      price: isPremium && price ? price : undefined, 
      previewImageUrl,
      liveDemoUrl,
      status: 'pending_approval' as TemplateStatus, 
      createdByUserId: userId,
      viewCount: 0,
      usageCount: 0,
    });

    const savedTemplate = await newTemplate.save();

    console.log(`[CreateTemplate Action] Template "${savedTemplate.name}" submitted by user ${userId}. ID: ${savedTemplate._id}`);
    return { success: "Template submitted successfully for approval.", template: serializeObject(savedTemplate) };

  } catch (error: any) {
    console.error("[CreateTemplate Action] Error creating template:", error);
    if (error.code === 11000) { 
      return { error: "A template with similar unique fields (e.g. name if unique index is set) might already exist." };
    }
    if (error instanceof z.ZodError) {
        return { error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { error: `An unexpected error occurred: ${error.message || "Could not save template."}` };
  }
}

const SubmitTemplateReviewInputSchema = z.object({
  templateId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid template ID",
  }),
  rating: z.number().min(1, "Rating must be at least 1.").max(5, "Rating cannot exceed 5."),
  comment: z.string().max(1000, "Comment cannot exceed 1000 characters.").optional(),
});

export type SubmitTemplateReviewInput = z.infer<typeof SubmitTemplateReviewInputSchema>;

interface SubmitTemplateReviewOutput {
  success?: string;
  error?: string;
  review?: ITemplateReview;
}

export async function submitTemplateReview(input: SubmitTemplateReviewInput): Promise<SubmitTemplateReviewOutput> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated. Please log in to submit a review." };
  }
  const userId = session.user.id;

  try {
    const parsedInput = SubmitTemplateReviewInputSchema.safeParse(input);
    if (!parsedInput.success) {
      const fieldErrors = parsedInput.error.flatten().fieldErrors;
      const errorMessages = Object.values(fieldErrors).flat().join(" ");
      return { error: `Invalid input: ${errorMessages || "Check your fields."}` };
    }

    const { templateId, rating, comment } = parsedInput.data;

    await dbConnect();

    const templateExists = await Template.findById(templateId);
    if (!templateExists) {
      return { error: "Template not found." };
    }

    const existingReview = await TemplateReview.findOne({ templateId, userId });
    if (existingReview) {
      return { error: "You have already reviewed this template." };
    }

    const newReview = new TemplateReview({
      templateId,
      userId,
      rating,
      comment,
      isApproved: false, 
    });

    const savedReview = await newReview.save();

    console.log(`[SubmitTemplateReview Action] Review submitted for template ${templateId} by user ${userId}. Review ID: ${savedReview._id}`);
    return { success: "Review submitted successfully. It will be visible after approval.", review: serializeObject(savedReview) };

  } catch (error: any) {
    console.error("[SubmitTemplateReview Action] Error submitting review:", error);
    if (error.code === 11000) { 
      return { error: "You might have already submitted a review for this template." };
    }
    if (error instanceof z.ZodError) {
      return { error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { error: `An unexpected error occurred: ${error.message || "Could not save review."}` };
  }
}


interface GetApprovedTemplatesResult {
  templates?: ITemplate[];
  totalTemplates?: number;
  error?: string;
}
const GetTemplatesInputSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(100), // Default to a higher limit for gallery
  categoryFilter: z.string().optional(),
});

export async function getApprovedTemplates(input: z.infer<typeof GetTemplatesInputSchema>): Promise<GetApprovedTemplatesResult> {
  const { page, limit, categoryFilter } = GetTemplatesInputSchema.parse(input);
  try {
    await dbConnect();
    const query: mongoose.FilterQuery<ITemplate> = { status: 'approved' };
    if (categoryFilter && categoryFilter !== 'all') {
      query.category = categoryFilter;
    }

    const skip = (page - 1) * limit;
    const templatesFromDB = await Template.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const totalTemplates = await Template.countDocuments(query);
    return { templates: serializeObject(templatesFromDB), totalTemplates };
  } catch (error: any) {
    return { error: "Failed to fetch approved templates: " + error.message };
  }
}

    