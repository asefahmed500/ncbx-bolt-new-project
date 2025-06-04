
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { saveWebsiteContent, type SaveWebsiteContentInput } from '@/actions/website';
import mongoose from 'mongoose';

/**
 * POST /api/websites/[websiteId]/content
 * Saves the content (pages, elements, global settings) for a specific website,
 * creating a new WebsiteVersion.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { websiteId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
    }

    const { websiteId } = params;
    if (!websiteId || !mongoose.Types.ObjectId.isValid(websiteId)) {
      return NextResponse.json({ error: 'Invalid Website ID format.' }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate body against SaveWebsiteContentInput structure (simplified for this example)
    // In a real app, use Zod or a similar library for robust validation here.
    if (!body.pages || !Array.isArray(body.pages)) {
      return NextResponse.json({ error: 'Invalid request body: "pages" array is required.' }, { status: 400 });
    }

    const input: SaveWebsiteContentInput = {
      websiteId,
      pages: body.pages,
      globalSettings: body.globalSettings || {},
    };

    const result = await saveWebsiteContent(input);

    if (result.error) {
      // The error from saveWebsiteContent might already be user-friendly
      // Or you might want to map it to specific HTTP status codes
      console.error(`[API_SaveContent] Error saving content for website ${websiteId}:`, result.error);
      return NextResponse.json({ error: result.error }, { status: 400 }); // Or 500 if it's a server error
    }

    if (result.success && result.website && result.versionId) {
      return NextResponse.json({ 
        success: result.success, 
        website: result.website, // This will be the serialized website object
        versionId: result.versionId 
      }, { status: 200 });
    }

    // Fallback for unexpected result structure
    console.error(`[API_SaveContent] Unexpected result structure from saveWebsiteContent for website ${websiteId}:`, result);
    return NextResponse.json({ error: 'Failed to save website content due to an unexpected issue.' }, { status: 500 });

  } catch (error: any) {
    console.error(`[API_SaveContent] Catastrophic error in POST /api/websites/[websiteId]/content:`, error);
    let errorMessage = 'An unexpected server error occurred.';
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        errorMessage = 'Invalid JSON in request body.';
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
