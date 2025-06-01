
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { IUser } from '@/models/User'; 
import mongoose from 'mongoose'; 
import dbConnect from "@/lib/dbConnect"; // Ensure dbConnect is imported

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password', placeholder: '••••••••' },
      },
      async authorize(credentials) {
        console.log("[Auth][Authorize] Attempting authorization...");
        
        if (!credentials?.email || typeof credentials.email !== 'string' || 
            !credentials.password || typeof credentials.password !== 'string') {
          console.warn("[Auth][Authorize] Invalid or incomplete credentials object received:", JSON.stringify(credentials));
          console.log("[Auth][Authorize] FAIL: Invalid credentials format. Returning null.");
          return null; // Essential for NextAuth to show a credentials error
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const normalizedEmail = email.toLowerCase();
        console.log(`[Auth][Authorize] Processing for normalized email: ${normalizedEmail}`);
        
        const mongoUri = process.env.MONGODB_URI || "MONGODB_URI NOT SET";
        if (mongoUri === "MONGODB_URI NOT SET" || mongoUri.includes("YOUR_ACTUAL_DATABASE_NAME_HERE") || mongoUri.endsWith("/?retryWrites=true&w=majority&appName=Cluster0")) {
          console.error("[Auth][Authorize] CRITICAL: MONGODB_URI is not set correctly, or is missing a database name, or still contains placeholder. Please check .env file. Example: mongodb+srv://user:pass@cluster.mongodb.net/YOUR_DB_NAME?retryWrites=true...");
          console.log("[Auth][Authorize] FAIL: MONGODB_URI misconfiguration. Returning null.");
          // In a real scenario, you might throw an error that NextAuth can specifically handle or return null.
          // Returning null tells NextAuth.js that credentials are not valid or an error occurred.
          return null; 
        }
        const uriSnippet = mongoUri.length > 30 ? `${mongoUri.substring(0, 15)}...${mongoUri.substring(mongoUri.length - 15)}` : mongoUri;
        console.log(`[Auth][Authorize] Using MONGODB_URI (snippet): ${uriSnippet}`);

        try {
          console.log("[Auth][Authorize] Dynamically importing User model...");
          // It's generally better to import User model at the top level of the module
          // if it's consistently used, but dynamic import works.
          const User = (await import('@/models/User')).default;
          console.log("[Auth][Authorize] User model import successful.");

          console.log(`[Auth][Authorize] Attempting dbConnect for: ${normalizedEmail}`);
          await dbConnect(); 
          const connectionState = mongoose.connection.readyState;
          console.log(`[Auth][Authorize] Database connection state after connect: ${mongoose.ConnectionStates[connectionState]}`);
          
          if (connectionState !== mongoose.ConnectionStates.connected) {
              console.error("[Auth][Authorize] Database not connected after attempting connection!");
              console.log("[Auth][Authorize] FAIL: DB not connected. Returning null.");
              return null;
          }
          console.log(`[Auth][Authorize] Database connection established (or re-used) for: ${normalizedEmail}`);

          console.log(`[Auth][Authorize] Searching for user with email: ${normalizedEmail}`);
          // Important: .select('+password') to include the password field which is excluded by default.
          const user = await User.findOne({ email: normalizedEmail }).select('+password');
          
          if (!user) {
            console.log(`[Auth][Authorize] User not found in DB for normalized email: ${normalizedEmail}.`);
            console.log(`[Auth][Authorize] FAIL: User not found. Returning null.`);
            return null;
          }
          console.log(`[Auth][Authorize] User found (ID: ${user._id}, Role: ${user.role}) for normalized email: ${normalizedEmail}.`);

          if (!user.password) {
            console.log(`[Auth][Authorize] User ${normalizedEmail} found, but password is not set in DB. This should not happen for credential-based auth.`);
            console.log(`[Auth][Authorize] FAIL: User ${normalizedEmail} has no password set. Returning null.`);
            return null; 
          }
          console.log(`[Auth][Authorize] User has password hash. Comparing provided password with stored hash for: ${normalizedEmail}`);

          const isPasswordMatch = await bcrypt.compare(password, user.password);
          console.log(`[Auth][Authorize] Password comparison result for ${normalizedEmail}: ${isPasswordMatch}`);

          if (!isPasswordMatch) {
            console.log(`[Auth][Authorize] Password mismatch for user: ${normalizedEmail}`);
            console.log(`[Auth][Authorize] FAIL: Password mismatch. Returning null.`);
            return null;
          }
          
          // IMPORTANT: The object returned here is passed to the `jwt` callback's `user` parameter.
          // It MUST have an `id` field, and other fields you want in the token.
          const userToReturn = {
            id: user._id.toString(), // Must be string
            email: user.email,
            name: user.name,
            role: user.role, // Crucial for role-based access
            avatarUrl: user.avatarUrl,
          };
          console.log(`[Auth][Authorize] SUCCESS: Authorizing user: ${normalizedEmail}. Returning user object:`, JSON.stringify(userToReturn));
          return userToReturn;

        } catch (error: any) { 
          console.error(`[Auth][Authorize] CRITICAL UNHANDLED ERROR in authorize function for ${normalizedEmail}.`);
          console.error("[Auth][Authorize] Error object raw:", error);
          if (error instanceof Error) {
            console.error("[Auth][Authorize] Error name:", error.name);
            console.error("[Auth][Authorize] Error message:", error.message);
            console.error("[Auth][Authorize] Error stack:", error.stack);
          } else {
             console.error("[Auth][Authorize] Error is not an instance of Error. Stringified:", JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
          }
          console.log("[Auth][Authorize] FAIL: Exception in authorize. Returning null.");
          return null; // Return null on any error to signify failed authorization
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const, // JWT is recommended
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      console.log("[Auth][JWT Callback] Triggered. Current Token:", JSON.stringify(token), "User obj (from authorize or update):", JSON.stringify(user), "Account:", JSON.stringify(account), "Trigger:", trigger, "Session obj (for update trigger):", JSON.stringify(session));
      try {
        // On successful sign-in (user object is present, comes from authorize)
        if (user && (trigger === "signIn" || trigger === "signUp")) {
          // Ensure user has all expected fields from authorize
          const authorizedUser = user as { id: string; name?: string | null; email?: string | null; role: 'user' | 'admin'; avatarUrl?: string | null; };
          
          token.id = authorizedUser.id;
          token.name = authorizedUser.name;
          token.email = authorizedUser.email; // Usually already in token, but good to be explicit
          token.role = authorizedUser.role; // Add role to the token
          token.avatarUrl = authorizedUser.avatarUrl;
          console.log("[Auth][JWT Callback] User data (id, name, email, role, avatarUrl) added/updated in token on signIn/signUp:", JSON.stringify(token));
        }

        // If session is updated (e.g., user updates profile), reflect in token if needed
        if (trigger === "update" && session) {
            // `session` here is the data passed to `update()` call
            // Example: token.name = session.name;
            // Be careful what you allow to be updated to avoid security issues.
            if (session.name) token.name = session.name;
            if (session.avatarUrl) token.avatarUrl = session.avatarUrl;
            console.log("[Auth][JWT Callback] Token updated via 'update' trigger:", JSON.stringify(token));
        }

        return token;
      } catch (error: any) {
        console.error("[Auth][JWT Callback] Error in JWT callback. Error object raw:", error);
        if (error instanceof Error) {
            console.error("[Auth][JWT Callback] Error name:", error.name);
            console.error("[Auth][JWT Callback] Error message:", error.message);
            console.error("[Auth][JWT Callback] Error stack:", error.stack);
        }
        token.error = "JWTCallbackError"; // Add error to token if needed for client-side handling
        return token; // Still return token, possibly with error flag
      }
    },
    async session({ session, token }) {
      // `token` here is the output from the `jwt` callback
      console.log("[Auth][Session Callback] Triggered. Current Session:", JSON.stringify(session), "Token from JWT callback:", JSON.stringify(token));
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name; // Already string | null | undefined
          session.user.email = token.email; // Already string | null | undefined
          session.user.role = token.role as 'user' | 'admin'; // Assign role from token
          session.user.avatarUrl = token.avatarUrl as string | undefined;
          console.log("[Auth][Session Callback] Session user hydrated from token. New session.user:", JSON.stringify(session.user));
        } else {
          console.warn("[Auth][Session Callback] Token or session.user was not available. Session:", JSON.stringify(session), "Token:", JSON.stringify(token));
        }
        
        if (token.error) {
          // (session as any).error = token.error; // Optionally pass JWT errors to session
          console.warn("[Auth][Session Callback] JWT token had an error property:", token.error);
        }

        console.log("[Auth][Session Callback] Returning session:", JSON.stringify(session));
        return session;
      } catch (error: any) {
        console.error("[Auth][Session Callback] Error in session callback. Error object raw:", error);
         if (error instanceof Error) {
            console.error("[Auth][Session Callback] Error name:", error.name);
            console.error("[Auth][Session Callback] Error message:", error.message);
            console.error("[Auth][Session Callback] Error stack:", error.stack);
        }
        // (session as any).error = "SessionCallbackError"; // Add error to session if needed
        return session; // Return session even on error, possibly modified
      }
    },
  },
  pages: {
    signIn: '/login', // Custom login page
    // error: '/auth/error', // Optional: Custom error page for auth errors
    // signOut: '/logout', // Optional: Custom sign out page
  },
  secret: process.env.NEXTAUTH_SECRET, // Must be set in .env
  trustHost: true, // Recommended for environments behind a proxy (like Vercel, Cloud Workstations, etc.)
  // debug: process.env.NODE_ENV === 'development', // Enable more verbose logging in development
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

// Augment NextAuth types to include role and id and avatarUrl
declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Add id
      name?: string | null;
      email?: string | null;
      image?: string | null; // Default NextAuth field, can be avatarUrl
      role: 'user' | 'admin'; // Add role
      avatarUrl?: string; // Add avatarUrl
    };
  }

  // The `User` interface is what the `authorize` function returns and `jwt` callback receives.
  interface User { 
    id: string; // Ensure id is part of the User type passed to JWT
    role: 'user' | 'admin';
    avatarUrl?: string;
    // name and email are typically expected by NextAuth User type as well.
    name?: string | null;
    email?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string; // Add id to JWT
    role: 'user' | 'admin'; // Add role to JWT
    avatarUrl?: string; // Add avatarUrl to JWT
    name?: string | null;
    email?: string | null;
    error?: string; // Optional: For passing errors
  }
}
