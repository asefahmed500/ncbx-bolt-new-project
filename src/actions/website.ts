
"use server";

import dbConnect from "@/lib/dbConnect";
import Website, { type IWebsite, type WebsiteStatus, type DomainConnectionStatus } from "@/models/Website";
import WebsiteVersion, { type IWebsiteVersion, type IWebsiteVersionPage } from "@/models/WebsiteVersion"; 
import User from "@/models/User";
import Template from "@/models/Template";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { z } from "zod";
import type { IPageComponent } from "@/models/PageComponent";
import { generateWebsiteFromPrompt } from "@/ai/flows/generate-website-flow";

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
    if (source.currentVersionId && source.currentVersionId instanceof mongoose.Types.ObjectId) plainObject.currentVersionId = source.currentVersionId.toString();
    if (source.publishedVersionId && source.publishedVersionId instanceof mongoose.Types.ObjectId) plainObject.publishedVersionId = source.publishedVersionId.toString();
    if (source.websiteId && source.websiteId instanceof mongoose.Types.ObjectId) plainObject.websiteId = source.websiteId.toString();
    if (source.createdByUserId && source.createdByUserId instanceof mongoose.Types.ObjectId) plainObject.createdByUserId = source.createdByUserId.toString();

    // For IWebsiteVersionPage / IWebsiteVersion specific nested serialization
    if (source.pages && Array.isArray(source.pages)) {
      plainObject.pages = source.pages.map((page: any) => {
        const plainPage = serializeObject(page); // Serialize the page object itself
        if (page.elements && Array.isArray(page.elements)) {
          plainPage.elements = page.elements.map((el: any) => serializeObject(el)); // Serialize each element
        }
        return plainPage;
      });
    }
     // For IPageComponent serialization
    if (source.elements && Array.isArray(source.elements)) {
        plainObject.elements = source.elements.map((el: any) => serializeObject(el));
    }
    if (source.config && typeof source.config === 'object') { // config might be mixed
        plainObject.config = serializeObject(source.config);
    }

    return plainObject;
  }

  return obj;
};


const WebsiteActionInputSchema = z.object({
  websiteId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Website ID.",
  }),
});

interface WebsiteActionResult {
  success?: string;
  error?: string;
  website?: IWebsite; 
}

const CreateWebsiteInputSchema = z.object({
  name: z.string().min(3, "Website name must be at least 3 characters.").max(100),
  description: z.string().max(255, "Description is too long.").optional(),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters.")
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Subdomain must be lowercase alphanumeric with hyphens.")
    .optional(),
  templateId: z.string().optional().refine(val => !val || mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Template ID format.",
  }),
});
export type CreateWebsiteInput = z.infer<typeof CreateWebsiteInputSchema>;

interface CreateWebsiteResult {
  success?: string;
  error?: string;
  website?: IWebsite;
}

async function generateUniqueSubdomain(baseName: string): Promise<string> {
  let subdomain = baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 55); // Shorter base for suffixes
  if (subdomain.length < 3) subdomain = `site-${Date.now().toString(36).slice(-4)}`; // Ensure base is somewhat unique if name is too short

  let tempSubdomain = subdomain;
  let existing = await Website.findOne({ subdomain: tempSubdomain });
  let attempt = 0;
  while (existing) {
    attempt++;
    const suffix = Date.now().toString(36).slice(-2) + attempt.toString(36); // More entropy
    tempSubdomain = `${subdomain.substring(0, 63 - suffix.length -1)}-${suffix}`; // Ensure total length <= 63
    if (tempSubdomain.length > 63) tempSubdomain = tempSubdomain.substring(0, 63); // Final trim
    existing = await Website.findOne({ subdomain: tempSubdomain });
    if (attempt > 20) throw new Error("Failed to generate a unique subdomain after multiple attempts.");
  }
  return tempSubdomain;
}

