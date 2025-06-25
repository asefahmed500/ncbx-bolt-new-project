
"use server";

import dbConnect from "@/lib/dbConnect";
import User, { type IUser } from "@/models/User";
import Coupon, { type ICoupon } from "@/models/Coupon";
import ModerationQueueItem, { type IModerationQueueItem } from "@/models/ModerationQueueItem";
import Template, { type ITemplate, type TemplateStatus } from "@/models/Template";
import TemplateReview from "@/models/TemplateReview";
import Website from "@/models/Website";
import Subscription from "@/models/Subscription";
import { getPlanByStripePriceId } from "@/config/plans";
import { z } from "zod";
import { auth } from "@/auth";
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
    // Ensure _id is serialized if it's an ObjectId at the top level
    if (source._id && source._id instanceof mongoose.Types.ObjectId) {
      plainObject._id = source._id.toString();
    }
     // Ensure other common ObjectId fields are serialized if present
    if (source.userId && source.userId instanceof mongoose.Types.ObjectId) plainObject.userId = source.userId.toString();
    if (source.templateId && source.templateId instanceof mongoose.Types.ObjectId) plainObject.templateId = source.templateId.toString();
    if (source.contentId && source.contentId instanceof mongoose.Types.ObjectId) plainObject.contentId = source.contentId.toString();
    if (source.reporterId && source.reporterId instanceof mongoose.Types.ObjectId) plainObject.reporterId = source.reporterId.toString();
    if (source.moderatedBy && source.moderatedBy instanceof mongoose.Types.ObjectId) plainObject.moderatedBy = source.moderatedBy.toString();
    if (source.createdByUserId && source.createdByUserId instanceof mongoose.Types.ObjectId) plainObject.createdByUserId = source.createdByUserId.toString();


    return plainObject;
  }

  return obj;
};


export interface IUserForAdmin extends Omit<IUser, '_id' | 'userId' | 'createdAt' | 'updatedAt' | 'purchasedTemplateIds'> {
  _id: string;
  userId?: string; // if populated
  websiteCount: number;
  subscriptionPlanName?: string;
  subscriptionStatus?: string;
  purchasedTemplateIds?: string[];
  createdAt: string;
  updatedAt: string;
}

interface GetUsersResult {
  users?: IUserForAdmin[];
  totalUsers?: number;
  error?: string;
}

const GetUsersInputSchema = z.object({
    searchTerm: z.string().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
});

export async function getUsersForAdmin(input: z.infer<typeof GetUsersInputSchema>): Promise<GetUsersResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }
  
  const parsedInput = GetUsersInputSchema.safeParse(input);
    if (!parsedInput.success) {
      return { error: `Invalid input: ${JSON.stringify(parsedInput.error.flatten())}` };
    }
  const { searchTerm, page, limit } = parsedInput.data;

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
          .sort({ createdAt: -1 })
          .lean();

        let subscriptionPlanName: string | undefined = 'Free';
        let subscriptionStatus: string | undefined = 'N/A';

        if (latestSubscription) {
          const plan = getPlanByStripePriceId(latestSubscription.stripePriceId);
          subscriptionPlanName = plan?.name || 'Unknown Plan';
          subscriptionStatus = latestSubscription.stripeSubscriptionStatus as string;
        } else {
           const userHasStripeId = !!user.stripeCustomerId;
           if (!userHasStripeId) {
             subscriptionPlanName = 'Free';
             subscriptionStatus = 'Active'; // Or "N/A" if free isn't explicitly active
           } else {
             // Has Stripe ID but no active subscription in our DB
             subscriptionPlanName = 'Free'; // Or 'Cancelled' / 'Previous Subscriber'
             subscriptionStatus = 'Cancelled'; // Or 'Inactive'
           }
        }
        
        return serializeObject({
          ...user,
          websiteCount,
          subscriptionPlanName,
          subscriptionStatus,
        }) as IUserForAdmin;
      })
    );

    return { users: enrichedUsers, totalUsers };
  } catch (error: any) {
    return { error: "Failed to fetch users: " + error.message };
  }
}


