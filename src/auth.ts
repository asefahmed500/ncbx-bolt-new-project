// @ts-nocheck
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import User from '@/models/User';
import Subscription from '@/models/Subscription';
import type { IUser } from '@/models/User';
import type { ISubscription as ISubscriptionType } from "@/models/Subscription";
import dbConnect from "@/lib/dbConnect";
import { getPlanByStripePriceId, getPlanById, type AppPlan, type PlanLimit } from "@/config/plans"; 
import { authConfig } from './auth.config'; // Import the edge-safe config

// Combine the edge-safe config with providers and DB-dependent callbacks
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig, // Spread the edge-safe config
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("[Auth][Authorize] Attempting authorization...");

        if (!credentials?.email || typeof credentials.email !== 'string' ||
            !credentials.password || typeof credentials.password !== 'string') {
          console.warn("[Auth][Authorize] Invalid credentials format.");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const normalizedEmail = email.toLowerCase();
        console.log(`[Auth][Authorize] Processing for normalized email: ${normalizedEmail}`);
        
        await dbConnect();

        const user = await User.findOne({ email: normalizedEmail }).select('+password').lean();

        if (!user) {
          console.log(`[Auth][Authorize] User not found for email: ${normalizedEmail}.`);
          return null;
        }

        if (!user.isActive) {
          console.log(`[Auth][Authorize] User ${normalizedEmail} is inactive.`);
          throw new Error("User account is inactive.");
        }

        if (!user.password || typeof user.password !== 'string') {
          console.log(`[Auth][Authorize] User ${normalizedEmail} has no password set.`);
          throw new Error("User account has no password set or password format is invalid.");
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
          console.log(`[Auth][Authorize] Password mismatch for user: ${normalizedEmail}`);
          return null;
        }

        let currentSubscription: ISubscriptionType | null = null;
        try {
          currentSubscription = await Subscription.findOne({
            userId: user._id,
          }).sort({ stripeCurrentPeriodEnd: -1 }).lean(); 
        } catch (subError) {
          console.error(`[Auth][Authorize] Error fetching subscription for user ${user._id}:`, subError);
        }

        let planDetails: AppPlan | undefined;
        let subscriptionStatusForSession: string | null = null;

        if (currentSubscription && currentSubscription.stripePriceId) {
            planDetails = getPlanByStripePriceId(currentSubscription.stripePriceId);
            subscriptionStatusForSession = currentSubscription.stripeSubscriptionStatus as string;
        }
        if (!planDetails) {
            planDetails = getPlanById('free');
        }
        
        const userToReturn = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          isActive: user.isActive,
          purchasedTemplateIds: user.purchasedTemplateIds?.map(id => id.toString()) || [],
          subscriptionStatus: subscriptionStatusForSession,
          subscriptionPlanId: planDetails?.id || 'free',
          subscriptionLimits: planDetails?.limits,
        };
        console.log(`[Auth][Authorize] SUCCESS: Authorizing user: ${normalizedEmail}.`);
        return userToReturn;
      },
    }),
  ],
  callbacks: {
    // We must redefine the callbacks here to include the database logic.
    // The `authorized` callback from auth.config is already included via the spread.
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
        if (user && (trigger === "signIn" || trigger === "signUp")) {
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.role = user.role;
          token.avatarUrl = user.avatarUrl;
          token.isActive = user.isActive;
          token.purchasedTemplateIds = user.purchasedTemplateIds || [];
          token.subscriptionStatus = user.subscriptionStatus;
          token.subscriptionPlanId = user.subscriptionPlanId;
          token.subscriptionLimits = user.subscriptionLimits;
        }

        if (trigger === "update" && session) {
            if (session.name !== undefined) token.name = session.name;
            if (session.avatarUrl !== undefined) token.avatarUrl = session.avatarUrl;
            
            if (session.refreshSubscription) { 
                await dbConnect();
                const dbSub = await Subscription.findOne({ userId: token.id }).sort({ stripeCurrentPeriodEnd: -1 }).lean();
                let planDetails;
                if (dbSub) {
                    planDetails = getPlanByStripePriceId(dbSub.stripePriceId);
                    token.subscriptionStatus = dbSub.stripeSubscriptionStatus as string;
                    token.subscriptionPlanId = planDetails?.id || 'free';
                    token.subscriptionLimits = planDetails?.limits || getPlanById('free')?.limits;
                } else {
                    planDetails = getPlanById('free');
                    token.subscriptionStatus = null;
                    token.subscriptionPlanId = 'free';
                    token.subscriptionLimits = planDetails?.limits;
                }
            }
        }
        return token;
    },
    async session({ session, token }) {
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
      }
      return session;
    },
  },
});

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
      projectsUsed?: number;
    };
    refreshSubscription?: boolean;
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
    projectsUsed?: number;
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
    projectsUsed?: number;
    error?: string;
  }
}