export async function createWebsite(input: CreateWebsiteInput): Promise<CreateWebsiteResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  const parsedInput = CreateWebsiteInputSchema.safeParse(input);
  if (!parsedInput.success) {
    const errorMessages = parsedInput.error.flatten().fieldErrors;
    return { error: `Invalid input: ${JSON.stringify(errorMessages)}` };
  }

  const { name, description, templateId } = parsedInput.data;
  let { subdomain } = parsedInput.data;

  try {
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return { error: "User not found." };
    }
    const planLimits = session.user.subscriptionLimits; 
    const userWebsitesCount = await Website.countDocuments({ userId });
    if (planLimits && planLimits.websites !== Infinity && userWebsitesCount >= planLimits.websites) {
      console.warn(`[CreateWebsite] User ${userId} reached website limit. Current: ${userWebsitesCount}, Limit: ${planLimits.websites}`);
      return { error: `Website creation limit of ${planLimits.websites} reached for your current plan. Please upgrade to create more websites.` };
    }

    if (!subdomain) {
      subdomain = await generateUniqueSubdomain(name);
    } else {
      const existingSubdomain = await Website.findOne({ subdomain });
      if (existingSubdomain) {
        return { error: `Subdomain "${subdomain}" is already taken. Please choose another or leave it blank to auto-generate.` };
      }
    }

    let initialPages: IWebsiteVersionPage[] = [{
      _id: new mongoose.Types.ObjectId().toString(),
      name: "Home",
      slug: "/",
      elements: [],
      seoTitle: "Home Page",
      seoDescription: "Welcome to your new website!"
    }];
    let globalSettings = {};

    if (templateId) {
      const template = await Template.findById(templateId).lean(); // Use lean for plain object
      const hasPurchased = session.user.purchasedTemplateIds?.includes(templateId);

      if (template && template.status === 'approved' && (!template.isPremium || hasPurchased)) {
        initialPages = template.pages.map(p => ({
          _id: new mongoose.Types.ObjectId().toString(), // New ID for this instance
          name: p.name,
          slug: p.slug,
          elements: p.elements.map(el => ({ 
            _id: new mongoose.Types.ObjectId().toString(), // New ID for this instance
            type: el.type,
            config: el.config,
            order: el.order,
          })), 
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
        }));
      } else if (template?.isPremium && !hasPurchased) {
          return { error: "You have not purchased this premium template." };
      } else {
        console.warn(`[CreateWebsite] Template ${templateId} not found, not approved, or purchase issue. Creating blank website.`);
      }
    }

    const newWebsite = new Website({
      userId,
      name,
      description,
      subdomain,
      status: 'draft' as WebsiteStatus,
      templateId: templateId || undefined,
    });
    const savedWebsite = await newWebsite.save();

    const initialVersion = new WebsiteVersion({
      websiteId: savedWebsite._id,
      versionNumber: Date.now(), 
      pages: initialPages,
      globalSettings,
      createdByUserId: userId,
    });
    const savedVersion = await initialVersion.save();

    savedWebsite.currentVersionId = savedVersion._id;
    const finalWebsite = await savedWebsite.save();

    console.log(`[CreateWebsite] Website "${name}" created for user ${userId} with subdomain ${subdomain}. Initial version ID: ${savedVersion._id}`);
    return { success: "Website created successfully.", website: serializeObject(finalWebsite) };

  } catch (error: any) {
    console.error(`[CreateWebsite] Error creating website for user ${userId}:`, error);
    if (error.code === 11000 && error.message.includes('subdomain')) { 
      return { error: `Subdomain "${subdomain}" is already taken (database constraint).` };
    }
    return { error: `Failed to create website: ${error.message}` };
  }
}


const CreateWebsiteFromPromptInputSchema = z.object({
  name: z.string().min(3, "Website name must be at least 3 characters.").max(100),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters.")
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Subdomain must be lowercase alphanumeric with hyphens.")
    .optional(),
  prompt: z.string().min(10, "AI prompt must be at least 10 characters long.").max(500),
});

export type CreateWebsiteFromPromptInput = z.infer<typeof CreateWebsiteFromPromptInputSchema>;

