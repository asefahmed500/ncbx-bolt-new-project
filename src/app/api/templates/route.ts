
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createTemplate, type CreateTemplateInput } from '@/actions/templates';
import Template from '@/models/Template'; // For GET
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

// Helper function for serialization, can be moved to a shared lib
const serialize = (data: any): any => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(item => serialize(item));
  
  let plainObject = data;
  if (data.toObject) { // Mongoose document
    plainObject = data.toObject({ transform: false, virtuals: false });
  } else if (typeof data === 'object' && data !== null) { // Already a lean object, ensure IDs are strings
    plainObject = { ...data };
  } else {
    return data; // Primitives
  }

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
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status') || 'approved'; // Default to approved for public listing
    const category = searchParams.get('category') || undefined;
    const isPremium = searchParams.get('isPremium'); // 'true', 'false', or undefined

    const query: any = { status };
    if (category) query.category = category;
    if (isPremium === 'true') query.isPremium = true;
    if (isPremium === 'false') query.isPremium = false;

    const templates = await Template.find(query)
      .populate('createdByUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
      
    const totalTemplates = await Template.countDocuments(query);
    
    return NextResponse.json({ templates: serialize(templates), totalTemplates }, { status: 200 });
  } catch (error: any) {
    console.error('[API_GET_TEMPLATES] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to create a template.' }, { status: 401 });
    }

    const body = await request.json() as CreateTemplateInput;
    const result = await createTemplate(body); // createTemplate action already handles DB ops & auth internally for ownership

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.template, { status: 201 });
  } catch (error: any) {
    console.error('[API_POST_TEMPLATE] Error:', error);
    if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create template: ' + error.message }, { status: 500 });
  }
}
