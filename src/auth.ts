
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { IUser } from '@/models/User'; // Keep type import
import type { ISubscription } from "@/models/Subscription"; // Keep type import
import mongoose from 'mongoose';
import dbConnect from "@/lib/dbConnect";
import { getPlanByStripePriceId, type AppPlan, type PlanLimit } from "@/config/plans"; 

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

        // Dynamically import models only within this server-side function
        const User = (await import('@/models/User')).default;
        const Subscription = (await import('@/models/Subscription')).default;

        if (!credentials?.email || typeof credentials.email !== 'string' ||
            !credentials.password || typeof credentials.password !== 'string') {
          console.warn("[Auth][Authorize] Invalid or incomplete credentials object received:", JSON.stringify(credentials));
          console.log("[Auth][Authorize] FAIL: Invalid credentials format. Returning null.");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const normalizedEmail = email.toLowerCase();
        console.log(`[Auth][Authorize] Processing for normalized email: ${normalizedEmail}`);

        const mongoUri = process.env.MONGODB_URI || "MONGODB_URI NOT SET";
        if (mongoUri === "MONGODB_URI NOT SET" || mongoUri.includes("YOUR_ACTUAL_DATABASE_NAME_HERE") || mongoUri.endsWith("/?retryWrites=true&w=majority&appName=Cluster0")) {
          console.error("[Auth][Authorize] CRITICAL: MONGODB_URI is not set correctly, or is missing a database name, or still contains placeholder. Please check .env file.");
          return null;
        }

        try {
          // User and Subscription models are already imported above dynamically
          await dbConnect();
          const connectionState = mongoose.connection.readyState;
          if (connectionState !== mongoose.ConnectionStates.connected) {
              console.error("[Auth][Authorize] Database not connected!");
              return null;
          }

          const user = await User.findOne({ email: normalizedEmail }).select('+password').lean();

          if (!user) {
            console.log(`[Auth][Authorize] User not found for email: ${normalizedEmail}.`);
            return null;
          }

          if (!user.isActive) {
            console.log(`[Auth][Authorize] User ${normalizedEmail} is inactive.`);
            return null;
          }

          if (!user.password) {
            console.log(`[Auth][Authorize] User ${normalizedEmail} has no password set.`);
            return null;
          }

          const isPasswordMatch = await bcrypt.compare(password, user.password);
          if (!isPasswordMatch) {
            console.log(`[Auth][Authorize] Password mismatch for user: ${normalizedEmail}`);
            return null;
          }

          let currentSubscription: ISubscription | null = null;
          try {
            currentSubscription = await Subscription.findOne({
              userId: user._id,
            }).sort({ stripeCurrentPeriodEnd: -1 }).lean();
          } catch (subError) {
            console.error(`[Auth][Authorize] Error fetching subscription for user ${user._id}:`, subError);
          }

          let planDetails: AppPlan | undefined;
          if (currentSubscription && currentSubscription.stripePriceId) {
             planDetails = getPlanByStripePriceId(currentSubscription.stripePriceId);
          }


          const userToReturn = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            purchasedTemplateIds: user.purchasedTemplateIds?.map(id => id.toString()) || [],
            subscriptionStatus: currentSubscription?.stripeSubscriptionStatus || null,
            subscriptionPlanId: planDetails?.id || 'free',
            subscriptionLimits: planDetails?.limits || getPlanById('free')?.limits,
          };
          console.log(`[Auth][Authorize] SUCCESS: Authorizing user: ${normalizedEmail}. Returning user object:`, JSON.stringify(userToReturn));
          return userToReturn;

        } catch (error: any) {
          console.error(`[Auth][Authorize] CRITICAL UNHANDLED ERROR for ${normalizedEmail}:`, error);
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
      console.log("[Auth][JWT Callback] Triggered. Current Token:", JSON.stringify(token), "User obj:", JSON.stringify(user));
      try {
        if (user && (trigger === "signIn" || trigger === "signUp")) {
          const authorizedUser = user as IUser & {
            id: string;
            purchasedTemplateIds?: string[];
            subscriptionStatus?: string | null;
            subscriptionPlanId?: string;
            subscriptionLimits?: PlanLimit;
          };

          token.id = authorizedUser.id;
          token.name = authorizedUser.name;
          token.email = authorizedUser.email;
          token.role = authorizedUser.role;
          token.avatarUrl = authorizedUser.avatarUrl;
          token.isActive = authorizedUser.isActive;
          token.purchasedTemplateIds = authorizedUser.purchasedTemplateIds || [];
          token.subscriptionStatus = authorizedUser.subscriptionStatus;
          token.subscriptionPlanId = authorizedUser.subscriptionPlanId;
          token.subscriptionLimits = authorizedUser.subscriptionLimits;

          console.log("[Auth][JWT Callback] User data (incl. subscription) added to token on signIn/signUp:", JSON.stringify(token));
        }

        if (trigger === "update" && session) {
            if (session.name) token.name = session.name;
            if (session.avatarUrl) token.avatarUrl = session.avatarUrl;
            // If session update needs to refresh subscription status from DB:
            // const Subscription = (await import('@/models/Subscription')).default;
            // const dbSub = await Subscription.findOne({ userId: token.id, ... }).sort(...);
            // if (dbSub) { /* update token.subscriptionStatus etc. */ }
            console.log("[Auth][JWT Callback] Token updated via 'update' trigger:", JSON.stringify(token));
        }
        return token;
      } catch (error: any) {
        console.error("[Auth][JWT Callback] Error:", error);
        token.error = "JWTCallbackError";
        return token;
      }
    },
    async session({ session, token }) {
      console.log("[Auth][Session Callback] Triggered. Current Session:", JSON.stringify(session), "Token:", JSON.stringify(token));
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name;
          session.user.email = token.email;
          session.user.role = token.role as 'user' | 'admin';
          session.user.avatarUrl = token.avatarUrl as string | undefined;
          session.user.isActive = token.isActive as boolean;
          session.user.purchasedTemplateIds = token.purchasedTemplateIds as string[];
          session.user.subscriptionStatus = token.subscriptionStatus as string | null | undefined;
          session.user.subscriptionPlanId = token.subscriptionPlanId as 'free' | 'pro' | 'enterprise' | undefined;
          session.user.subscriptionLimits = token.subscriptionLimits as PlanLimit | undefined;
          console.log("[Auth][Session Callback] Session user hydrated from token (incl. subscription):", JSON.stringify(session.user));
        } else {
          console.warn("[Auth][Session Callback] Token or session.user not available.");
        }
        return session;
      } catch (error: any) {
        console.error("[Auth][Session Callback] Error:", error);
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
      subscriptionStatus?: string | null; 
      subscriptionPlanId?: 'free' | 'pro' | 'enterprise';
      subscriptionLimits?: PlanLimit;
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
    subscriptionStatus?: string | null;
    subscriptionPlanId?: 'free' | 'pro' | 'enterprise';
    subscriptionLimits?: PlanLimit;
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
    subscriptionStatus?: string | null;
    subscriptionPlanId?: 'free' | 'pro' | 'enterprise';
    subscriptionLimits?: PlanLimit;
    error?: string;
  }
}