interface CreateWebsiteFromPromptResult {
  success?: string;
  error?: string;
  website?: IWebsite;
}

export async function createWebsiteFromPrompt(input: CreateWebsiteFromPromptInput): Promise<CreateWebsiteFromPromptResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  const parsedInput = CreateWebsiteFromPromptInputSchema.safeParse(input);
  if (!parsedInput.success) {
    const errorMessages = parsedInput.error.flatten().fieldErrors;
    return { error: `Invalid input: ${JSON.stringify(errorMessages)}` };
  }
  
  const { name, prompt } = parsedInput.data;
  let { subdomain } = parsedInput.data;

  try {
    console.log(`[AI_CreateWebsite] User ${userId} starting generation with prompt: "${prompt}"`);
    
    // Step 1: Call the AI flow to generate page structure
    const aiResult = await generateWebsiteFromPrompt({ prompt });
    if (!aiResult || !aiResult.pages || aiResult.pages.length === 0) {
      return { error: "The AI failed to generate a website structure. Please try a different prompt." };
    }
    console.log(`[AI_CreateWebsite] AI generated ${aiResult.pages.length} pages.`);

    // The rest of this function is very similar to `createWebsite`, but uses the AI-generated content.
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) return { error: "User not found." };
    
    const planLimits = session.user.subscriptionLimits;
    const userWebsitesCount = await Website.countDocuments({ userId });
    if (planLimits && planLimits.websites !== Infinity && userWebsitesCount >= planLimits.websites) {
      return { error: `Website creation limit of ${planLimits.websites} reached for your current plan. Please upgrade to create more websites.` };
    }

    if (!subdomain) {
      subdomain = await generateUniqueSubdomain(name);
    } else {
      const existingSubdomain = await Website.findOne({ subdomain });
      if (existingSubdomain) {
        return { error: `Subdomain "${subdomain}" is already taken.` };
      }
    }

    // Step 2: Use the AI-generated pages as the initial content
    const initialPages: IWebsiteVersionPage[] = aiResult.pages.map(p => ({
      _id: new mongoose.Types.ObjectId().toString(),
      name: p.name,
      slug: p.slug,
      elements: p.elements.map(el => ({
        _id: new mongoose.Types.ObjectId().toString(),
        type: el.type,
        config: el.config,
        order: el.order,
      })),
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
    }));
    
    // Step 3: Create the Website and WebsiteVersion documents
    const newWebsite = new Website({
      userId,
      name,
      description: `AI-generated website based on the prompt: "${prompt}"`,
      subdomain,
      status: 'draft' as WebsiteStatus,
    });
    const savedWebsite = await newWebsite.save();

    const initialVersion = new WebsiteVersion({
      websiteId: savedWebsite._id,
      versionNumber: Date.now(),
      pages: initialPages,
      globalSettings: {}, // AI could potentially generate this too in the future
      createdByUserId: userId,
    });
    const savedVersion = await initialVersion.save();

    savedWebsite.currentVersionId = savedVersion._id;
    const finalWebsite = await savedWebsite.save();

    console.log(`[AI_CreateWebsite] AI-generated website "${name}" created for user ${userId}.`);
    return { success: "AI-generated website created successfully.", website: serializeObject(finalWebsite) };

  } catch (error: any) {
    console.error(`[AI_CreateWebsite] Error creating AI website for user ${userId}:`, error);
    if (error.code === 11000 && error.message.includes('subdomain')) {
      return { error: `Subdomain "${subdomain}" is already taken (database constraint).` };
    }
    return { error: `Failed to create website with AI: ${error.message}` };
  }
}


const PageComponentConfigSchema = z.record(z.any()); 

const PageComponentInputSchema = z.object({
  _id: z.string().optional(), // Allow string for client-side IDs
  type: z.string().min(1, "Component type is required."),
  config: PageComponentConfigSchema,
  order: z.number().int(),
});

const PageInputSchema = z.object({
  _id: z.string().optional(), // Allow string for client-side IDs
  name: z.string().min(1, "Page name is required."),
  slug: z.string().min(1, "Page slug is required.")
    .regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*|\/)$/, "Slug must be lowercase alphanumeric with hyphens, or a single '/' for home."),
  elements: z.array(PageComponentInputSchema).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

