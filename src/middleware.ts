
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
     * - / (public homepage, if any, or adjust as needed)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|register).*)",
    // Add specific paths you want to protect, e.g., "/dashboard/:path*"
    // For this example, we will protect "/"
  ],
};
