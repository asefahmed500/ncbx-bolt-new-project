
"use server";

import dbConnect from "@/lib/dbConnect";
import User, { type IUser } from "@/models/User";
import { auth } from "@/auth";
import { z } from "zod";
import mongoose from "mongoose";

// Helper to deeply serialize an object, converting ObjectIds and other non-plain types
const serializeObject = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof mongoose.Types.ObjectId) {
    return obj.toString();
  }
  
  if (obj instanceof Date) {
    return obj.toISOString(); // Or pass as Date, Next.js serializes it
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeObject);
  }
  
  const plainObject: { [key: string]: any } = {};
  const source = typeof obj.toObject === 'function' ? obj.toObject() : obj;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      plainObject[key] = serializeObject(source[key]);
    }
  }
  if (source._id && source._id instanceof mongoose.Types.ObjectId) {
    plainObject._id = source._id.toString();
  }
  return plainObject;
};


const UpdateUserProfileInputSchema = z.object({
  name: z.string().min(1, "Name cannot be empty.").max(100, "Name is too long.").optional(),
  avatarUrl: z.string().url("Invalid URL format for avatar.").optional(),
});

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileInputSchema>;

interface UpdateUserProfileResult {
  success?: string;
  error?: string;
  user?: IUser; // This should be the plain object version
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
    return { success: "Profile updated successfully.", user: serializeObject(updatedUser) };

  } catch (error: any) {
    console.error(`[UserAction_UpdateProfile] Error updating profile for user ${userId}:`, error);
    return { error: `Failed to update profile: ${error.message}` };
  }
}