const UpdateUserStatusInputSchema = z.object({
  userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid User ID"),
  isActive: z.boolean(),
});
export async function updateUserStatus(input: z.infer<typeof UpdateUserStatusInputSchema>): Promise<{ success?: string; error?: string; user?: IUserForAdmin }> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const parsedInput = UpdateUserStatusInputSchema.safeParse(input);
  if (!parsedInput.success) {
      return { error: `Invalid input: ${JSON.stringify(parsedInput.error.flatten())}` };
  }
  const { userId, isActive } = parsedInput.data;

  try {
    await dbConnect();
    const user = await User.findById(userId);

    if (!user) {
      return { error: "User not found." };
    }

    user.isActive = isActive;
    await user.save();
    
    // Refetch the enriched user data for consistency with getUsersForAdmin display
    const usersResult = await getUsersForAdmin({searchTerm: user.email || undefined, page: 1, limit: 1});
    const updatedUserForAdmin = usersResult.users && usersResult.users.length > 0 ? usersResult.users[0] : undefined;


    return {
      success: `User status updated to ${isActive ? "active" : "suspended"}.`,
      user: updatedUserForAdmin,
    };
  } catch (error: any) {
    return { error: "Failed to update user status: " + error.message };
  }
}

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
    if (discountType === 'fixed_amount' && discountValue < 0) {
        return { error: "Fixed amount discount value must be non-negative."};
    }

    const newCouponData: Partial<ICoupon> = {
      code,
      description,
      discountType,
      discountValue,
      isActive,
      usageLimit,
      timesUsed: 0,
      userUsageLimit,
      minPurchaseAmount,
    };

    if (expiresAt) {
      newCouponData.expiresAt = new Date(expiresAt);
    }

    const newCoupon = new Coupon(newCouponData);
    const savedCoupon = await newCoupon.save();

    return { success: "Coupon created successfully.", coupon: serializeObject(savedCoupon) };

  } catch (error: any) {
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

const GetCouponsInputSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});
export async function getCouponsForAdmin(input: z.infer<typeof GetCouponsInputSchema>): Promise<GetCouponsResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const parsedInput = GetCouponsInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { error: `Invalid input: ${JSON.stringify(parsedInput.error.flatten())}` };
    }
  const { page, limit } = parsedInput.data;

  try {
    await dbConnect();
    const skip = (page - 1) * limit;
    const couponsFromDB = await Coupon.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const totalCoupons = await Coupon.countDocuments({});
    return { coupons: serializeObject(couponsFromDB), totalCoupons };
  } catch (error: any) {
    return { error: "Failed to fetch coupons: " + error.message };
  }
}

export async function getCouponByIdForAdmin(couponId: string): Promise<{ coupon?: ICoupon; error?: string }> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }
  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    return { error: "Invalid Coupon ID format." };
  }
  try {
    await dbConnect();
    const coupon = await Coupon.findById(couponId).lean();
    if (!coupon) {
      return { error: "Coupon not found." };
    }
    return { coupon: serializeObject(coupon) };
  } catch (error: any) {
    return { error: "Failed to fetch coupon: " + error.message };
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

    const finalDiscountType = updateData.discountType || coupon.discountType;
    const finalDiscountValue = updateData.discountValue !== undefined ? updateData.discountValue : coupon.discountValue;

    if (finalDiscountType === 'percentage' && (finalDiscountValue < 0 || finalDiscountValue > 100)) {
      return { error: "Percentage discount value must be between 0 and 100." };
    }
    if (finalDiscountType === 'fixed_amount' && finalDiscountValue < 0) {
      return { error: "Fixed amount discount value must be non-negative." };
    }

    Object.assign(coupon, updateData);
    if (updateData.expiresAt === null) {
        coupon.expiresAt = undefined;
    } else if (updateData.expiresAt) {
        coupon.expiresAt = new Date(updateData.expiresAt);
    }

    const updatedCoupon = await coupon.save();

    return { success: "Coupon updated successfully.", coupon: serializeObject(updatedCoupon) };

  } catch (error: any) {
    if (error instanceof z.ZodError) {
        return { error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { error: `An unexpected error occurred: ${error.message || "Could not update coupon."}` };
  }
}

export async function deleteCouponByAdmin(couponId: string): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }
  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    return { error: "Invalid Coupon ID format." };
  }

  try {
    await dbConnect();
    const result = await Coupon.deleteOne({ _id: couponId });
    if (result.deletedCount === 0) {
      return { error: "Coupon not found or already deleted." };
    }
    return { success: "Coupon deleted successfully." };
  } catch (error: any) {
    return { error: `Failed to delete coupon: ${error.message}` };
  }
}


