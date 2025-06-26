
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';

// Force the middleware to run on the Node.js runtime, as Mongoose (used in auth) is not compatible with the Edge runtime.
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const session = await auth(); // Get session data
  const { nextUrl } = request;

  const isLoggedIn = !!session?.user;

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isStripeWebhook = nextUrl.pathname === '/api/stripe/webhook';
  
  const publicPages = ['/login', '/register', '/', '/about', '/services', '/pricing', '/support', '/terms', '/privacy'];
  const isPublicPage = publicPages.some(path => nextUrl.pathname === path);

  // Allow API auth routes and the Stripe webhook to be accessed without authentication
  if (isApiAuthRoute || isStripeWebhook) {
    return NextResponse.next();
  }
  
  // Allow access to public pages
  if (isPublicPage) {
    return NextResponse.next();
  }

  // If the user is trying to access any other route, they must be logged in
  if (!isLoggedIn) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    
    // For API routes, return a 401 Unauthorized response instead of redirecting
    if (nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, request.url));
  }

  // If the user is logged in, check for admin route access
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  if (isAdminRoute && session.user?.role !== "admin") {
      // Non-admin trying to access admin area, redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If all checks pass, allow the request
  return NextResponse.next();
}

// This configures the middleware to run on all paths except for static files
// and other internal Next.js assets.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
