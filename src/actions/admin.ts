
"use server";

import dbConnect from "@/lib/dbConnect";
import User, { type IUser } from "@/models/User";
import Coupon, { type ICoupon } from "@/models/Coupon";
import ModerationQueueItem, { type IModerationQueueItem } from "@/models/ModerationQueueItem";
import Template, { type ITemplate } from "@/models/Template"; // Import Template model
import { z } from "zod";
import { auth } from "@/auth";
import mongoose from "mongoose";

// --- User Management ---

interface GetUsersResult {
  users?: IUser[];
  totalUsers?: number;
  error?: string;
}

export async function getUsersForAdmin(
  searchTerm?: string,
  page: number = 1,
  limit: number = 10
): Promise<GetUsersResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await dbConnect();
    const query: mongoose.FilterQuery<IUser> = {};
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalUsers = await User.countDocuments(query);

    return { users: users as IUser[], totalUsers };
  } catch (error: any) {
    console.error("[AdminAction_GetUsers] Error fetching users:", error);
    return { error: "Failed to fetch users: " + error.message };
  }
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<{ success?: string; error?: string; user?: IUser }> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  if (!userId || typeof isActive !== "boolean") {
    return { error: "Invalid input: userId and isActive status are required." };
  }

  try {
    await dbConnect();
    const user = await User.findById(userId);

    if (!user) {
      return { error: "User not found." };
    }

    user.isActive = isActive;
    await user.save();

    console.log(
      `[AdminAction_UpdateUserStatus] User ${userId} status updated to ${isActive ? "active" : "suspended"}.`
    );
    return {
      success: `User status updated to ${isActive ? "active" : "suspended"}.`,
      user: user.toObject(),
    };
  } catch (error: any) {
    console.error("[AdminAction_UpdateUserStatus] Error updating user status:", error);
    return { error: "Failed to update user status: " + error.message };
  }
}

// --- Coupon Management ---

const CreateCouponInputSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.number().min(0),
  isActive: z.boolean().default(true),
  usageLimit: z.number().min(0).default(100),
  userUsageLimit: z.number().min(0).default(1),
  expiresAt: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Invalid date format for expiration date",
  }),
  minPurchaseAmount: z.number().min(0).default(0),
});

export type CreateCouponInput = z.infer<typeof CreateCouponInputSchema>;

interface CreateCouponResult {
  success?: string;
  error?: string;
  coupon?: ICoupon;
}

export async function createCoupon(input: CreateCouponInput): Promise<CreateCouponResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    const parsedInput = CreateCouponInputSchema.safeParse(input);
    if (!parsedInput.success) {
      const errorMessages = parsedInput.error.flatten().fieldErrors;
      return { error: `Invalid input: ${JSON.stringify(errorMessages)}` };
    }

    const { code, description, discountType, discountValue, isActive, usageLimit, userUsageLimit, expiresAt, minPurchaseAmount } = parsedInput.data;

    await dbConnect();

    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return { error: "A coupon with this code already exists." };
    }

    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
        return { error: "Percentage discount value must be between 0 and 100." };
    }
    if (discountType === 'fixed_amount' && discountValue < 0) { // Fixed amount already min(0) by Zod
        return { error: "Fixed amount discount value must be non-negative."};
    }


    const newCouponData: Partial<ICoupon> = {
      code,
      description,
      discountType,
      discountValue, // Assuming discountValue is already in cents for fixed_amount
      isActive,
      usageLimit,
      timesUsed: 0,
      userUsageLimit,
      minPurchaseAmount, // Assuming minPurchaseAmount is in cents
    };

    if (expiresAt) {
      newCouponData.expiresAt = new Date(expiresAt);
    }

    const newCoupon = new Coupon(newCouponData);
    const savedCoupon = await newCoupon.save();

    console.log(`[AdminAction_CreateCoupon] Coupon "${savedCoupon.code}" created by admin ${session.user.id}.`);
    return { success: "Coupon created successfully.", coupon: savedCoupon.toObject() };

  } catch (error: any) {
    console.error("[AdminAction_CreateCoupon] Error creating coupon:", error);
    if (error.code === 11000) {
      return { error: "A coupon with this code already exists (database)." };
    }
    if (error instanceof z.ZodError) {
        return { error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { error: `An unexpected error occurred: ${error.message || "Could not save coupon."}` };
  }
}


interface GetCouponsResult {
  coupons?: ICoupon[];
  totalCoupons?: number;
  error?: string;
}
export async function getCouponsForAdmin(
  page: number = 1,
  limit: number = 10
): Promise<GetCouponsResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await dbConnect();
    const skip = (page - 1) * limit;
    const coupons = await Coupon.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const totalCoupons = await Coupon.countDocuments({});
    return { coupons: coupons as ICoupon[], totalCoupons };
  } catch (error: any) {
    console.error("[AdminAction_GetCoupons] Error fetching coupons:", error);
    return { error: "Failed to fetch coupons: " + error.message };
  }
}

