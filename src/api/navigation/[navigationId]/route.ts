
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { updateNavigation, deleteNavigation, type UpdateNavigationInput } from '@/actions/navigation';
import mongoose from 'mongoose';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { navigationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { navigationId } = params;
    const body = await request.json();

    const updateData: UpdateNavigationInput = { ...body, navigationId };

    const result = await updateNavigation(updateData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    if (error.name === 'SyntaxError') {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update navigation: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { navigationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { navigationId } = params;
    const result = await deleteNavigation(navigationId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete navigation: ' + error.message }, { status: 500 });
  }
}