interface GetModerationQueueItemsResult {
  items?: IModerationQueueItem[];
  totalItems?: number;
  error?: string;
}

const GetModerationQueueInputSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    statusFilter: z.string().optional(),
});
export async function getModerationQueueItems(input: z.infer<typeof GetModerationQueueInputSchema>): Promise<GetModerationQueueItemsResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }
    
  const parsedInput = GetModerationQueueInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { error: `Invalid input: ${JSON.stringify(parsedInput.error.flatten())}` };
  }
  const { page, limit, statusFilter } = parsedInput.data;

  try {
    await dbConnect();
    const query: mongoose.FilterQuery<IModerationQueueItem> = {};
    if (statusFilter && ['pending', 'approved', 'rejected', 'escalated'].includes(statusFilter)) {
      query.status = statusFilter;
    } else if (statusFilter && statusFilter.toLowerCase() === 'all') {
      // No status filter needed
    } else if (statusFilter) {
      query.status = 'pending';
    }

    const skip = (page - 1) * limit;
    const itemsFromDB = await ModerationQueueItem.find(query)
      .populate('userId', 'name email')
      .populate('reporterId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const totalItems = await ModerationQueueItem.countDocuments(query);

    return { items: serializeObject(itemsFromDB), totalItems };
  } catch (error: any) {
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

    let newStatus: IModerationQueueItem['status'];
    switch (action) {
      case 'approve': newStatus = 'approved'; break;
      case 'reject': newStatus = 'rejected'; break;
      case 'escalate': newStatus = 'escalated'; break;
      default: return { error: "Invalid action." };
    }
    item.status = newStatus;
    item.moderatedBy = new mongoose.Types.ObjectId(adminUserId);
    item.moderatedAt = new Date();
    if (moderatorNotes) {
      item.moderatorNotes = moderatorNotes;
    }

    if (item.contentType === 'template_review' && item.contentRefModel === 'TemplateReview') {
      const review = await TemplateReview.findById(item.contentId);
      if (review) {
        review.isApproved = action === 'approve';
        await review.save();
      }
    } else if (item.contentType === 'template_submission' && item.contentRefModel === 'Template') {
       const template = await Template.findById(item.contentId);
       if(template) {
           if(action === 'approve') template.status = 'approved' as TemplateStatus;
           else if (action === 'reject') template.status = 'rejected' as TemplateStatus;
           await template.save();
       }
    }

    const updatedItem = await item.save();
    return { success: `Moderation item status set to ${newStatus}.`, item: serializeObject(updatedItem) };

  } catch (error: any) {
    return { error: `Failed to process item: ${error.message}` };
  }
}

interface GetTemplatesResult {
  templates?: ITemplate[];
  totalTemplates?: number;
  error?: string;
}

const GetTemplatesInputSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  statusFilter: z.string().optional(),
  categoryFilter: z.string().optional(),
});
export async function getTemplatesForAdmin(input: z.infer<typeof GetTemplatesInputSchema>): Promise<GetTemplatesResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }
  
  const parsedInput = GetTemplatesInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { error: `Invalid input: ${JSON.stringify(parsedInput.error.flatten())}` };
  }
  const { page, limit, statusFilter, categoryFilter } = parsedInput.data;

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
    const templatesFromDB = await Template.find(query)
      .populate('createdByUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const totalTemplates = await Template.countDocuments(query);

    return { templates: serializeObject(templatesFromDB), totalTemplates };
  } catch (error: any) {
    return { error: "Failed to fetch templates: " + error.message };
  }
}

const UpdateTemplateStatusInputSchema = z.object({
  templateId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Template ID",
  }),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected']),
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

    return { success: `Template status updated to "${status}".`, template: serializeObject(updatedTemplate) };

  } catch (error: any) {
    return { error: `Failed to update template status: ${error.message}` };
  }
}

