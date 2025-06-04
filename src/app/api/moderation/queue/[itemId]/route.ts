
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { processModerationItemByAdmin, type ProcessModerationItemInput } from '@/actions/admin';
import mongoose from 'mongoose';

export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { itemId } = params;
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: 'Invalid Item ID format' }, { status: 400 });
    }
    
    const body = await request.json() as Omit<ProcessModerationItemInput, 'itemId'>;
    const inputData: ProcessModerationItemInput = { ...body, itemId };

    const result = await processModerationItemByAdmin(inputData);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.item, { status: 200 });
  } catch (error: any) {
    console.error(`[API_PROCESS_MODERATION_ITEM_${params.itemId}] Error:`, error);
    if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process moderation item: ' + error.message }, { status: 500 });
  }
}

// GET for a specific moderation item could be added if needed by admin UI for detail view
// DELETE is unlikely as processed items are usually kept for record
