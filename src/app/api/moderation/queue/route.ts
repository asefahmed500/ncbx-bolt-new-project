
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getModerationQueueItems } from '@/actions/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const statusFilter = searchParams.get('status') || undefined;

    const result = await getModerationQueueItems(page, limit, statusFilter);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ items: result.items, totalItems: result.totalItems }, { status: 200 });
  } catch (error: any) {
    console.error('[API_GET_MODERATION_QUEUE] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch moderation queue: ' + error.message }, { status: 500 });
  }
}

// POST for creating moderation items is usually an internal system process (e.g., from user reports, AI flags).
// A direct public POST endpoint is generally not provided.