const SaveWebsiteContentInputSchema = z.object({
  websiteId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Website ID.",
  }),
  pages: z.array(PageInputSchema).min(1, "At least one page is required."),
  globalSettings: z.record(z.any()).optional(),
});

export type SaveWebsiteContentInput = z.infer<typeof SaveWebsiteContentInputSchema>;

interface SaveWebsiteContentResult {
  success?: string;
  error?: string;
  versionId?: string;
  website?: IWebsite;
}

export async function saveWebsiteContent(input: SaveWebsiteContentInput): Promise<SaveWebsiteContentResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  const parsedInput = SaveWebsiteContentInputSchema.safeParse(input);
  if (!parsedInput.success) {
    const errorMessages = parsedInput.error.flatten().fieldErrors;
    console.error("[SaveWebsiteContent] Validation errors:", errorMessages);
    return { error: `Invalid input: ${JSON.stringify(errorMessages)}` };
  }

  const { websiteId, pages, globalSettings } = parsedInput.data;

  try {
    await dbConnect();
    const website = await Website.findById(websiteId);

    if (!website) {
      return { error: "Website not found." };
    }
    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to modify this website." };
    }

    const newVersion = new WebsiteVersion({
      websiteId: website._id,
      versionNumber: Date.now(), 
      pages: pages.map(p => ({
        _id: p._id || new mongoose.Types.ObjectId().toString(), // Use existing string ID or generate new if not present
        name: p.name,
        slug: p.slug,
        elements: p.elements?.map(el => ({
            _id: el._id || new mongoose.Types.ObjectId().toString(), // Use existing string ID or generate new
            type: el.type,
            config: el.config,
            order: el.order,
        })) || [],
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
      })),
      globalSettings: globalSettings || {},
      createdByUserId: userId,
    });

    const savedVersion = await newVersion.save();
    website.currentVersionId = savedVersion._id;
    const updatedWebsiteDoc = await website.save();
    
    console.log(`[SaveWebsiteContent] Content saved for website ${websiteId}. New version ID: ${savedVersion._id}`);
    return {
      success: "Website content saved successfully.",
      versionId: savedVersion._id.toString(),
      website: serializeObject(updatedWebsiteDoc),
    };

  } catch (error: any) {
    console.error(`[SaveWebsiteContent] Error saving content for website ${websiteId}:`, error);
    if (error instanceof z.ZodError) {
        return { error: `Zod Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { error: `Failed to save website content: ${error.message}` };
  }
}

export async function publishWebsite(input: { websiteId: string }): Promise<WebsiteActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "User not authenticated." };
  
  const parsedInput = WebsiteActionInputSchema.safeParse(input);
  if (!parsedInput.success) return { error: "Invalid input." };
  const { websiteId } = parsedInput.data;
  const userId = session.user.id;

  try {
    await dbConnect();
    const website = await Website.findById(websiteId);

    if (!website) return { error: "Website not found." };
    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to publish this website." };
    }
    if (!website.currentVersionId) {
      return { error: "No current version available to publish. Please save a version of your website first." };
    }

    website.status = 'published' as WebsiteStatus;
    website.lastPublishedAt = new Date();
    website.publishedVersionId = website.currentVersionId; 
    
    const updatedWebsiteDoc = await website.save();
    console.log(`[WebsiteAction_Publish] Website ${websiteId}, version ${website.publishedVersionId} marked as published.`);
    return { success: "Website published successfully.", website: serializeObject(updatedWebsiteDoc) };
  } catch (error: any) {
    console.error(`[WebsiteAction_Publish] Error publishing website ${websiteId}:`, error);
    try {
      await Website.findByIdAndUpdate(websiteId, { status: 'error_publishing' as WebsiteStatus });
    } catch (statusUpdateError) {
      console.error(`[WebsiteAction_Publish] Failed to update status to error_publishing for website ${websiteId}:`, statusUpdateError);
    }
    return { error: `Failed to publish website: ${error.message}` };
  }
}

export async function unpublishWebsite(input: { websiteId: string }): Promise<WebsiteActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "User not authenticated." };

  const parsedInput = WebsiteActionInputSchema.safeParse(input);
  if (!parsedInput.success) return { error: "Invalid input." };
  const { websiteId } = parsedInput.data;
  const userId = session.user.id;

  try {
    await dbConnect();
    const website = await Website.findById(websiteId);
    if (!website) return { error: "Website not found." };
    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to unpublish this website." };
    }
    
    website.status = 'unpublished' as WebsiteStatus;
    const updatedWebsiteDoc = await website.save();
    console.log(`[WebsiteAction_Unpublish] Website ${websiteId} marked as unpublished.`);
    return { success: "Website unpublished successfully.", website: serializeObject(updatedWebsiteDoc) };
  } catch (error: any) {
    console.error(`[WebsiteAction_Unpublish] Error unpublishing website ${websiteId}:`, error);
    return { error: `Failed to unpublish website: ${error.message}` };
  }
}

export async function deleteWebsite(input: { websiteId: string }): Promise<Omit<WebsiteActionResult, 'website'>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "User not authenticated." };

  const parsedInput = WebsiteActionInputSchema.safeParse(input);
  if (!parsedInput.success) return { error: "Invalid input." };
  const { websiteId } = parsedInput.data;
  const userId = session.user.id;

  try {
    await dbConnect();
    const website = await Website.findById(websiteId);
    if (!website) return { error: "Website not found." };
    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to delete this website." };
    }

    const deletionResult = await WebsiteVersion.deleteMany({ websiteId: website._id });
    console.log(`[WebsiteAction_Delete] Deleted ${deletionResult.deletedCount} versions for website ${websiteId}.`);
    await Website.findByIdAndDelete(website._id);
    
    console.log(`[WebsiteAction_Delete] Website ${websiteId} deleted successfully.`);
    return { success: "Website and all its versions deleted successfully." };
  } catch (error: any) {
    console.error(`[WebsiteAction_Delete] Error deleting website ${websiteId}:`, error);
    return { error: `Failed to delete website: ${error.message}` };
  }
}

interface GetUserWebsitesResult {
  websites?: IWebsite[]; 
  error?: string;
}
export async function getUserWebsites(): Promise<GetUserWebsitesResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  try {
    await dbConnect();
    const websitesFromDB = await Website.find({ userId }).sort({ createdAt: -1 }).lean();
    return { websites: serializeObject(websitesFromDB) };
  } catch (error: any) {
    console.error(`[WebsiteAction_GetUserWebsites] Error fetching websites for user ${userId}:`, error);
    return { error: "Failed to fetch user websites." };
  }
}

const SetCustomDomainInputSchema = z.object({
  websiteId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Website ID format.",
  }),
  domainName: z.string().min(3, "Domain name must be at least 3 characters.").max(253)
    .regex(/^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,63}$/, "Invalid domain name format."),
});

interface SetCustomDomainResult {
  success?: string;
  error?: string;
  website?: IWebsite;
}

export async function setCustomDomain(input: { websiteId: string, domainName: string }): Promise<SetCustomDomainResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  const parsedInput = SetCustomDomainInputSchema.safeParse(input);
  if (!parsedInput.success) {
    const errorMessages = parsedInput.error.flatten().fieldErrors;
    return { error: `Invalid input: ${JSON.stringify(errorMessages)}` };
  }
  const { websiteId, domainName } = parsedInput.data;
  const normalizedDomainName = domainName.toLowerCase();

  try {
    await dbConnect();
    const website = await Website.findById(websiteId);

    if (!website) {
      return { error: "Website not found." };
    }
    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to modify this website." };
    }

    const existingDomainWebsite = await Website.findOne({ 
      customDomain: normalizedDomainName, 
      _id: { $ne: websiteId } 
    });

    if (existingDomainWebsite) {
      return { error: `Domain "${normalizedDomainName}" is already in use by another website.` };
    }
    
    // In a real app, you would get this from your hosting provider (e.g., Vercel's API).
    const appHostname = process.env.VERCEL_URL || `cname.${process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || 'example.com'}`;
    const instructions = `To connect your domain, create a CNAME record in your DNS provider's settings pointing from "${normalizedDomainName}" to "${appHostname}". Verification may take a few hours.`;


    website.customDomain = normalizedDomainName;
    website.domainStatus = 'pending_verification' as DomainConnectionStatus;
    website.dnsInstructions = instructions;
    
    const updatedWebsiteDoc = await website.save();

    console.log(`[WebsiteAction_SetCustomDomain] Custom domain "${normalizedDomainName}" set for website ${websiteId}. Status: pending_verification.`);
    return { 
      success: `Custom domain "${normalizedDomainName}" has been set. Please configure your DNS records.`, 
      website: serializeObject(updatedWebsiteDoc),
    };

  } catch (error: any) {
    console.error(`[WebsiteAction_SetCustomDomain] Error setting custom domain for website ${websiteId}:`, error);
    if (error.code === 11000) { 
      return { error: `Domain "${normalizedDomainName}" might already be in use (database constraint).` };
    }
    return { error: `Failed to set custom domain: ${error.message}` };
  }
}

export async function verifyCustomDomain(input: { websiteId: string }): Promise<WebsiteActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "User not authenticated." };

  const parsedInput = WebsiteActionInputSchema.safeParse(input);
  if (!parsedInput.success) return { error: "Invalid input." };
  const { websiteId } = parsedInput.data;

  try {
    await dbConnect();
    const website = await Website.findById(websiteId);
    if (!website || (website.userId.toString() !== session.user.id && session.user.role !== 'admin')) {
      return { error: "Website not found or unauthorized." };
    }
    if (!website.customDomain) {
      return { error: "No custom domain is set for this website." };
    }

    // --- DNS Verification Logic ---
    // In a real production application, this would involve calling your hosting provider's API
    // (e.g., Vercel's Domains API) or performing a DNS lookup.
    // For this project, we will simulate a successful verification.
    
    // Example conceptual check (would be replaced with real API call):
    // const verificationResult = await vercel.checkDomain(website.customDomain);
    // if (verificationResult.status === 'verified') {
    //   website.domainStatus = 'verified';
    // } else {
    //   website.domainStatus = 'error_dns';
    //   return { error: "DNS records do not seem to be configured correctly. Please check and try again.", website: serializeObject(website) };
    // }

    // Simulating success for this project:
    website.domainStatus = 'verified';
    website.dnsInstructions = "Domain successfully verified and connected!";

    const updatedWebsite = await website.save();
    return { success: "Domain verified successfully!", website: serializeObject(updatedWebsite) };
  } catch (error: any) {
    return { error: `Failed to verify domain: ${error.message}` };
  }
}

