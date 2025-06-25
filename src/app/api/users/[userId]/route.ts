
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { updateUserProfile } from '@/actions/user';
import { updateUserStatus } from '@/actions/admin'; // For admin updating user status
import User from '@/models/User'; // For fetching user details
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

const serializeUser = (user: any) => {
    if (!user) return null;
    const plainUser = user.toObject ? user.toObject() : { ...user };
    plainUser._id = plainUser._id.toString();
    if (plainUser.purchasedTemplateIds) {
        plainUser.purchasedTemplateIds = plainUser.purchasedTemplateIds.map((id: any) => id.toString());
    }
    // Remove password if present, even if selected explicitly for other operations
    delete plainUser.password;
    return plainUser;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    const { userId } = params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }

    // Allow admin to fetch any user, or user to fetch their own profile
    if (!session || (session.user.id !== userId && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const user = await User.findById(userId).lean(); // Use lean and manually serialize if needed

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Basic serialization for lean object
    const serializedUser = {
        ...user,
        _id: user._id.toString(),
        purchasedTemplateIds: user.purchasedTemplateIds?.map(id => id.toString()) || [],
    };
    delete serializedUser.password;


    return NextResponse.json(serializedUser, { status: 200 });
  } catch (error: any) {
    console.error(`[API_GET_USER_${params.userId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch user: ' + error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    const { userId } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }

    // Scenario 1: Admin updating user status
    if (session?.user?.role === 'admin' && body.hasOwnProperty('isActive')) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ error: 'Invalid isActive value' }, { status: 400 });
      }
      const statusResult = await updateUserStatus({ userId, isActive: body.isActive });
      if (statusResult.error) {
        return NextResponse.json({ error: statusResult.error }, { status: 400 });
      }
      return NextResponse.json(statusResult.user, { status: 200 });
    }
    
    // Scenario 2: User updating their own profile
    if (session?.user?.id === userId) {
      const { name, avatarUrl } = body;
      const profileResult = await updateUserProfile({ name, avatarUrl });
      if (profileResult.error) {
        return NextResponse.json({ error: profileResult.error }, { status: 400 });
      }
      return NextResponse.json(profileResult.user, { status: 200 });
    }

    // Scenario 3: Admin updating other user profile fields (more complex, consider dedicated admin action)
    // For now, limit admin PUT to status or general profile updates if they are also the user.

    return NextResponse.json({ error: 'Unauthorized or invalid operation' }, { status: 403 });

  } catch (error: any) {
    console.error(`[API_PUT_USER_${params.userId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to update user: ' + error.message }, { status: 500 });
  }
}

// DELETE for users is typically a sensitive admin action, often involving soft deletes.
// Not implementing a generic DELETE /api/users/[userId] endpoint by default.
