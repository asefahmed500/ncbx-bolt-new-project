
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { IUser } from '@/models/User'; // Still need the type

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("[Auth][Authorize] Attempting authorization for email:", credentials?.email);
        
        const mongoUri = process.env.MONGODB_URI || "MONGODB_URI NOT SET";
        const uriSnippet = mongoUri.length > 30 ? `${mongoUri.substring(0, 15)}...${mongoUri.substring(mongoUri.length - 15)}` : mongoUri;
        console.log(`[Auth][Authorize] Using MONGODB_URI (snippet): ${uriSnippet}`);
        
        if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes("YOUR_ACTUAL_DATABASE_NAME_HERE") || process.env.MONGODB_URI.endsWith("/?retryWrites=true&w=majority&appName=Cluster0") ) {
          console.error("[Auth][Authorize] CRITICAL: MONGODB_URI is not set correctly, or is missing a database name, or still contains placeholder. Please check .env file. Example: mongodb+srv://user:pass@cluster.mongodb.net/YOUR_DB_NAME?retryWrites=true...");
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
          await dbConnect(); // This will throw an error if connection fails, caught by outer try/catch
          console.log(`[Auth][Authorize] Database connection established (or re-used) for: ${normalizedEmail}`);

          console.log(`[Auth][Authorize] Searching for user with email: ${normalizedEmail}`);
          const user = await User.findOne({ email: normalizedEmail }).select('+password');
          
          if (!user) {
            console.log(`[Auth][Authorize] User not found in DB for normalized email: ${normalizedEmail}.`);
            console.log(`[Auth][Authorize] FAIL: User not found: ${normalizedEmail}. Returning null.`);
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
            console.log(`[Auth][Authorize] FAIL: Password mismatch for user: ${normalizedEmail}. Returning null.`);
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
          console.error(`[Auth][Authorize] CRITICAL UNHANDLED ERROR during authorization for ${credentials?.email}. Returning null. ErrorType: ${error?.constructor?.name}, Message: ${error?.message}`);
          console.error("[Auth][Authorize] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
          console.error("[Auth][Authorize] Error stack:", error?.stack);
          return null; // Important to return null on any error to trigger CredentialsSignin error type on client
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // The user object here is what `authorize` returns or what comes from other providers
        const authorizedUser = user as IUser & { role: 'user' | 'admin', avatarUrl?: string, id: string };
        token.id = authorizedUser.id;
        token.role = authorizedUser.role; 
        token.avatarUrl = authorizedUser.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'user' | 'admin';
        session.user.avatarUrl = token.avatarUrl as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Added for environments behind a proxy
  // debug: process.env.NODE_ENV === 'development', // Enable NextAuth.js debug logs in development
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'user' | 'admin'; // Ensure role is typed
      avatarUrl?: string;
    };
  }
  interface User { // Ensure User interface aligns with what authorize returns and JWT expects
    id: string; // Ensure id is part of the User type for NextAuth
    role: 'user' | 'admin';
    avatarUrl?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: 'user' | 'admin'; // Ensure role is typed
    avatarUrl?: string;
  }
}
