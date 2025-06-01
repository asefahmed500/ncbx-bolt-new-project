
import { auth } from "@/auth";

export default auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - register (register page)
     * - / (the root landing page should be public)
     *
     * This means /editor and /dashboard will be protected by default if not listed above.
     * A more explicit way for v5 is to list protected routes:
     */
    '/editor/:path*',
    '/dashboard/:path*',
  ],
};

