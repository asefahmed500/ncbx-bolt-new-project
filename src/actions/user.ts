
"use server";

import dbConnect from "@/lib/dbConnect";
import User, { type IUser } from "@/models/User";
import { auth } from "@/auth";
import { z } from "zod";
import mongoose from "mongoose";

const UpdateUserProfileInputSchema = z.object({
  name: z.string().min(1, "Name cannot be empty.").max(100, "Name is too long.").optional(),
  avatarUrl: z.string().url("Invalid URL format for avatar.").optional(),
});

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileInputSchema>;

interface UpdateUserProfileResult {
  success?: string;
  error?: string;
  user?: IUser;
}

export async function updateUserProfile(input: UpdateUserProfileInput): Promise<UpdateUserProfileResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  const parsedInput = UpdateUserProfileInputSchema.safeParse(input);
  if (!parsedInput.success) {
    const errorMessages = parsedInput.error.flatten().fieldErrors;
    return { error: `Invalid input: ${JSON.stringify(errorMessages)}` };
  }

  const { name, avatarUrl } = parsedInput.data;

  if (!name && !avatarUrl) {
    return { error: "No fields provided for update." };
  }

  try {
    await dbConnect();
    const user = await User.findById(userId);

    if (!user) {
      return { error: "User not found." };
    }

    if (name) {
      user.name = name;
    }
    if (avatarUrl) {
      user.avatarUrl = avatarUrl;
    }

    const updatedUser = await user.save();

    console.log(`[UserAction_UpdateProfile] Profile updated for user ${userId}.`);
    return { success: "Profile updated successfully.", user: updatedUser.toObject() as IUser };

  } catch (error: any) {
    console.error(`[UserAction_UpdateProfile] Error updating profile for user ${userId}:`, error);
    return { error: `Failed to update profile: ${error.message}` };
  }
}
