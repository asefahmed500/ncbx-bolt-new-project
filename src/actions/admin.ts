
"use server";

import dbConnect from "@/lib/dbConnect";
import User, { type IUser } from "@/models/User";
import Coupon, { type ICoupon } from "@/models/Coupon";
import ModerationQueueItem, { type IModerationQueueItem } from "@/models/ModerationQueueItem";
import Template, { type ITemplate, type TemplateStatus } from "@/models/Template"; // Import Template model
import TemplateReview from "@/models/TemplateReview"; // Needed for moderation actions
import Website from "@/models/Website"; // Import Website model
import Subscription from "@/models/Subscription"; // Import Subscription model
import { getPlanByStripePriceId } from "@/config/plans"; // Import plan helper
import { z } from "zod";
import { auth } from "@/auth";
import mongoose from "mongoose";

// Define an extended user type for admin view
export interface IUserForAdmin extends IUser {
  websiteCount: number;
  subscriptionPlanName?: string;
  subscriptionStatus?: string;
  // stripeCustomerId is already part of IUser
}

// --- User Management ---

interface GetUsersResult {
  users?: IUserForAdmin[];
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
    const usersFromDB = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalUsers = await User.countDocuments(query);

    const enrichedUsers: IUserForAdmin[] = await Promise.all(
      usersFromDB.map(async (user) => {
        const websiteCount = await Website.countDocuments({ userId: user._id });
        const latestSubscription = await Subscription.findOne({ userId: user._id })
          .sort({ createdAt: -1 }) // Get the most recent subscription record
          .lean();

        let subscriptionPlanName: string | undefined = 'Free'; // Default to Free
        let subscriptionStatus: string | undefined = 'N/A';

        if (latestSubscription) {
          const plan = getPlanByStripePriceId(latestSubscription.stripePriceId);
          subscriptionPlanName = plan?.name || 'Unknown Plan';
          subscriptionStatus = latestSubscription.stripeSubscriptionStatus as string;
        } else {
          // If no subscription record, infer as Free and perhaps 'inactive' or 'N/A'
           const userHasStripeId = !!user.stripeCustomerId;
           if (!userHasStripeId) { // if they never even went to stripe, they are free
             subscriptionPlanName = 'Free';
             subscriptionStatus = 'Active'; // Free plan is implicitly active
           } else { // has stripe ID but no sub, might be cancelled old sub
             subscriptionPlanName = 'Free'; // Or 'Cancelled' if you want to reflect that
             subscriptionStatus = 'Cancelled'; // Or 'N/A'
           }
        }


        return {
          ...(user as IUser), // Cast because lean() returns plain objects
          _id: user._id, // Ensure _id is present and correct type
          websiteCount,
          subscriptionPlanName,
          subscriptionStatus,
        };
      })
    );

    return { users: enrichedUsers, totalUsers };
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

const UpdateCouponInputSchema = z.object({
  couponId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Coupon ID",
  }),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed_amount"]).optional(),
  discountValue: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  usageLimit: z.number().min(0).optional(),
  userUsageLimit: z.number().min(0).optional(),
  expiresAt: z.string().nullable().optional().refine(val => val === null || !val || !isNaN(Date.parse(val)), {
    message: "Invalid date format for expiration date",
  }),
  minPurchaseAmount: z.number().min(0).optional(),
});
export type UpdateCouponInput = z.infer<typeof UpdateCouponInputSchema>;
interface UpdateCouponResult {
  success?: string;
  error?: string;
  coupon?: ICoupon;
}

