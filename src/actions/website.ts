
"use server";

import dbConnect from "@/lib/dbConnect";
import Website, { type IWebsite, type WebsiteStatus, type DomainConnectionStatus } from "@/models/Website";
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
  website?: IWebsite;
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

    // Ownership check
    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to modify this website." };
    }

    // Conceptual: Here you would trigger the actual build & deployment process.
    // This could involve generating static files, uploading to hosting, etc.
    // For now, we just update the status.
    console.log(`[WebsiteAction_Publish] Conceptual: Starting deployment for website ${websiteId}...`);

    website.status = 'published' as WebsiteStatus;
    website.lastPublishedAt = new Date();
    const updatedWebsite = await website.save();

    console.log(`[WebsiteAction_Publish] Conceptual: Deployment for website ${websiteId} completed. Status set to published.`);
    return { success: "Website published successfully.", website: updatedWebsite.toObject() as IWebsite };

  } catch (error: any) {
    console.error(`[WebsiteAction_Publish] Error publishing website ${websiteId}:`, error);
    // Attempt to set status to 'error_publishing' if possible
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

    // Ownership check
    if (website.userId.toString() !== userId && session.user.role !== 'admin') {
      return { error: "Unauthorized to modify this website." };
    }

    // Conceptual: Here you would trigger logic to take the site offline or remove it from public access.
    console.log(`[WebsiteAction_Unpublish] Conceptual: Starting unpublish process for website ${websiteId}...`);
    
    website.status = 'unpublished' as WebsiteStatus;
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

    // Check if this domain is already in use by ANOTHER website
    const existingDomainWebsite = await Website.findOne({ 
      customDomain: normalizedDomainName, 
      _id: { $ne: websiteId } // Exclude the current website from the check
    });

    if (existingDomainWebsite) {
      return { error: `Domain "${normalizedDomainName}" is already in use by another website.` };
    }
    
    // Conceptual: Your actual DNS instructions will depend on your hosting provider.
    // e.g., CNAME to your app's domain, or A records to specific IPs.
    const instructions = `To connect "${normalizedDomainName}", update your DNS settings. ` +
                         `This typically involves adding a CNAME record pointing to your app's hosting target, or A records. ` +
                         `Consult your hosting provider's documentation for specific record values. ` +
                         `Verification may take up to 48 hours.`;

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

  } catch (error: any)
 {
    console.error(`[WebsiteAction_SetCustomDomain] Error setting custom domain for website ${websiteId}:`, error);
    if (error.code === 11000) { // Likely duplicate key error if index on customDomain is strict
      return { error: `Domain "${normalizedDomainName}" might already be in use (database constraint).` };
    }
    return { error: `Failed to set custom domain: ${error.message}` };
  }
}

// --- Get Website by ID ---
interface GetWebsiteByIdResult {
  website?: IWebsite;
  error?: string;
}
export async function getWebsiteById(websiteId: string): Promise<GetWebsiteByIdResult> {
  const session = await auth(); // Optional: Add auth check if only owners/admins can fetch
  if (!session?.user?.id) {
    // Allow public fetching for now, or add role/ownership check
    // return { error: "User not authenticated." };
  }

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
    console.error(`[WebsiteAction_GetWebsiteById] Error fetching website ${websiteId}:`, error);
    return { error: "Failed to fetch website details." };
  }
}
