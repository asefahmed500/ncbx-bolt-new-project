
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import AiInteractionLog, { type AiInteractionStatus } from "@/models/AiInteractionLog";
import { z } from "zod";
import mongoose from "mongoose";

const LogAiInteractionInputSchema = z.object({
  websiteId: z.string().optional(),
  prompt: z.string(),
  response: z.string().optional(),
  status: z.enum(['success', 'error', 'clarification_needed']),
  errorDetails: z.string().optional(),
});
export type LogAiInteractionInput = z.infer<typeof LogAiInteractionInputSchema>;

export async function logAiInteraction(input: LogAiInteractionInput): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    // Fail silently, as logging is non-critical to user experience
    return { success: false, error: "User not authenticated" };
  }
  
  const parsedInput = LogAiInteractionInputSchema.safeParse(input);
  if (!parsedInput.success) {
      console.error("[logAiInteraction] Invalid input for logging:", parsedInput.error.flatten());
      return { success: false, error: "Invalid input" };
  }

  const { websiteId, prompt, response, status, errorDetails } = parsedInput.data;
  
  try {
    await dbConnect();
    const log = new AiInteractionLog({
        userId: session.user.id,
        websiteId: websiteId && mongoose.Types.ObjectId.isValid(websiteId) ? websiteId : undefined,
        prompt,
        response,
        status,
        errorDetails
    });
    await log.save();
    return { success: true };
  } catch (error: any) {
    console.error("[logAiInteraction] Failed to save AI interaction log:", error.message);
    // Fail silently
    return { success: false, error: error.message };
  }
}