// --- Moderation Queue ---
interface GetModerationQueueItemsResult {
  items?: IModerationQueueItem[];
  totalItems?: number;
  error?: string;
}

export async function getModerationQueueItems(
  page: number = 1,
  limit: number = 10,
  statusFilter?: string
): Promise<GetModerationQueueItemsResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await dbConnect();
    const query: mongoose.FilterQuery<IModerationQueueItem> = {};
    if (statusFilter && ['pending', 'approved', 'rejected', 'escalated'].includes(statusFilter)) {
      query.status = statusFilter;
    }

    const skip = (page - 1) * limit;
    const items = await ModerationQueueItem.find(query)
      .populate('userId', 'name email') // Populate user who created content
      .populate('reporterId', 'name email') // Populate user who reported
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const totalItems = await ModerationQueueItem.countDocuments(query);

    return { items: items as IModerationQueueItem[], totalItems };
  } catch (error: any) {
    console.error("[AdminAction_GetModerationQueueItems] Error fetching moderation items:", error);
    return { error: "Failed to fetch moderation items: " + error.message };
  }
}

// --- Template Management (Admin) ---
interface GetTemplatesResult {
  templates?: ITemplate[];
  totalTemplates?: number;
  error?: string;
}

export async function getTemplatesForAdmin(
  page: number = 1,
  limit: number = 10,
  statusFilter?: string,
  categoryFilter?: string
): Promise<GetTemplatesResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await dbConnect();
    const query: mongoose.FilterQuery<ITemplate> = {};
    if (statusFilter && ['draft', 'pending_approval', 'approved', 'rejected'].includes(statusFilter)) {
      query.status = statusFilter;
    }
    if (categoryFilter && categoryFilter.toLowerCase() !== 'all') {
      query.category = categoryFilter;
    }


    const skip = (page - 1) * limit;
    const templates = await Template.find(query)
      .populate('createdByUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const totalTemplates = await Template.countDocuments(query);

    return { templates: templates as ITemplate[], totalTemplates };
  } catch (error: any) {
    console.error("[AdminAction_GetTemplatesForAdmin] Error fetching templates:", error);
    return { error: "Failed to fetch templates: " + error.message };
  }
}

interface GetTemplateDataResult {
  template?: ITemplate;
  error?: string;
}

export async function getTemplateDataForExport(templateId: string): Promise<GetTemplateDataResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
    return { error: "Invalid Template ID provided." };
  }

  try {
    await dbConnect();
    const template = await Template.findById(templateId).lean();

    if (!template) {
      return { error: "Template not found." };
    }
    return { template: template as ITemplate };
  } catch (error: any) {
    console.error(`[AdminAction_GetTemplateDataForExport] Error fetching template ${templateId}:`, error);
    return { error: `Failed to fetch template data: ${error.message}` };
  }
}

interface DistinctCategoriesResult {
    categories?: string[];
    error?: string;
}

export async function getDistinctTemplateCategories(): Promise<DistinctCategoriesResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }
  try {
    await dbConnect();
    const categories = await Template.distinct('category').exec();
    // Filter out null, undefined, or empty string categories if they exist
    return { categories: categories.filter(cat => cat && typeof cat === 'string' && cat.trim() !== '') as string[] };
  } catch (error: any) {
    console.error("[AdminAction_GetDistinctCategories] Error fetching categories:", error);
    return { error: "Failed to fetch categories: " + error.message };
  }
}
    
