
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { updateTemplateMetadataByAdmin, updateTemplateStatusByAdmin, getTemplateDataForExport } from '@/actions/admin';
import Template from '@/models/Template'; // For GET
import dbConnect from '@/lib/dbConnect';
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
    const template = await Template.findById(templateId).populate('createdByUserId', 'name email').lean();

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    // Public can view approved templates. Admins or owners might view others.
    // For simplicity, this public GET will only show approved or if admin is requesting.
    const session = await auth();
    if (template.status !== 'approved' && session?.user?.role !== 'admin' && template.createdByUserId?.toString() !== session?.user?.id) {
        return NextResponse.json({ error: 'Template not found or not available.' }, { status: 404 });
    }

    return NextResponse.json(serialize(template), { status: 200 });
  } catch (error: any) {
    console.error(`[API_GET_TEMPLATE_${params.templateId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch template: ' + error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { templateId } = params;
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return NextResponse.json({ error: 'Invalid Template ID format' }, { status: 400 });
    }

    const body = await request.json();
    let result;

    // Determine if this is a status update or metadata update based on body keys
    if (body.hasOwnProperty('status') && Object.keys(body).length === 1) {
      result = await updateTemplateStatusByAdmin({ templateId, status: body.status });
    } else {
      result = await updateTemplateMetadataByAdmin({ ...body, templateId });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.template, { status: 200 });
  } catch (error: any) {
    console.error(`[API_PUT_TEMPLATE_${params.templateId}] Error:`, error);
     if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update template: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { templateId } = params;
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return NextResponse.json({ error: 'Invalid Template ID format' }, { status: 400 });
    }

    await dbConnect();
    const deletedTemplate = await Template.findByIdAndDelete(templateId);
    // TODO: Also delete related TemplateReviews and ModerationQueueItems if necessary

    if (!deletedTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    // Note: Admin actions for delete might be more complex (e.g., cascade deletes)
    // This is a direct DB delete.
    return NextResponse.json({ success: `Template ${templateId} deleted successfully.` }, { status: 200 });
  } catch (error: any) {
    console.error(`[API_DELETE_TEMPLATE_${params.templateId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to delete template: ' + error.message }, { status: 500 });
  }
}
