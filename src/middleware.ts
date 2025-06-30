
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

// This is our new middleware function that wraps NextAuth's logic
export default auth((request) => {
  const url = request.nextUrl;
  const hostname = request.headers.get('host')!;
  
  // Use a base domain without port for comparison.
  // In Vercel, this will be your production domain. Locally, it's 'localhost'.
  const appBaseDomain = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || 'localhost';
  
  const path = url.pathname;

  // Prevent rewrite for API routes, static files, and images
  if (path.startsWith('/api') || path.startsWith('/_next') || path.match(/\.(jpeg|jpg|gif|png|svg|ico|webp)$/)) {
    return; // Do nothing, let Next.js handle it
  }
  
  // Check if the request is for the main marketing/app site
  // This check works for `localhost:9003`, `ncbx.com`, and `www.ncbx.com`
  const isMainApp = hostname.startsWith(appBaseDomain) || hostname.startsWith(`www.${appBaseDomain}`);
  
  if (!isMainApp) {
    // It's a subdomain or custom domain, so rewrite to the /sites directory
    // Note: `url.pathname` already includes the leading slash
    return NextResponse.rewrite(new URL(`/sites${url.pathname}`, request.url));
  }
  
  // If it IS the main app, the auth() wrapper handles protected route logic automatically.
  // We don't need to do anything else here for the main app's auth.
});


export const config = {
  // Match all paths except for the ones explicitly excluded
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
