
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
// import dbConnect from '@/lib/dbConnect'; // Dynamic import below
// import User from '@/models/User';         // Dynamic import below
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
        console.log("[Auth][Authorize] Attempting authorization for:", credentials?.email);
        try {
          const dbConnect = (await import('@/lib/dbConnect')).default;
          const User = (await import('@/models/User')).default;

          if (!credentials?.email || typeof credentials.email !== 'string' || 
              !credentials.password || typeof credentials.password !== 'string') {
            console.warn("[Auth][Authorize] Invalid credentials object received.");
            return null;
          }

          await dbConnect();
          console.log("[Auth][Authorize] Database connection established for:", credentials.email);

          const user = await User.findOne({ email: credentials.email }).select('+password');

          if (!user) {
            console.log("[Auth][Authorize] User not found:", credentials.email);
            return null;
          }
          if (!user.password) {
            console.log("[Auth][Authorize] User found, but password is not set in DB (should not happen with bcrypt):", credentials.email);
            return null; // Should not happen if password is required on creation
          }

          console.log("[Auth][Authorize] User found:", credentials.email, "ID:", user._id);
          const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordMatch) {
            console.log("[Auth][Authorize] Password mismatch for user:", credentials.email);
            return null;
          }
          
          console.log("[Auth][Authorize] Password match successful for user:", credentials.email);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
          };
        } catch (error) {
          console.error("[Auth][Authorize] CRITICAL ERROR during authorization process for:", credentials?.email, error);
          return null; // Important to return null on any error
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
  // trustHost: true, 
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
