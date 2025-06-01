
"use server";

import dbConnect from "@/lib/dbConnect";
import Website, { type IWebsite, type WebsiteStatus, type DomainConnectionStatus } from "@/models/Website";
import WebsiteVersion, { type IWebsiteVersion } from "@/models/WebsiteVersion"; // Import WebsiteVersion
import User from "@/models/User";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { z } from "zod";

interface WebsiteActionInput {
  websiteId: string;
}

interface WebsiteActionResult {
  success?: string;
  error?: string;
  website?: IWebsite; // This might need to include version data
}

// --- Publish/Unpublish Actions ---

// IMPORTANT NOTE ON VERSIONING AND PUBLISHING:
// A full version control system would require the editor to:
// 1. Allow the user to explicitly "Save a Version". This action would take the editor's current state
//    (all pages, components, global settings), create a new `WebsiteVersion` document,
//    and update `Website.currentVersionId` to point to this new version.
// 2. The `publishWebsite` action below would then take the `Website.currentVersionId`,
//    mark that specific version's content for deployment, and update `Website.publishedVersionId`.
//
// Since the editor currently doesn't have this explicit "Save Version" or state serialization capability
// to pass to an action, this `publishWebsite` function is simplified.
// It assumes that `Website.currentVersionId` (if it exists) points to the version intended for publishing.
// A more robust `publishWebsite` would likely receive the full website content from the editor,
// create a new WebsiteVersion from it, update currentVersionId, and then proceed to publish.

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
      return { error: "Unauthorized to modify this website." };
    }

    if (!website.currentVersionId) {
      return { error: "No current version available to publish. Please save a version of your website first." };
    }

    // In a real scenario, here you would trigger the deployment process for the content
    // stored in the WebsiteVersion document pointed to by `website.currentVersionId`.
    // This involves fetching that WebsiteVersion's `pages` and `globalSettings`.
    console.log(`[WebsiteAction_Publish] Conceptual: Starting deployment for website ${websiteId}, version ${website.currentVersionId}...`);
    // ... (Actual deployment logic for the content of website.currentVersionId)

    website.status = 'published' as WebsiteStatus;
    website.lastPublishedAt = new Date();
    website.publishedVersionId = website.currentVersionId; // Mark the current version as published
    
    const updatedWebsite = await website.save();

    console.log(`[WebsiteAction_Publish] Conceptual: Deployment for website ${websiteId}, version ${website.publishedVersionId} completed. Status set to published.`);
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
      return { error: "Unauthorized to modify this website." };
    }

    console.log(`[WebsiteAction_Unpublish] Conceptual: Starting unpublish process for website ${websiteId}...`);
    
    website.status = 'unpublished' as WebsiteStatus;
    // Note: We typically don't clear publishedVersionId upon unpublishing,
    // as it represents the last version that *was* live.
    const updatedWebsite = await website.save();

    console.log(`[WebsiteAction_Unpublish] Conceptual: Unpublish for website ${websiteId} completed.`);
    return { success: "Website unpublished successfully.", website: updatedWebsite.toObject() as IWebsite };

  } catch (error: any) {
    console.error(`[WebsiteAction_Unpublish] Error unpublishing website ${websiteId}:`, error);
    return { error: `Failed to unpublish website: ${error.message}` };
  }
}

// --- Get User Websites ---
interface GetUserWebsitesResult {
  websites?: IWebsite[]; // This returns metadata, not full version content
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
  website?: IWebsite; // Core website metadata
  currentVersion?: IWebsiteVersion; // Content of the current working version
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

    // Ownership check
    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to view this website." };
    }

    let currentVersion: IWebsiteVersion | null = null;
    if (website.currentVersionId) {
      currentVersion = await WebsiteVersion.findById(website.currentVersionId).lean();
    }

    // If there's no current version (e.g., new site) or it wasn't found (should not happen if ID is set),
    // the editor would typically start with a blank slate or a default template.
    // For now, we just return null if not found.
    if (website.currentVersionId && !currentVersion) {
      console.warn(`[getWebsiteEditorData] Website ${websiteId} has currentVersionId ${website.currentVersionId} but version document not found.`);
      // Optionally, you might want to clear website.currentVersionId here or handle it.
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


// Renamed original getWebsiteById to avoid conflict, as its purpose was less clear
// This version fetches only the core website metadata.
interface GetWebsiteMetadataResult {
  website?: IWebsite;
  error?: string;
}
export async function getWebsiteMetadata(websiteId: string): Promise<GetWebsiteMetadataResult> {
   const session = await auth();
   // Adjust auth check as needed: is this for public viewing or owner/admin only?
   // For this example, assuming it might be for general info, so public access is allowed if no session.
   // if (!session?.user?.id) {
   //   return { error: "User not authenticated." };
   // }

  if (!mongoose.Types.ObjectId.isValid(websiteId)) {
    return { error: "Invalid Website ID format." };
  }
  try {
    await dbConnect();
    const website = await Website.findById(websiteId).lean();
    if (!website) {
      return { error: "Website not found." };
    }
    // Add ownership/admin check here if this action should be restricted
    // if (session?.user?.role !== 'admin' && website.userId.toString() !== session?.user?.id) {
    //   return { error: "Unauthorized to view this website." };
    // }
    return { website: website as IWebsite };
  } catch (error: any) {
    console.error(`[WebsiteAction_GetWebsiteMetadata] Error fetching website metadata ${websiteId}:`, error);
    return { error: "Failed to fetch website metadata." };
  }
}
