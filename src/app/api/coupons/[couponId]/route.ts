
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getCouponByIdForAdmin, updateCouponByAdmin, deleteCouponByAdmin, type UpdateCouponInput } from '@/actions/admin';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { couponId: string } }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const { couponId } = params;
    if (!mongoose.Types.ObjectId.isValid(couponId) && couponId.toUpperCase() !== couponId) {
         // Allow fetching by code as well, if needed, or enforce ObjectId
        // For simplicity, let's assume getCouponByIdForAdmin handles finding by ID string.
    }

    const result = await getCouponByIdForAdmin(couponId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 }); // Assuming error means not found for GET
    }
    return NextResponse.json(result.coupon, { status: 200 });
  } catch (error: any) {
    console.error(`[API_GET_COUPON_${params.couponId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch coupon: ' + error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { couponId: string } }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { couponId } = params;
    // getCouponByIdForAdmin action expects string, so validation of couponId format is inside it.
    
    const body = await request.json() as Omit<UpdateCouponInput, 'couponId'>;
    const updateData: UpdateCouponInput = { ...body, couponId };

    const result = await updateCouponByAdmin(updateData);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.coupon, { status: 200 });
  } catch (error: any) {
    console.error(`[API_PUT_COUPON_${params.couponId}] Error:`, error);
    if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update coupon: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { couponId: string } }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const { couponId } = params;
    // Validation of couponId format is inside deleteCouponByAdmin action
    
    const result = await deleteCouponByAdmin(couponId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 }); // Or 404 if not found
    }
    return NextResponse.json({ success: result.success }, { status: 200 });
  } catch (error: any) {
    console.error(`[API_DELETE_COUPON_${params.couponId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to delete coupon: ' + error.message }, { status: 500 });
  }
}