export async function updateCouponByAdmin(input: UpdateCouponInput): Promise<UpdateCouponResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    const parsedInput = UpdateCouponInputSchema.safeParse(input);
    if (!parsedInput.success) {
      const errorMessages = parsedInput.error.flatten().fieldErrors;
      return { error: `Invalid input: ${JSON.stringify(errorMessages)}` };
    }

    const { couponId, ...updateData } = parsedInput.data;

    await dbConnect();
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return { error: "Coupon not found." };
    }

    // Validate discountValue based on discountType if both are present
    const finalDiscountType = updateData.discountType || coupon.discountType;
    const finalDiscountValue = updateData.discountValue !== undefined ? updateData.discountValue : coupon.discountValue;

    if (finalDiscountType === 'percentage' && (finalDiscountValue < 0 || finalDiscountValue > 100)) {
      return { error: "Percentage discount value must be between 0 and 100." };
    }
    if (finalDiscountType === 'fixed_amount' && finalDiscountValue < 0) {
      return { error: "Fixed amount discount value must be non-negative." };
    }

    // Apply updates
    Object.assign(coupon, updateData);
    if (updateData.expiresAt === null) { // Explicitly set to null to remove expiration
        coupon.expiresAt = undefined;
    } else if (updateData.expiresAt) {
        coupon.expiresAt = new Date(updateData.expiresAt);
    }


    const updatedCoupon = await coupon.save();

    console.log(`[AdminAction_UpdateCoupon] Coupon "${updatedCoupon.code}" (ID: ${couponId}) updated by admin ${session.user.id}.`);
    return { success: "Coupon updated successfully.", coupon: updatedCoupon.toObject() };

  } catch (error: any) {
    console.error("[AdminAction_UpdateCoupon] Error updating coupon:", error);
    if (error instanceof z.ZodError) {
        return { error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { error: `An unexpected error occurred: ${error.message || "Could not update coupon."}` };
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
    } else if (statusFilter && statusFilter.toLowerCase() === 'all') {
      // No status filter needed
    } else if (statusFilter) {
      // Default to pending if an invalid filter is passed but a filter is intended
      query.status = 'pending';
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

const ProcessModerationItemInputSchema = z.object({
  itemId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Item ID",
  }),
  action: z.enum(['approve', 'reject', 'escalate']),
  moderatorNotes: z.string().optional(),
});
export type ProcessModerationItemInput = z.infer<typeof ProcessModerationItemInputSchema>;

interface ProcessModerationItemResult {
  success?: string;
  error?: string;
  item?: IModerationQueueItem;
}

export async function processModerationItemByAdmin(input: ProcessModerationItemInput): Promise<ProcessModerationItemResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    const parsedInput = ProcessModerationItemInputSchema.safeParse(input);
    if (!parsedInput.success) {
      const errorMessages = parsedInput.error.flatten().fieldErrors;
      return { error: `Invalid input: ${JSON.stringify(errorMessages)}` };
    }

    const { itemId, action, moderatorNotes } = parsedInput.data;
    const adminUserId = session.user.id;

    await dbConnect();
    const item = await ModerationQueueItem.findById(itemId);

    if (!item) {
      return { error: "Moderation item not found." };
    }

    item.status = action; // 'approve' -> 'approved', 'reject' -> 'rejected', 'escalate' -> 'escalated'
    item.moderatedBy = new mongoose.Types.ObjectId(adminUserId);
    item.moderatedAt = new Date();
    if (moderatorNotes) {
      item.moderatorNotes = moderatorNotes;
    }

    // Conceptual: Update related content based on item.contentType and item.contentId
    if (item.contentType === 'template_review' && item.contentRefModel === 'TemplateReview') {
      const review = await TemplateReview.findById(item.contentId);
      if (review) {
        review.isApproved = action === 'approve'; // Set approval status on the review itself
        await review.save();
        console.log(`[AdminAction_ProcessModeration] TemplateReview ${review._id} status updated to isApproved: ${review.isApproved}.`);
      }
    } else if (item.contentType === 'template_submission' && item.contentRefModel === 'Template') {
       const template = await Template.findById(item.contentId);
       if(template) {
           if(action === 'approve') template.status = 'approved' as TemplateStatus;
           else if (action === 'reject') template.status = 'rejected' as TemplateStatus;
           // 'escalated' doesn't change template status directly, it remains in moderation.
           await template.save();
           console.log(`[AdminAction_ProcessModeration] Template ${template._id} status updated to: ${template.status}.`);
       }
    }
    // Add more else if blocks for other content types (e.g., website_content, user_report)

    const updatedItem = await item.save();
    console.log(`[AdminAction_ProcessModeration] Item ${itemId} processed by admin ${adminUserId}. Action: ${action}.`);
    return { success: `Moderation item ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'escalated'}.`, item: updatedItem.toObject() };

  } catch (error: any) {
    console.error("[AdminAction_ProcessModeration] Error processing item:", error);
    return { error: `Failed to process item: ${error.message}` };
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
    } else if (statusFilter && statusFilter.toLowerCase() === 'all') {
        // No status filter means all are included
    } else if (statusFilter) {
        // Default to all if invalid status filter is passed but filter is intended.
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


const UpdateTemplateStatusInputSchema = z.object({
  templateId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Template ID",
  }),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected']),
  // adminNotes can be added later if needed for rejection reasons etc.
});
export type UpdateTemplateStatusInput = z.infer<typeof UpdateTemplateStatusInputSchema>;

interface UpdateTemplateStatusResult {
  success?: string;
  error?: string;
  template?: ITemplate;
}

export async function updateTemplateStatusByAdmin(input: UpdateTemplateStatusInput): Promise<UpdateTemplateStatusResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    const parsedInput = UpdateTemplateStatusInputSchema.safeParse(input);
    if (!parsedInput.success) {
      const errorMessages = parsedInput.error.flatten().fieldErrors;
      return { error: `Invalid input: ${JSON.stringify(errorMessages)}` };
    }

    const { templateId, status } = parsedInput.data;

    await dbConnect();
    const template = await Template.findById(templateId);
    if (!template) {
      return { error: "Template not found." };
    }

    template.status = status;
    const updatedTemplate = await template.save();

    console.log(`[AdminAction_UpdateTemplateStatus] Template ${templateId} status updated to "${status}" by admin ${session.user.id}.`);
    return { success: `Template status updated to "${status}".`, template: updatedTemplate.toObject() };

  } catch (error: any) {
    console.error("[AdminAction_UpdateTemplateStatus] Error updating template status:", error);
    return { error: `Failed to update template status: ${error.message}` };
  }
}


interface GetTemplateDataResult {
  template?: ITemplate;
  error?: string;
}

export async function getTemplateDataForExport(templateId: string): Promise<GetTemplateDataResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") { // Or consider allowing creator to export their own?
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
    // For admin export, we might want to include more data, or filter certain fields.
    // For now, returning the full template object.
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
    return { error: "Unauthorized" }; // Or allow any authenticated user to see categories
  }
  try {
    await dbConnect();
    const categories = await Template.distinct('category').where({ status: 'approved' }).exec(); // Only show categories of approved templates
    return { categories: categories.filter(cat => cat && typeof cat === 'string' && cat.trim() !== '') as string[] };
  } catch (error: any) {
    console.error("[AdminAction_GetDistinctCategories] Error fetching categories:", error);
    return { error: "Failed to fetch categories: " + error.message };
  }
}
    

    