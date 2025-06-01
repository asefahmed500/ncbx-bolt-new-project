
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
// import dbConnect from '@/lib/dbConnect'; // Removed top-level import
// import User from '@/models/User';         // Removed top-level import
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
        // Dynamically import dbConnect and User model here
        const dbConnect = (await import('@/lib/dbConnect')).default;
        const User = (await import('@/models/User')).default;

        if (!credentials?.email || typeof credentials.email !== 'string' || 
            !credentials.password || typeof credentials.password !== 'string') {
          return null;
        }
        await dbConnect();
        const user = await User.findOne({ email: credentials.email }).select('+password');

        if (!user || !user.password) {
          return null;
        }

        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordMatch) {
          return null;
        }
        
        // Ensure the returned object matches the expected User type for NextAuth
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        };
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
        // The user object from authorize might not directly have role/avatarUrl if not explicitly returned
        // Cast `user` to include properties like role and avatarUrl, assuming authorize returns them
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
  // Trust "x-forwarded-host" and "x-forwarded-proto" headers from the proxy.
  // Required if your app is behind a proxy and uses HTTPS.
  // trustHost: true, // Uncomment if needed, ensure your proxy is configured correctly
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

// Add type definition for session.user to include custom properties
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
  // If you also customize the User object passed to JWT/session callbacks
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
