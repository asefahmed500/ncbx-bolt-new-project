
"use server";

import dbConnect from "@/lib/dbConnect";
import Website, { type IWebsite, type WebsiteStatus, type DomainConnectionStatus } from "@/models/Website";
import WebsiteVersion, { type IWebsiteVersion, type IWebsiteVersionPage } from "@/models/WebsiteVersion"; 
import User from "@/models/User"; // Needed for checking user plan limits, if any
import Template from "@/models/Template"; // Needed if creating from template
import { auth } from "@/auth";
import mongoose from "mongoose";
import { z } from "zod";
import type { IPageComponent } from "@/models/PageComponent";

interface WebsiteActionInput {
  websiteId: string;
}

interface WebsiteActionResult {
  success?: string;
  error?: string;
  website?: IWebsite; 
}

// --- Schema for Creating a new Website ---
const CreateWebsiteInputSchema = z.object({
  name: z.string().min(3, "Website name must be at least 3 characters.").max(100),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters.")
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Subdomain must be lowercase alphanumeric with hyphens.")
    .optional(), // If not provided, we can attempt to generate one
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
  let subdomain = baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 63);
  if (subdomain.length < 3) subdomain = `site-${subdomain}`; // Ensure min length

  let existing = await Website.findOne({ subdomain });
  let attempt = 0;
  while (existing) {
    attempt++;
    const newSubdomain = `${subdomain}-${attempt}`;
    if (newSubdomain.length > 63) { // Prevent overly long subdomains
        // Fallback to a more random approach if suffixing makes it too long
        subdomain = `site-${Date.now().toString(36).slice(-6)}`;
        existing = await Website.findOne({ subdomain }); 
        if (!existing) return subdomain; // If this random one is unique, use it
        // If even random one clashes (highly unlikely), this loop will continue, could add max attempts
    } else {
        subdomain = newSubdomain;
        existing = await Website.findOne({ subdomain });
    }
    if (attempt > 10) throw new Error("Failed to generate a unique subdomain after multiple attempts.");
  }
  return subdomain;
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

  const { name, templateId } = parsedInput.data;
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
      elements: [] // Start with a blank page if no template
    }];
    let globalSettings = {};

    if (templateId) {
      const template = await Template.findById(templateId);
      if (template && template.status === 'approved') {
        initialPages = template.pages.map(p => ({
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
        // globalSettings = template.globalSettings || {}; 
      } else {
        console.warn(`[CreateWebsite] Template ${templateId} not found or not approved. Creating blank website.`);
      }
    }

    const newWebsite = new Website({
      userId,
      name,
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
    return { success: "Website created successfully.", website: finalWebsite.toObject() as IWebsite };

  } catch (error: any) {
    console.error(`[CreateWebsite] Error creating website for user ${userId}:`, error);
    if (error.code === 11000 && error.message.includes('subdomain')) { 
      return { error: `Subdomain "${subdomain}" is already taken (database constraint).` };
    }
    return { error: `Failed to create website: ${error.message}` };
  }
}


// --- Schema for Saving Website Content ---
const PageComponentConfigSchema = z.record(z.any()); 

const PageComponentInputSchema = z.object({
  _id: z.string().optional(), // Allow _id, but make it optional as it might be new
  type: z.string().min(1, "Component type is required."),
  config: PageComponentConfigSchema,
  order: z.number().int(),
});

const PageInputSchema = z.object({
  _id: z.string().optional(), // Allow _id for existing pages
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
        _id: p._id || new mongoose.Types.ObjectId().toString(), // Ensure pages have an ID for React keys if not provided
        name: p.name,
        slug: p.slug,
        elements: p.elements?.map(el => ({
            _id: el._id || new mongoose.Types.ObjectId().toString(), // Ensure elements have IDs
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
    const updatedWebsite = await website.save();
    
    console.log(`[SaveWebsiteContent] Content saved for website ${websiteId}. New version ID: ${savedVersion._id}`);
    return {
      success: "Website content saved successfully.",
      versionId: savedVersion._id.toString(),
      website: updatedWebsite.toObject() as IWebsite,
    };

  } catch (error: any) {
    console.error(`[SaveWebsiteContent] Error saving content for website ${websiteId}:`, error);
    if (error instanceof z.ZodError) {
        return { error: `Zod Validation error: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { error: `Failed to save website content: ${error.message}` };
  }
}


// --- Publish/Unpublish Actions ---
export async function publishWebsite({ websiteId }: WebsiteActionInput): Promise<WebsiteActionResult> {
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
    const website = await Website.findById(websiteId);

    if (!website) {
      return { error: "Website not found." };
    }

    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to publish this website." };
    }

    if (!website.currentVersionId) {
      return { error: "No current version available to publish. Please save a version of your website first." };
    }

    console.log(`[WebsiteAction_Publish] Attempting to publish website ${websiteId}, version ${website.currentVersionId}...`);

    website.status = 'published' as WebsiteStatus;
    website.lastPublishedAt = new Date();
    website.publishedVersionId = website.currentVersionId; 
    
    const updatedWebsite = await website.save();

    console.log(`[WebsiteAction_Publish] Website ${websiteId}, version ${website.publishedVersionId} marked as published.`);
    return { success: "Website published successfully.", website: updatedWebsite.toObject() as IWebsite };

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

export async function unpublishWebsite({ websiteId }: WebsiteActionInput): Promise<WebsiteActionResult> {
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
    const website = await Website.findById(websiteId);

    if (!website) {
      return { error: "Website not found." };
    }

    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to unpublish this website." };
    }

    console.log(`[WebsiteAction_Unpublish] Attempting to unpublish website ${websiteId}...`);
    
    website.status = 'unpublished' as WebsiteStatus;
    const updatedWebsite = await website.save();

    console.log(`[WebsiteAction_Unpublish] Website ${websiteId} marked as unpublished.`);
    return { success: "Website unpublished successfully.", website: updatedWebsite.toObject() as IWebsite };

  } catch (error: any) {
    console.error(`[WebsiteAction_Unpublish] Error unpublishing website ${websiteId}:`, error);
    return { error: `Failed to unpublish website: ${error.message}` };
  }
}

// --- Delete Website ---
export async function deleteWebsite({ websiteId }: WebsiteActionInput): Promise<Omit<WebsiteActionResult, 'website'>> {
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
    const website = await Website.findById(websiteId);

    if (!website) {
      return { error: "Website not found." };
    }

    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to delete this website." };
    }

    console.log(`[WebsiteAction_Delete] Attempting to delete website ${websiteId} and its versions...`);

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


// --- Get User Websites ---
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
    const websites = await Website.find({ userId }).sort({ createdAt: -1 }).lean();
    return { websites: websites as IWebsite[] };
  } catch (error: any) {
    console.error(`[WebsiteAction_GetUserWebsites] Error fetching websites for user ${userId}:`, error);
    return { error: "Failed to fetch user websites." };
  }
}

// --- Custom Domain Management ---
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
  dnsInstructions?: string;
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
    
    const instructions = `To connect "${normalizedDomainName}", update your DNS settings. This typically involves adding a CNAME record pointing to your app's hosting target or A records. Consult your hosting provider's documentation for specific record values. Verification may take up to 48 hours.`;

    website.customDomain = normalizedDomainName;
    website.domainStatus = 'pending_verification' as DomainConnectionStatus;
    website.dnsInstructions = instructions;
    
    const updatedWebsite = await website.save();

    console.log(`[WebsiteAction_SetCustomDomain] Custom domain "${normalizedDomainName}" set for website ${websiteId}. Status: pending_verification.`);
    return { 
      success: `Custom domain "${normalizedDomainName}" has been set. Please configure your DNS records.`, 
      website: updatedWebsite.toObject() as IWebsite,
      dnsInstructions: instructions,
    };

  } catch (error: any) {
    console.error(`[WebsiteAction_SetCustomDomain] Error setting custom domain for website ${websiteId}:`, error);
    if (error.code === 11000) { 
      return { error: `Domain "${normalizedDomainName}" might already be in use (database constraint).` };
    }
    return { error: `Failed to set custom domain: ${error.message}` };
  }
}

// --- Get Website by ID (for editor or detailed view) ---
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
    const website = await Website.findById(websiteId).lean();
    if (!website) {
      return { error: "Website not found." };
    }

    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to view this website." };
    }

    let currentVersion: IWebsiteVersion | null = null;
    if (website.currentVersionId) {
      currentVersion = await WebsiteVersion.findById(website.currentVersionId).lean();
    }

    if (website.currentVersionId && !currentVersion) {
      console.warn(`[getWebsiteEditorData] Website ${websiteId} has currentVersionId ${website.currentVersionId} but version document not found.`);
    }
    
    return { 
      website: website as IWebsite, 
      currentVersion: currentVersion ? currentVersion as IWebsiteVersion : undefined 
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
    const website = await Website.findById(websiteId)
      .select('name customDomain subdomain status lastPublishedAt createdAt currentVersionId publishedVersionId userId domainStatus') 
      .lean();
    if (!website) {
      return { error: "Website not found." };
    }
    if (website.status !== 'published') {
        const websiteOwnerId = website.userId ? website.userId.toString() : null;
        if (!session || !websiteOwnerId || (session.user.id.toString() !== websiteOwnerId && session.user.role !== 'admin')) {
            return { error: "Website not found or not publicly available." };
        }
    }
    return { website: website as IWebsite };
  } catch (error: any)
{
    console.error(`[WebsiteAction_GetWebsiteMetadata] Error fetching website metadata ${websiteId}:`, error);
    return { error: "Failed to fetch website metadata." };
  }
}


// --- Get Published Site Data by Hostname ---
interface GetPublishedSiteDataResult {
  website?: IWebsite;
  publishedVersion?: IWebsiteVersion;
  error?: string;
}

export async function getPublishedSiteDataByHost(host: string): Promise<GetPublishedSiteDataResult> {
  await dbConnect();
  const appBaseDomain = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN;

  if (!appBaseDomain) {
    console.error("[getPublishedSiteDataByHost] NEXT_PUBLIC_APP_BASE_DOMAIN is not set. Subdomain parsing will fail.");
    return { error: "Application base domain not configured." };
  }

  let website: IWebsite | null = null;

  // Check if it's a subdomain of our app
  if (host.endsWith(`.${appBaseDomain}`)) {
    const subdomain = host.substring(0, host.length - (appBaseDomain.length + 1));
    if (subdomain && subdomain !== 'www') { // Add common exclusions like 'www' if your app itself is at www.appBaseDomain
      website = await Website.findOne({ subdomain, status: 'published' }).lean();
    }
  } else {
    // If not a subdomain, assume it's a custom domain
    website = await Website.findOne({ customDomain: host, status: 'published', domainStatus: 'verified' }).lean();
  }

  if (!website) {
    return { error: "Site not found or not published." };
  }

  if (!website.publishedVersionId) {
    return { error: "Site is published but has no published version." };
  }

  const publishedVersion = await WebsiteVersion.findById(website.publishedVersionId).lean();

  if (!publishedVersion) {
    return { error: "Published version content not found." };
  }

  return { website: website as IWebsite, publishedVersion: publishedVersion as IWebsiteVersion };
}


