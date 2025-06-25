
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getUsersForAdmin } from '@/actions/admin'; // Assuming this is for admin listing

// Placeholder for user creation if not handled by /register
// import { registerUser } from '@/actions/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const searchTerm = searchParams.get('search') || undefined;

    const result = await getUsersForAdmin({ searchTerm, page, limit });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ users: result.users, totalUsers: result.totalUsers }, { status: 200 });
  } catch (error: any) {
    console.error('[API_GET_USERS] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users: ' + error.message }, { status: 500 });
  }
}

// POST for creating users is typically handled by your /register logic or a specific admin action.
// If you need a generic POST /api/users, it would look like this:
/*
export async function POST(request: NextRequest) {
  try {
    // const session = await auth();
    // if (session?.user?.role !== 'admin') { // Or allow public registration
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }
    const body = await request.json();
    // Example: const result = await registerUser(body); // Assuming registerUser is adapted for direct object input
    // if (result.error) {
    //   return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
    // }
    // return NextResponse.json(result, { status: 201 });
    return NextResponse.json({ message: "User creation via direct API POST not implemented by default. Use /register or admin actions." }, { status: 501 });
  } catch (error: any) {
    console.error('[API_POST_USER] Error:', error);
    return NextResponse.json({ error: 'Failed to create user: ' + error.message }, { status: 500 });
  }
}
*/
