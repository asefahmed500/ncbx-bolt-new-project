
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { IUser } from '@/models/User'; // Still need the type
import mongoose from 'mongoose'; // Import mongoose for ConnectionStates

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("[Auth][Authorize] Attempting authorization.");
        console.log("[Auth][Authorize] Received credentials (JSON):", JSON.stringify(credentials));
        
        const mongoUri = process.env.MONGODB_URI || "MONGODB_URI NOT SET";
        const uriSnippet = mongoUri.length > 30 ? `${mongoUri.substring(0, 15)}...${mongoUri.substring(mongoUri.length - 15)}` : mongoUri;
        console.log(`[Auth][Authorize] Using MONGODB_URI (snippet): ${uriSnippet}`);
        
        if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes("YOUR_ACTUAL_DATABASE_NAME_HERE") || process.env.MONGODB_URI.endsWith("/?retryWrites=true&w=majority&appName=Cluster0") ) {
          console.error("[Auth][Authorize] CRITICAL: MONGODB_URI is not set correctly, or is missing a database name, or still contains placeholder. Please check .env file. Example: mongodb+srv://user:pass@cluster.mongodb.net/YOUR_DB_NAME?retryWrites=true...");
          console.log("[Auth][Authorize] FAIL: MONGODB_URI misconfiguration. Returning null.");
          return null;
        }

        try {
          console.log("[Auth][Authorize] Dynamically importing dbConnect and User model...");
          const dbConnect = (await import('@/lib/dbConnect')).default;
          const User = (await import('@/models/User')).default;
          console.log("[Auth][Authorize] Imports successful.");

          if (!credentials?.email || typeof credentials.email !== 'string' || 
              !credentials.password || typeof credentials.password !== 'string') {
            console.warn("[Auth][Authorize] Invalid or incomplete credentials object received:", JSON.stringify(credentials));
            console.log("[Auth][Authorize] FAIL: Invalid credentials format. Returning null.");
            return null;
          }
          const email = credentials.email as string;
          const password = credentials.password as string;
          const normalizedEmail = email.toLowerCase();
          console.log(`[Auth][Authorize] Normalized email for auth: ${normalizedEmail}`);


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
          const user = await User.findOne({ email: normalizedEmail }).select('+password');
          
          if (!user) {
            console.log(`[Auth][Authorize] User not found in DB for normalized email: ${normalizedEmail}.`);
            console.log(`[Auth][Authorize] FAIL: User not found. Returning null.`);
            return null;
          }
          console.log(`[Auth][Authorize] User found (ID: ${user._id}) for normalized email: ${normalizedEmail}. Checking password.`);

          if (!user.password) {
            console.log(`[Auth][Authorize] User ${normalizedEmail} found, but password is not set in DB. This should not happen for credential-based auth.`);
            console.log(`[Auth][Authorize] FAIL: User ${normalizedEmail} has no password set. Returning null.`);
            return null; 
          }

          console.log(`[Auth][Authorize] Comparing password for user: ${normalizedEmail}`);
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
          };
          console.log(`[Auth][Authorize] SUCCESS: Authorizing user: ${normalizedEmail}. Returning user object:`, JSON.stringify(userToReturn));
          return userToReturn;

        } catch (error: any) { 
          console.error(`[Auth][Authorize] CRITICAL UNHANDLED ERROR in authorize function for ${credentials?.email}.`);
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
      console.log("[Auth][JWT Callback] Triggered. Token:", JSON.stringify(token), "User:", JSON.stringify(user), "Account:", JSON.stringify(account), "Trigger:", trigger);
      try {
        if (trigger === "signIn" && user) { // Check trigger if needed
          const authorizedUser = user as IUser & { role: 'user' | 'admin', avatarUrl?: string, id: string };
          token.id = authorizedUser.id;
          token.name = authorizedUser.name;
          token.email = authorizedUser.email;
          token.role = authorizedUser.role; 
          token.avatarUrl = authorizedUser.avatarUrl;
          console.log("[Auth][JWT Callback] User data added to token on signIn.");
        }
        // Add other triggers like "update" if you handle session updates
        console.log("[Auth][JWT Callback] Returning token:", JSON.stringify(token));
        return token;
      } catch (error: any) {
        console.error("[Auth][JWT Callback] Error in JWT callback. Error object raw:", error);
        if (error instanceof Error) {
            console.error("[Auth][JWT Callback] Error name:", error.name);
            console.error("[Auth][JWT Callback] Error message:", error.message);
            console.error("[Auth][JWT Callback] Error stack:", error.stack);
        }
        token.error = "JWTCallbackError"; // Add error to token if needed
        return token;
      }
    },
    async session({ session, token }) {
      console.log("[Auth][Session Callback] Triggered. Session:", JSON.stringify(session), "Token:", JSON.stringify(token));
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name as string | undefined | null;
          session.user.email = token.email as string | undefined | null;
          session.user.role = token.role as 'user' | 'admin';
          session.user.avatarUrl = token.avatarUrl as string | undefined;
          console.log("[Auth][Session Callback] Session user hydrated from token.");
        }
         if (token.error) {
          // Handle token error if necessary, e.g., by adding it to the session
          // (session as any).error = token.error; 
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
        return session;
      }
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, 
  // debug: process.env.NODE_ENV === 'development', 
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
    };
  }
  interface User { 
    id: string; 
    role: 'user' | 'admin';
    avatarUrl?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: 'user' | 'admin'; 
    avatarUrl?: string;
    name?: string | null; // Ensure JWT aligns with what session expects from token
    email?: string | null; // Ensure JWT aligns with what session expects from token
    error?: string; // For passing errors through token if needed
  }
}