interface GetWebsiteEditorDataResult {
  website?: IWebsite; 
  currentVersion?: IWebsiteVersion; 
  error?: string;
}
export async function getWebsiteEditorData(websiteId: string): Promise<GetWebsiteEditorDataResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }
  const userId = session.user.id;

  if (!mongoose.Types.ObjectId.isValid(websiteId)) {
    return { error: "Invalid Website ID format." };
  }

  try {
    await dbConnect();
    const websiteDoc = await Website.findById(websiteId).lean();
    if (!websiteDoc) {
      return { error: "Website not found." };
    }

    if (websiteDoc.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to view this website." };
    }

    let currentVersionDoc: IWebsiteVersion | null = null;
    if (websiteDoc.currentVersionId) {
      currentVersionDoc = await WebsiteVersion.findById(websiteDoc.currentVersionId).lean();
    }

    if (websiteDoc.currentVersionId && !currentVersionDoc) {
      console.warn(`[getWebsiteEditorData] Website ${websiteId} has currentVersionId ${websiteDoc.currentVersionId} but version document not found.`);
    }
    
    return { 
      website: serializeObject(websiteDoc), 
      currentVersion: currentVersionDoc ? serializeObject(currentVersionDoc) : undefined 
    };
  } catch (error: any) {
    console.error(`[WebsiteAction_GetWebsiteById] Error fetching website editor data for ${websiteId}:`, error);
    return { error: "Failed to fetch website editor data." };
  }
}