const UpdateTemplateMetadataInputSchema = z.object({
  templateId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val)),
  name: z.string().min(1, "Name cannot be empty.").max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPremium: z.boolean().optional(),
  price: z.number().min(0).optional(),
  previewImageUrl: z.string().url("Invalid URL for preview image.").optional().or(z.literal('')),
  liveDemoUrl: z.string().url("Invalid URL for live demo.").optional().or(z.literal('')),
});
export type UpdateTemplateMetadataInput = z.infer<typeof UpdateTemplateMetadataInputSchema>;

interface UpdateTemplateMetadataResult {
  success?: string;
  error?: string;
  template?: ITemplate;
}

export async function updateTemplateMetadataByAdmin(data: UpdateTemplateMetadataInput): Promise<UpdateTemplateMetadataResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const parsedData = UpdateTemplateMetadataInputSchema.safeParse(data);
  if (!parsedData.success) {
    const errorMessages = parsedData.error.flatten().fieldErrors;
    return { error: `Invalid input: ${JSON.stringify(errorMessages)}` };
  }
  const { templateId, ...updateFields } = parsedData.data;

  try {
    await dbConnect();
    const template = await Template.findById(templateId);
    if (!template) {
      return { error: "Template not found." };
    }

    if (updateFields.isPremium !== undefined) {
      template.isPremium = updateFields.isPremium;
      if (!template.isPremium) {
        template.price = undefined;
      } else if (updateFields.price !== undefined) {
        template.price = updateFields.price;
      } else if (template.isPremium && template.price === undefined) {
        template.price = 0; // Default to 0 if marked premium and no price given
      }
    } else if (updateFields.price !== undefined && template.isPremium) {
      template.price = updateFields.price;
    }

    if (updateFields.name) template.name = updateFields.name;
    if (updateFields.description) template.description = updateFields.description;
    if (updateFields.category) template.category = updateFields.category;
    if (updateFields.tags) template.tags = updateFields.tags;
    if (updateFields.previewImageUrl !== undefined) template.previewImageUrl = updateFields.previewImageUrl || undefined;
    if (updateFields.liveDemoUrl !== undefined) template.liveDemoUrl = updateFields.liveDemoUrl || undefined;

    const updatedTemplate = await template.save();
    return { success: "Template metadata updated successfully.", template: serializeObject(updatedTemplate) };

  } catch (error: any) {
    return { error: `Failed to update template metadata: ${error.message}` };
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
    return { template: serializeObject(template) };
  } catch (error: any) {
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
    const categories = await Template.distinct('category').where({ status: 'approved' }).exec();
    return { categories: categories.filter(cat => cat && typeof cat === 'string' && cat.trim() !== '').map(String) };
  } catch (error: any) {
    return { error: "Failed to fetch categories: " + error.message };
  }
}
    
export interface AdminDashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  systemHealth: string; // conceptual
  newUsersLastWeek: number; // another stat
  pendingModerationItems: number;
}

export async function getAdminDashboardStats(): Promise<{ stats?: AdminDashboardStats; error?: string }> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await dbConnect();
    
    const totalUsers = await User.countDocuments({});
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersLastWeek = await User.countDocuments({ createdAt: { $gte: oneWeekAgo }});

    const activeSubscriptionsCount = await Subscription.countDocuments({
      stripeSubscriptionStatus: { $in: ['active', 'trialing'] },
    });

    const activeSubscriptions = await Subscription.find({
        stripeSubscriptionStatus: { $in: ['active', 'trialing'] },
    }).lean();

    let monthlyRevenue = 0;
    for (const sub of activeSubscriptions) {
        const plan = getPlanByStripePriceId(sub.stripePriceId);
        if (plan?.stripeYearlyPriceId === sub.stripePriceId && plan.yearlyPrice) {
            monthlyRevenue += plan.yearlyPrice / 12;
        } else if (plan?.monthlyPrice) {
            monthlyRevenue += plan.monthlyPrice;
        }
    }
    
    const pendingModerationItems = await ModerationQueueItem.countDocuments({ status: 'pending' });

    return {
      stats: {
        totalUsers,
        activeSubscriptions: activeSubscriptionsCount,
        monthlyRevenue: Math.round(monthlyRevenue), // round to nearest dollar
        systemHealth: 'Optimal', // Conceptual
        newUsersLastWeek,
        pendingModerationItems,
      }
    };

  } catch (error: any) {
    console.error("[getAdminDashboardStats] Error fetching stats:", error);
    return { error: "Failed to fetch dashboard statistics." };
  }
}
    

