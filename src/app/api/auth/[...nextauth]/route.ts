
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/dbConnect';
import User, { type IUser } from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
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
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // error: '/auth/error', // Custom error page
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