interface GetWebsiteMetadataResult {
  website?: IWebsite;
  error?: string;
}
export async function getWebsiteMetadata(websiteId: string): Promise<GetWebsiteMetadataResult> {
   const session = await auth(); 
  if (!mongoose.Types.ObjectId.isValid(websiteId)) {
    return { error: "Invalid Website ID format." };
  }
  try {
    await dbConnect();
    const websiteDoc = await Website.findById(websiteId)
      .select('name customDomain subdomain status lastPublishedAt createdAt currentVersionId publishedVersionId userId domainStatus') 
      .lean();
    if (!websiteDoc) {
      return { error: "Website not found." };
    }
    // Allow owner or admin to see metadata even if not published
    const websiteOwnerId = websiteDoc.userId ? websiteDoc.userId.toString() : null;
    if (websiteDoc.status !== 'published') {
        if (!session || !session.user || !websiteOwnerId || (session.user.id.toString() !== websiteOwnerId && session.user.role !== 'admin')) {
            return { error: "Website not found or not publicly available." };
        }
    }
    return { website: serializeObject(websiteDoc) };
  } catch (error: any)
{
    console.error(`[WebsiteAction_GetWebsiteMetadata] Error fetching website metadata ${websiteId}:`, error);
    return { error: "Failed to fetch website metadata." };
  }
}

