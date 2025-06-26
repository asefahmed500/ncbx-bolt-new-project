
import { auth } from "@/auth";

// The 'auth' middleware from NextAuth.js is configured in src/auth.ts
// It will handle session management and route protection automatically based on the `authorized` callback.
export default auth;

// Force the middleware to run on the Node.js runtime, as Mongoose (used in auth) is not compatible with the Edge runtime.
export const runtime = 'nodejs';

// This configures the middleware to run on all paths except for static files
// and other internal Next.js assets. The logic in `src/auth.ts` will decide what to do for each path.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
