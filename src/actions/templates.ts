
"use server";

import dbConnect from "@/lib/dbConnect";
import Template, { type ITemplate, type TemplateStatus } from "@/models/Template";
import TemplateReview, { type ITemplateReview } from "@/models/TemplateReview"; // Import TemplateReview model
import User from "@/models/User"; 
import { z } from "zod";
import { auth } from "@/auth"; 
import type { IPageComponent } from "@/models/PageComponent";
import mongoose from "mongoose";

// Zod schema for input validation (basic for now)
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
    })).optional()
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
    return { success: "Template submitted successfully for approval.", template: savedTemplate.toObject() };

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


// --- Template Review Management ---

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

    // Check if the template exists
    const templateExists = await Template.findById(templateId);
    if (!templateExists) {
      return { error: "Template not found." };
    }

    // Check if the user has already reviewed this template
    const existingReview = await TemplateReview.findOne({ templateId, userId });
    if (existingReview) {
      // Optionally, allow updating existing review, or return error
      return { error: "You have already reviewed this template." };
      // To allow updates:
      // existingReview.rating = rating;
      // existingReview.comment = comment;
      // existingReview.isApproved = false; // Reset approval status if updated
      // const updatedReview = await existingReview.save();
      // return { success: "Review updated successfully.", review: updatedReview.toObject() };
    }

    const newReview = new TemplateReview({
      templateId,
      userId,
      rating,
      comment,
      isApproved: false, // Default to not approved, requires admin moderation
    });

    const savedReview = await newReview.save();

    console.log(`[SubmitTemplateReview Action] Review submitted for template ${templateId} by user ${userId}. Review ID: ${savedReview._id}`);
    return { success: "Review submitted successfully. It will be visible after approval.", review: savedReview.toObject() };

  } catch (error: any) {
    console.error("[SubmitTemplateReview Action] Error submitting review:", error);
    if (error.code === 11000) { // Duplicate key error (e.g., if unique index on templateId+userId is violated)
      return { error: "You might have already submitted a review for this template." };
    }
    if (error instanceof z.ZodError) {
      return { error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { error: `An unexpected error occurred: ${error.message || "Could not save review."}` };
  }
}