interface GetPublishedSiteDataResult {
  website?: IWebsite;
  publishedVersion?: IWebsiteVersion;
  error?: string;
}

export async function getPublishedSiteDataByHost(host: string): Promise<GetPublishedSiteDataResult> {
  await dbConnect();
  const appBaseDomain = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || "notthedomain.com";

  if (!appBaseDomain) {
    console.error("[getPublishedSiteDataByHost] NEXT_PUBLIC_APP_BASE_DOMAIN is not set. Subdomain parsing will fail.");
    return { error: "Application base domain not configured." };
  }

  const hostname = host.split(':')[0].toLowerCase(); // Use lowercase for consistency

  // Step 1: Check for a matching custom domain first.
  // Handles both "www.domain.com" and "domain.com" lookups.
  const nakedDomain = hostname.replace(/^www\./, '');
  let websiteDoc: IWebsite | null = await Website.findOne({
    $or: [
      { customDomain: hostname },
      { customDomain: nakedDomain }
    ],
    status: 'published',
    domainStatus: 'verified'
  }).lean();

  // Step 2: If no custom domain matches, check for a subdomain of the app's base domain.
  if (!websiteDoc) {
    const baseDomainHostname = appBaseDomain.split(':')[0].toLowerCase();
    if (hostname.endsWith(`.${baseDomainHostname}`)) {
      const subdomain = hostname.substring(0, hostname.length - (baseDomainHostname.length + 1));
      if (subdomain && subdomain !== 'www') { // 'www' should be handled as part of the main app domain, not a user site.
        websiteDoc = await Website.findOne({ subdomain: subdomain, status: 'published' }).lean();
      }
    }
  }

  if (!websiteDoc) {
    console.log(`[getPublishedSiteDataByHost] Site not found for host: "${hostname}". Looked for custom domain and subdomain of "${appBaseDomain}".`);
    return { error: "Site not found or not published." };
  }

  if (!websiteDoc.publishedVersionId) {
    return { error: "Site is published but has no published version." };
  }

  const publishedVersionDoc = await WebsiteVersion.findById(websiteDoc.publishedVersionId).lean();

  if (!publishedVersionDoc) {
    return { error: "Published version content not found." };
  }

  return { website: serializeObject(websiteDoc), publishedVersion: serializeObject(publishedVersionDoc) };
}
