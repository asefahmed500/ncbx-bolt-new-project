
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/dbConnect';
import Subscription from '@/models/Subscription';
import mongoose from 'mongoose';

// Helper function for serialization
const serialize = (data: any): any => {
  if (!data) return data;
  let plainObject = data.toObject ? data.toObject({ transform: false, virtuals: false }) : { ...data };
  
  const convertObjectIds = (obj: any) => {
    for (const key in obj) {
      if (obj[key] instanceof mongoose.Types.ObjectId) {
        obj[key] = obj[key].toString();
      } else if (obj[key] instanceof Date) {
        obj[key] = obj[key].toISOString();
      } else if (Array.isArray(obj[key])) {
         obj[key] = obj[key].map((item: any) => (item instanceof mongoose.Types.ObjectId ? item.toString() : convertObjectIds(item)));
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        convertObjectIds(obj[key]);
      }
    }
    return obj;
  };
  return convertObjectIds(plainObject);
};


export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    await dbConnect();
    // Find the most recent active-like subscription for the user
    const subscription = await Subscription.findOne({ 
      userId: session.user.id,
      // stripeSubscriptionStatus: { $in: ['active', 'trialing', 'past_due'] } // Optionally filter active-like statuses
    }).sort({ stripeCurrentPeriodEnd: -1 }).lean(); // Get latest if multiple exist

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found.' }, { status: 404 });
    }

    return NextResponse.json(serialize(subscription), { status: 200 });
  } catch (error: any) {
    console.error('[API_GET_MY_SUBSCRIPTION] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription details: ' + error.message }, { status: 500 });
  }
}

// POST, PUT, DELETE for subscriptions are handled by Stripe webhooks and checkout/portal sessions,
// not direct API manipulation from the client for the Subscription model itself.
