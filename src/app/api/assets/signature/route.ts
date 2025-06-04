
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getCloudinarySignature } from '@/actions/assets';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'User not authenticated. Cannot generate upload signature.' }, { status: 401 });
    }

    const body = await request.json();
    const paramsToSign = body.paramsToSign || {}; // Client can pass folder, public_id, etc.

    const result = await getCloudinarySignature(paramsToSign);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({
      signature: result.signature,
      timestamp: result.timestamp,
      apiKey: result.apiKey,
      cloudName: result.cloudName,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[API_ASSETS_SIGNATURE] Error:', error);
    if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to generate Cloudinary signature: ' + error.message }, { status: 500 });
  }
}
