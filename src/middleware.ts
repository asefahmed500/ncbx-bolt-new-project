
import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

// The `auth` function will now use the `authorized` callback from the main config
// to decide if a request is allowed.
export default auth;

// This configures the middleware to run on all paths except for static files,
// API routes (which are handled separately), and other internal Next.js assets.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
