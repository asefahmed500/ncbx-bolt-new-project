
"use server";

import dbConnect from "@/lib/dbConnect";
import Template, { type ITemplate, type TemplateStatus } from "@/models/Template";
import User from "@/models/User"; // Assuming you might want to link to user
import { z } from "zod";
import { auth } from "@/auth"; // To get current user session
import type { IPageComponent } from "@/models/PageComponent";

// Zod schema for input validation (basic for now)
const CreateTemplateInputSchema = z.object({
  name: z.string().min(3, "Template name must be at least 3 characters long.").max(100),
  description: z.string().max(500).optional(),
  pages: z.array(z.object({ // Simplified page structure for now
    name: z.string(),
    slug: z.string(),
    elements: z.array(z.object({ // Simplified element structure
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
  template?: ITemplate; // Or a simplified version of ITemplate
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

    // Check for existing template with the same name (optional, depends on your rules)
    // const existingTemplate = await Template.findOne({ name });
    // if (existingTemplate) {
    //   return { error: "A template with this name already exists." };
    // }

    const newTemplate = new Template({
      name,
      description,
      pages: pages.map(p => ({
        name: p.name,
        slug: p.slug,
        elements: p.elements || [], // ensure elements is an array
        // seoTitle, seoDescription could be added if passed in input
      })),
      category,
      tags,
      isPremium,
      price: isPremium && price ? price : undefined, // Only set price if premium
      previewImageUrl,
      liveDemoUrl,
      status: 'pending_approval' as TemplateStatus, // Default status for user submissions
      createdByUserId: userId,
      viewCount: 0,
      usageCount: 0,
    });

    const savedTemplate = await newTemplate.save();

    console.log(`[CreateTemplate Action] Template "${savedTemplate.name}" submitted by user ${userId}. ID: ${savedTemplate._id}`);
    return { success: "Template submitted successfully for approval.", template: savedTemplate.toObject() };

  } catch (error: any) {
    console.error("[CreateTemplate Action] Error creating template:", error);
    if (error.code === 11000) { // Duplicate key error
      return { error: "A template with similar unique fields (e.g. name if unique index is set) might already exist." };
    }
    if (error instanceof z.ZodError) {
        return { error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { error: `An unexpected error occurred: ${error.message || "Could not save template."}` };
  }
}
