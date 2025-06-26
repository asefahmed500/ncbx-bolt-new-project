
"use server";

import dbConnect from "@/lib/dbConnect";
import Navigation, { type INavigation, type INavigationItem } from "@/models/Navigation";
import Website from "@/models/Website";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { z } from "zod";

// Helper to deeply serialize an object
const serializeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof mongoose.Types.ObjectId) return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeObject);
  if (typeof obj === 'object') {
    const plainObject: { [key: string]: any } = {};
    const source = typeof obj.toObject === 'function' ? obj.toObject({ transform: false }) : obj;
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        plainObject[key] = serializeObject(source[key]);
      }
    }
    if (source._id && source._id instanceof mongoose.Types.ObjectId) plainObject._id = source._id.toString();
    if (source.websiteId && source.websiteId instanceof mongoose.Types.ObjectId) plainObject.websiteId = source.websiteId.toString();
    if (source.items && Array.isArray(source.items)) {
      plainObject.items = source.items.map((item: any) => serializeObject(item));
    }
    return plainObject;
  }
  return obj;
};

// Zod schema for a single navigation item
const NavigationItemSchema = z.object({
  label: z.string().min(1, "Link label cannot be empty."),
  url: z.string().min(1, "Link URL cannot be empty."),
  type: z.enum(['internal', 'external']).default('internal'),
  // _id is not part of the input schema from client
});

// Zod schema for creating a new navigation
const CreateNavigationInputSchema = z.object({
  name: z.string().min(1, "Navigation name cannot be empty.").max(100),
  websiteId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), { message: "Invalid Website ID" }),
  items: z.array(NavigationItemSchema).optional(),
});
export type CreateNavigationInput = z.infer<typeof CreateNavigationInputSchema>;

// Zod schema for updating an existing navigation
const UpdateNavigationInputSchema = z.object({
  navigationId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), { message: "Invalid Navigation ID" }),
  name: z.string().min(1, "Navigation name cannot be empty.").max(100).optional(),
  items: z.array(NavigationItemSchema).optional(),
});
export type UpdateNavigationInput = z.infer<typeof UpdateNavigationInputSchema>;


interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Action to create a new navigation menu
export async function createNavigation(input: CreateNavigationInput): Promise<ActionResult<INavigation>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsedInput = CreateNavigationInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: JSON.stringify(parsedInput.error.flatten()) };
  }
  const { name, websiteId, items } = parsedInput.data;

  try {
    await dbConnect();
    const website = await Website.findById(websiteId);
    if (!website || (website.userId.toString() !== session.user.id && session.user.role !== 'admin')) {
      return { success: false, error: "Website not found or unauthorized." };
    }
    const newNavigation = new Navigation({ name, websiteId, items: items || [] });
    const savedNavigation = await newNavigation.save();
    return { success: true, data: serializeObject(savedNavigation) };
  } catch (e: any) {
    if (e.code === 11000) {
      return { success: false, error: "A navigation with this name already exists for this website." };
    }
    return { success: false, error: "Failed to create navigation: " + e.message };
  }
}

// Action to get all navigation menus for a website
export async function getNavigationsByWebsiteId(websiteId: string): Promise<ActionResult<INavigation[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (!mongoose.Types.ObjectId.isValid(websiteId)) return { success: false, error: "Invalid Website ID." };

  try {
    await dbConnect();
    const website = await Website.findById(websiteId);
    if (!website || (website.userId.toString() !== session.user.id && session.user.role !== 'admin')) {
      return { success: false, error: "Website not found or unauthorized." };
    }
    const navigations = await Navigation.find({ websiteId }).sort({ name: 1 }).lean();
    return { success: true, data: serializeObject(navigations) };
  } catch (e: any) {
    return { success: false, error: "Failed to fetch navigations: " + e.message };
  }
}

// Action to update a navigation menu
export async function updateNavigation(input: UpdateNavigationInput): Promise<ActionResult<INavigation>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsedInput = UpdateNavigationInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: JSON.stringify(parsedInput.error.flatten()) };
  }
  const { navigationId, ...updateData } = parsedInput.data;

  try {
    await dbConnect();
    const navigation = await Navigation.findById(navigationId);
    if (!navigation) return { success: false, error: "Navigation not found." };

    const website = await Website.findById(navigation.websiteId);
    if (!website || (website.userId.toString() !== session.user.id && session.user.role !== 'admin')) {
      return { success: false, error: "Unauthorized to update this navigation." };
    }
    
    if (updateData.name) navigation.name = updateData.name;
    // Mongoose subdocuments need careful handling for replacement
    if (updateData.items) navigation.items = updateData.items as any;

    const updatedNavigation = await navigation.save();
    return { success: true, data: serializeObject(updatedNavigation) };
  } catch (e: any) {
    if (e.code === 11000) {
      return { success: false, error: "A navigation with this name already exists for this website." };
    }
    return { success: false, error: "Failed to update navigation: " + e.message };
  }
}

// Action to delete a navigation menu
export async function deleteNavigation(navigationId: string): Promise<ActionResult<boolean>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (!mongoose.Types.ObjectId.isValid(navigationId)) return { success: false, error: "Invalid Navigation ID." };

  try {
    await dbConnect();
    const navigation = await Navigation.findById(navigationId);
    if (!navigation) return { success: false, error: "Navigation not found." };
    
    const website = await Website.findById(navigation.websiteId);
    if (!website || (website.userId.toString() !== session.user.id && session.user.role !== 'admin')) {
      return { success: false, error: "Unauthorized to delete this navigation." };
    }
    
    await Navigation.findByIdAndDelete(navigationId);
    return { success: true, data: true };
  } catch (e: any) {
    return { success: false, error: "Failed to delete navigation: " + e.message };
  }
}
