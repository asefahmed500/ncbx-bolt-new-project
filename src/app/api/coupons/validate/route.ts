
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/dbConnect';
import Coupon from '@/models/Coupon';
import User from '@/models/User'; // If per-user coupon usage needs to be checked

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    // Allow authenticated users to validate, or make it public if needed for guest checkout
    if (!session?.user?.id) {
      // return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await request.json();
    const { code, amountInCents } = body; // amountInCents is the current cart total

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
    }
    if (amountInCents !== undefined && typeof amountInCents !== 'number') {
        return NextResponse.json({ error: 'Invalid amount provided.' }, { status: 400 });
    }

    await dbConnect();
    const couponCode = code.toUpperCase();
    const coupon = await Coupon.findOne({ code: couponCode, isActive: true }).lean();

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or inactive coupon code.' }, { status: 400 });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Coupon code has expired.' }, { status: 400 });
    }

    if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
      return NextResponse.json({ error: 'Coupon usage limit reached.' }, { status: 400 });
    }
    
    if (coupon.minPurchaseAmount && amountInCents !== undefined && amountInCents < coupon.minPurchaseAmount) {
        const currency = 'USD'; // Assuming USD, make dynamic if needed
        const minPurchaseDisplay = (coupon.minPurchaseAmount / 100).toFixed(2);
        return NextResponse.json({ error: `Minimum purchase of ${minPurchaseDisplay} ${currency} required for this coupon.` }, { status: 400 });
    }

    // TODO: Add per-user usage limit check if `session.user.id` is available and coupon.userUsageLimit > 0
    // This would require tracking how many times a user has used a specific coupon (e.g., in a UserCouponUsage model or similar)

    let discountApplied = 0;
    let finalAmount = amountInCents;

    if (amountInCents !== undefined) {
        if (coupon.discountType === 'percentage') {
            discountApplied = Math.round(amountInCents * (coupon.discountValue / 100));
        } else if (coupon.discountType === 'fixed_amount') {
            // Assuming discountValue for fixed_amount is stored in cents
            discountApplied = coupon.discountValue;
        }
        finalAmount = Math.max(0, amountInCents - discountApplied);
    }


    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountType === 'fixed_amount' ? coupon.discountValue / 100 : coupon.discountValue, // display value
      discountAmount: discountApplied, // in cents
      originalAmount: amountInCents, // in cents
      finalAmount: finalAmount, // in cents
      message: 'Coupon applied successfully.',
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API_VALIDATE_COUPON] Error:', error);
    if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to validate coupon: ' + error.message }, { status: 500 });
  }
}
