
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

    console.log(`[WebsiteAction_Publish] Conceptual: Starting deployment for website ${websiteId}...`);

    // --- Static Site Generation (SSG) & Deployment Process ---
    // The following outlines a conceptual process for generating and deploying a static version
    // of the user's website. Actual implementation requires a build pipeline and hosting integration.

    // 1. Fetch Website Data:
    //    - Retrieve the full website structure (pages, components, global settings) from MongoDB.
    //    - This includes all IPage documents and their IPageComponent arrays associated with the website.

    // 2. Static HTML File Generation:
    //    - For each page in the website:
    //      - Map IPageComponent data (type and config) to corresponding React components.
    //        (e.g., a 'text' type maps to a <TextDisplayComponent config={component.config} />).
    //      - Render these React components to static HTML strings. If this generation happens
    //        in a separate build process, Next.js's `renderToStaticMarkup` or similar could be used.
    //      - Save each page as an .html file (e.g., about-us.html, index.html for the root page).
    //      - Ensure correct directory structure for nested pages if applicable.

    // 3. Asset Handling:
    //    - Collect all static assets referenced by the website components (e.g., images from image components,
    //      global fonts, custom CSS snippets).
    //    - Place them in appropriate folders within the build output (e.g., /assets/images, /css).
    //    - Update HTML files to correctly reference these assets with relative or absolute paths
    //      depending on the deployment strategy.

    // 4. Optimization ("Optimize for speed"):
    //    - Minify HTML, CSS, and JavaScript files.
    //    - Compress images (e.g., using tools like ImageOptim or squoosh).
    //    - Implement lazy loading for images and other off-screen content (often done client-side via JS).
    //    - Consider generating critical CSS to improve perceived load time.

    // 5. Incremental Updates (e.g., for Next.js ISR if hosting on a Next.js compatible platform):
    //    - If using a platform supporting ISR (like Vercel or a custom Next.js server for user sites):
    //      - The "publishing" step might involve triggering revalidation for specific paths using Next.js's
    //        on-demand revalidation API (e.g., `res.revalidate('/user-site-path')`).
    //      - Alternatively, pages could be configured with a default `revalidate` interval during their generation.
    //    - For a purely static export to basic hosting (e.g., S3), "incremental updates" would mean
    //      regenerating only the pages that have changed since the last publish and re-uploading them.

    // 6. Handling Dynamic Content:
    //    - For truly static sites, "dynamic content" (e.g., from external APIs, user comments, live data feeds)
    //      is typically fetched client-side using JavaScript (e.g., in a useEffect hook) after the static page loads.
    //    - If the hosting platform supports edge functions or serverless functions, these could
    //      be used to inject dynamic content or handle API requests from the static site.
    //    - For forms (contact forms, surveys): The static HTML form would submit its data to a
    //      serverless function or a dedicated backend API endpoint for processing.

    // 7. Deployment:
    //    - Upload the generated static files (HTML, CSS, JS, assets) to a hosting provider
    //      (e.g., Firebase Hosting, AWS S3 + CloudFront, Netlify, Vercel for static sites).
    //    - If using custom domains, ensure DNS records are configured to point to the hosting provider.
    //    - SSL certificates are typically managed by the hosting provider.

    // 8. Error Handling & Monitoring ("Handle deployment errors", "Monitor publishing success"):
    //    - Implement comprehensive logging throughout the generation and deployment process.
    //    - If errors occur (e.g., build failure, upload failure), update the website's status to 'error_publishing'
    //      and store error details.
    //    - Notify the admin and/or user of deployment success or failure.
    //    - Set up monitoring for the deployed sites (uptime, performance).

    // --- End of Conceptual SSG Process ---

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
    // This might involve removing files from hosting or updating CDN rules.
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
                         `This typically involves adding a CNAME record pointing to your app's hosting target (e.g., your-app-default.apphosting.firebaseapp.com), or A records to specific IP addresses if required by your hosting solution. ` +
                         `Consult your hosting provider's documentation for specific record values. ` +
                         `Verification may take up to 48 hours after DNS changes propagate.`;

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

