import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = 
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/editor') ||
        nextUrl.pathname.startsWith('/admin');

      if (isProtectedRoute) {
        if (isLoggedIn) {
          // If logged in, check for admin route access
          if (nextUrl.pathname.startsWith('/admin') && auth.user?.role !== 'admin') {
            // Redirect non-admins from admin routes
            return Response.redirect(new URL('/dashboard', nextUrl));
          }
          // Allow logged-in users to access protected routes (including admins on admin routes)
          return true; 
        }
        // If not logged in, redirect to login page for any protected route
        const redirectUrl = new URL("/login", nextUrl.origin);
        redirectUrl.searchParams.append("callbackUrl", nextUrl.href);
        return Response.redirect(redirectUrl);
      } else if (isLoggedIn) {
        // Optional: Redirect logged-in users from public pages like login/register
        if (nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
      }
      
      // Allow access to all other pages for everyone
      return true;
    },
  },
  providers: [], // providers are not included in the edge-safe config
} satisfies NextAuthConfig;
