
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
        try {
          console.log("[Auth][Authorize] Dynamically importing dbConnect and User model...");
          const dbConnect = (await import('@/lib/dbConnect')).default;
          const User = (await import('@/models/User')).default;
          console.log("[Auth][Authorize] Imports successful.");

          if (!credentials?.email || typeof credentials.email !== 'string' || 
              !credentials.password || typeof credentials.password !== 'string') {
            console.warn("[Auth][Authorize] Invalid credentials object received:", JSON.stringify(credentials));
            return null;
          }
          const email = credentials.email; // Use a local const for clarity

          console.log(`[Auth][Authorize] Attempting dbConnect for: ${email}`);
          await dbConnect();
          console.log(`[Auth][Authorize] Database connection established for: ${email}`);

          console.log(`[Auth][Authorize] Searching for user with email: ${email}`);
          // Ensure email is queried in lowercase if your schema stores it as such (which it does)
          const normalizedEmail = email.toLowerCase();
          const user = await User.findOne({ email: normalizedEmail }).select('+password');
          console.log(`[Auth][Authorize] User.findOne result for ${normalizedEmail}:`, user ? `User found (ID: ${user._id})` : "User not found");

          if (!user) {
            console.log(`[Auth][Authorize] User not found in DB: ${normalizedEmail}`);
            return null;
          }
          if (!user.password) {
            console.log(`[Auth][Authorize] User ${normalizedEmail} found, but password is not set in DB.`);
            return null; 
          }

          console.log(`[Auth][Authorize] Comparing password for user: ${normalizedEmail}`);
          const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);
          console.log(`[Auth][Authorize] Password comparison result for ${normalizedEmail}: ${isPasswordMatch}`);

          if (!isPasswordMatch) {
            console.log(`[Auth][Authorize] Password mismatch for user: ${normalizedEmail}`);
            return null;
          }
          
          console.log(`[Auth][Authorize] Password match successful for user: ${normalizedEmail}. Returning user object.`);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
          };
        } catch (error: any) { 
          console.error(`[Auth][Authorize] CRITICAL ERROR during authorization for ${credentials?.email}. ErrorType: ${error?.constructor?.name}, Message: ${error?.message}`);
          // console.error("[Auth][Authorize] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error))); // Can be very verbose
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
        token.id = user.id;
        const authorizedUser = user as IUser & { role: 'user' | 'admin', avatarUrl?: string };
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
  // trustHost: true, // Consider uncommenting if behind a trusted proxy and having cookie/redirect issues
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
    role: 'user' | 'admin';
    avatarUrl?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: 'user' | 'admin';
    avatarUrl?: string;
  }
}
