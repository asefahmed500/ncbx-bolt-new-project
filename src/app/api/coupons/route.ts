
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getCouponsForAdmin, createCoupon, type CreateCouponInput } from '@/actions/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const result = await getCouponsForAdmin(page, limit);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ coupons: result.coupons, totalCoupons: result.totalCoupons }, { status: 200 });
  } catch (error: any) {
    console.error('[API_GET_COUPONS] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json() as CreateCouponInput;
    const result = await createCoupon(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.coupon, { status: 201 });
  } catch (error: any) {
    console.error('[API_POST_COUPON] Error:', error);
    if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create coupon: ' + error.message }, { status: 500 });
  }
}
