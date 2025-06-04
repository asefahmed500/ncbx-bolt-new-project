
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { submitTemplateReview, type SubmitTemplateReviewInput } from '@/actions/templates';
import TemplateReview from '@/models/TemplateReview'; // For GET
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// Helper function for serialization
const serialize = (data: any): any => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(item => serialize(item));
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


export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const { templateId } = params;
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return NextResponse.json({ error: 'Invalid Template ID format' }, { status: 400 });
    }
    
    await dbConnect();
    // Only fetch approved reviews for public display
    const reviews = await TemplateReview.find({ templateId, isApproved: true })
      .populate('userId', 'name avatarUrl') // Populate user details for display
      .sort({ createdAt: -1 })
      .lean();
      
    return NextResponse.json(serialize(reviews), { status: 200 });
  } catch (error: any) {
    console.error(`[API_GET_TEMPLATE_REVIEWS_${params.templateId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch reviews: ' + error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to submit a review.' }, { status: 401 });
    }

    const { templateId } = params;
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return NextResponse.json({ error: 'Invalid Template ID format' }, { status: 400 });
    }
    
    const body = await request.json() as Omit<SubmitTemplateReviewInput, 'templateId'>;
    const inputData: SubmitTemplateReviewInput = { ...body, templateId };
    
    const result = await submitTemplateReview(inputData);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.review, { status: 201 });
  } catch (error: any) {
    console.error(`[API_POST_TEMPLATE_REVIEW_${params.templateId}] Error:`, error);
    if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit review: ' + error.message }, { status: 500 });
  }
}
