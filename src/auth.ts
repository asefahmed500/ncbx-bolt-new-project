
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
          return null; 
        }
        const uriSnippet = mongoUri.length > 30 ? `${mongoUri.substring(0, 15)}...${mongoUri.substring(mongoUri.length - 15)}` : mongoUri;
        console.log(`[Auth][Authorize] Using MONGODB_URI (snippet): ${uriSnippet}`);

        try {
          console.log("[Auth][Authorize] Dynamically importing User model...");
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
          const user = await User.findOne({ email: normalizedEmail }).select('+password').lean(); // Added .lean()
          
          if (!user) {
            console.log(`[Auth][Authorize] User not found in DB for normalized email: ${normalizedEmail}.`);
            console.log(`[Auth][Authorize] FAIL: User not found. Returning null.`);
            return null;
          }

          if (!user.isActive) {
            console.log(`[Auth][Authorize] User ${normalizedEmail} is inactive/suspended.`);
            // Returning an object with an error property is a way to pass custom error messages to the client if your signIn call handles it.
            // For NextAuth default error pages or CredentialsSignin error, returning null is standard.
            // For more specific client feedback, you'd customize the signIn page's error handling.
            // Throwing a specific error type that NextAuth recognizes can also work for some scenarios.
            // For now, let's stick to returning null for simplicity which results in a generic credentials error.
            // Or, you could throw an error that your signIn page can catch if not redirecting.
            // throw new Error("Account is suspended."); // This might not show up as expected on default error pages.
            console.log(`[Auth][Authorize] FAIL: User ${normalizedEmail} is inactive. Returning null.`);
            return null; 
          }

          console.log(`[Auth][Authorize] User found (ID: ${user._id}, Role: ${user.role}, IsActive: ${user.isActive}) for normalized email: ${normalizedEmail}.`);


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
          
          const userToReturn = {
            id: user._id.toString(), 
            email: user.email,
            name: user.name,
            role: user.role, 
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            purchasedTemplateIds: user.purchasedTemplateIds?.map(id => id.toString()) || [], // Ensure string IDs
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
          return null; 
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const, 
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      console.log("[Auth][JWT Callback] Triggered. Current Token:", JSON.stringify(token), "User obj (from authorize or update):", JSON.stringify(user), "Account:", JSON.stringify(account), "Trigger:", trigger, "Session obj (for update trigger):", JSON.stringify(session));
      try {
        if (user && (trigger === "signIn" || trigger === "signUp")) {
          const authorizedUser = user as IUser & { id: string; purchasedTemplateIds?: string[] }; // Use IUser from model + id
          
          token.id = authorizedUser.id;
          token.name = authorizedUser.name;
          token.email = authorizedUser.email; 
          token.role = authorizedUser.role; 
          token.avatarUrl = authorizedUser.avatarUrl;
          token.isActive = authorizedUser.isActive;
          token.purchasedTemplateIds = authorizedUser.purchasedTemplateIds || [];
          console.log("[Auth][JWT Callback] User data added/updated in token on signIn/signUp:", JSON.stringify(token));
        }

        if (trigger === "update" && session) {
            if (session.name) token.name = session.name;
            if (session.avatarUrl) token.avatarUrl = session.avatarUrl;
            // Potentially update other fields if needed, e.g., if isActive or role could be updated via session update
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
        token.error = "JWTCallbackError"; 
        return token; 
      }
    },
    async session({ session, token }) {
      console.log("[Auth][Session Callback] Triggered. Current Session:", JSON.stringify(session), "Token from JWT callback:", JSON.stringify(token));
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name; 
          session.user.email = token.email; 
          session.user.role = token.role as 'user' | 'admin'; 
          session.user.avatarUrl = token.avatarUrl as string | undefined;
          session.user.isActive = token.isActive as boolean;
          session.user.purchasedTemplateIds = token.purchasedTemplateIds as string[];
          console.log("[Auth][Session Callback] Session user hydrated from token. New session.user:", JSON.stringify(session.user));
        } else {
          console.warn("[Auth][Session Callback] Token or session.user was not available. Session:", JSON.stringify(session), "Token:", JSON.stringify(token));
        }
        
        if (token.error) {
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
        return session; 
      }
    },
  },
  pages: {
    signIn: '/login', 
  },
  secret: process.env.NEXTAUTH_SECRET, 
  trustHost: true, 
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

declare module "next-auth" {
  interface Session {
    user: {
      id: string; 
      name?: string | null;
      email?: string | null;
      image?: string | null; 
      role: 'user' | 'admin'; 
      avatarUrl?: string; 
      isActive: boolean;
      purchasedTemplateIds?: string[];
    };
  }

  interface User { 
    id: string; 
    role: 'user' | 'admin';
    avatarUrl?: string;
    name?: string | null;
    email?: string | null;
    isActive: boolean;
    purchasedTemplateIds?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string; 
    role: 'user' | 'admin'; 
    avatarUrl?: string; 
    name?: string | null;
    email?: string | null;
    isActive: boolean;
    purchasedTemplateIds?: string[];
    error?: string; 
  }
}
