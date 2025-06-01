
import { auth } from "@/auth"; // Assuming this is your NextAuth instance from src/auth.ts
import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server'; // Not explicitly needed if only using req.nextUrl and req.auth

export default auth((req) => {
  const { nextUrl, auth: session } = req; // In v5, req.auth is the session object (or null)
  
  // The token-like object with user details (id, name, email, role) is nested under session.user
  const user = session?.user; 
  
  const isLoggedIn = !!session; // True if session object exists
  const userRole = user?.role;

  const isEditorRoute = nextUrl.pathname.startsWith("/editor");
  const isUserDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
  const isAdminDashboardRoute = nextUrl.pathname.startsWith("/admin");

  // Protect /admin routes: only logged-in admins
  if (isAdminDashboardRoute) {
    if (!isLoggedIn) {
      console.log("[Middleware] Admin route access denied: Not logged in. Redirecting to login.");
      return NextResponse.redirect(new URL(`/login?callbackUrl=${nextUrl.pathname}`, nextUrl.origin));
    }
    if (userRole !== "admin") {
      console.log(`[Middleware] Admin route access denied: User role is '${userRole}'. Redirecting to user dashboard.`);
      return NextResponse.redirect(new URL("/dashboard", nextUrl.origin)); 
    }
    console.log("[Middleware] Admin route access granted.");
    return NextResponse.next();
  }

  // Protect /dashboard and /editor routes: only logged-in users (any role)
  if (isUserDashboardRoute || isEditorRoute) {
    if (!isLoggedIn) {
      console.log(`[Middleware] Protected route (${nextUrl.pathname}) access denied: Not logged in. Redirecting to login.`);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${nextUrl.pathname}`, nextUrl.origin));
    }
    // If user is admin and tries to access /dashboard, they will be redirected by /dashboard/page.tsx component
    console.log(`[Middleware] Protected route (${nextUrl.pathname}) access granted.`);
    return NextResponse.next();
  }

  // Allow all other requests (e.g., /, /login, /register, /api, _next/static, etc.)
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, though NextAuth's /api/auth routes are implicitly handled by `auth()`)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Public pages like /login, /register, / should NOT be in the matcher
     * if we want them to be accessible without authentication by default.
     * The `auth()` function itself will protect routes if no specific logic
     * above allows them or redirects.
     *
     * This matcher explicitly lists routes we want our custom logic to run on.
     * Auth.js middleware will automatically protect all routes if no matcher is specified
     * and no public routes are configured.
     * Here, we specify which routes the middleware should intercept for custom checks.
     */
    '/editor/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};
