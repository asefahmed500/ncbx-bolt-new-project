
// @ts-nocheck
console.log("[Auth Module] src/auth.ts loaded by server.");

import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import User from '@/models/User';
import Subscription from '@/models/Subscription';
import type { IUser } from '@/models/User';
import type { ISubscription as ISubscriptionType } from "@/models/Subscription";
import dbConnect from "@/lib/dbConnect";
import { getPlanByStripePriceId, getPlanById, type AppPlan, type PlanLimit } from "@/config/plans"; 

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

        const MONGODB_URI_ENV = process.env.MONGODB_URI;
        if (!MONGODB_URI_ENV || MONGODB_URI_ENV.includes("YOUR_MONGODB_URI_HERE") || MONGODB_URI_ENV.includes("YOUR_ACTUAL_DATABASE_NAME_HERE") || MONGODB_URI_ENV.endsWith("/?retryWrites=true&w=majority&appName=Cluster0")) {
          const errorMsg = "[Auth][Authorize] CRITICAL PRE-CHECK FAILED: MONGODB_URI is not set correctly in environment variables. It must be set and point to a specific database.";
          console.error(errorMsg);
          console.error("[Auth][Authorize] Current MONGODB_URI (potentially undefined or problematic):", MONGODB_URI_ENV);
          console.error("[Auth][Authorize] Login flow cannot proceed without a valid database URI. This will likely result in a 'Failed to fetch' error on the client if the auth API route crashes or is unresponsive.");
          throw new Error("Database configuration error. Please contact support or check server logs.");
        }

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

        try {
          await dbConnect();
          const connectionState = mongoose.connection.readyState;
          if (connectionState !== mongoose.ConnectionStates.connected) {
              const dbErrorMsg = `[Auth][Authorize] Database not connected despite dbConnect() completing! State: ${mongoose.ConnectionStates[connectionState]}`;
              console.error(dbErrorMsg);
              console.error("[Auth][Authorize] HINT: Check your MONGODB_URI for correctness (including database name), cluster status (e.g., not paused in Atlas), and IP access list if applicable.");
              throw new Error("Database connection failed during authorization."); // Throw error
          }

          const user = await User.findOne({ email: normalizedEmail }).select('+password').lean();

          if (!user) {
            console.log(`[Auth][Authorize] User not found for email: ${normalizedEmail}.`);
            return null;
          }
          
          console.log(`[Auth][Authorize] User found for ${normalizedEmail}. User object details (excluding password):`, 
            JSON.stringify({ 
              _id: user._id, 
              email: user.email, 
              name: user.name, 
              role: user.role, 
              isActive: user.isActive, 
              hasPasswordProperty: user.hasOwnProperty('password'),
              passwordFieldType: typeof user.password,
            })
          );

          if (user.password && typeof user.password === 'string') {
            console.log(`[Auth][Authorize] Retrieved password hash (snippet) for ${normalizedEmail}: ${user.password.substring(0, 10)}... (Length: ${user.password.length})`);
          } else {
            console.log(`[Auth][Authorize] Password field is MISSING, not a string, or undefined for ${normalizedEmail} after retrieval.`);
          }


          if (!user.isActive) {
            console.log(`[Auth][Authorize] User ${normalizedEmail} is inactive.`);
            throw new Error("User account is inactive.");
          }

          if (!user.password || typeof user.password !== 'string') { 
            console.log(`[Auth][Authorize] User ${normalizedEmail} has no password set in the database, it was not retrieved, or it's not a string.`);
            throw new Error("User account has no password set or password format is invalid.");
          }

          const isPasswordMatch = await bcrypt.compare(password, user.password);
          if (!isPasswordMatch) {
            console.log(`[Auth][Authorize] Password mismatch for user: ${normalizedEmail}`);
            return null; // Standard way to indicate credentials mismatch
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
             if (!planDetails) {
                console.warn(`[Auth][Authorize] No matching plan found in PLANS_CONFIG for stripePriceId: ${currentSubscription.stripePriceId}. User ${user._id} will default to free plan limits.`);
                planDetails = getPlanById('free');
             }
          } else {
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
          console.log(`[Auth][Authorize] SUCCESS: Authorizing user: ${normalizedEmail}. Returning user object:`, JSON.stringify(userToReturn));
          return userToReturn;

        } catch (error: any) { 
          console.error(`[Auth][Authorize] CRITICAL ERROR during authorization process for ${normalizedEmail}.`);
          console.error("[Auth][Authorize] Error Name:", error?.name);
          console.error("[Auth][Authorize] Error Message:", error?.message);
          console.error("[Auth][Authorize] Error Stack:", error?.stack);
          
          try {
            const fullErrorString = JSON.stringify(error, Object.getOwnPropertyNames(error));
            console.error("[Auth][Authorize] Full error object (stringified):", fullErrorString);
          } catch (stringifyError) {
            console.error("[Auth][Authorize] Could not stringify full error object. Logging raw error:", error);
          }


          if (typeof error.message === 'string' && error.message.toLowerCase().includes('mongodb_uri')) {
            console.error("[Auth][Authorize] This error seems related to the MONGODB_URI configuration. Ensure it's correctly set in your environment variables and points to a valid, accessible MongoDB instance and database.");
          } else if (typeof error.message === 'string' && (error.message.toLowerCase().includes('enodata') || error.message.toLowerCase().includes('eservfail') || error.message.toLowerCase().includes('bad auth'))) {
            console.error("[Auth][Authorize] This error suggests a problem connecting to or authenticating with MongoDB. Check connection string, IP whitelisting, credentials, and cluster status.");
          }
          
          if (error.message.startsWith("Database configuration error") || 
              error.message.startsWith("Database connection failed") ||
              error.message.startsWith("User account is inactive") ||
              error.message.startsWith("User account has no password set")) {
            throw error; // Re-throw specific errors from above
          }
          throw new Error("An unexpected error occurred during authorization."); // Generic fallback
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
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
        }

        if (trigger === "update" && session) {
            if (session.name !== undefined) token.name = session.name;
            if (session.avatarUrl !== undefined) token.avatarUrl = session.avatarUrl;
            
            if (session.refreshSubscription) { 
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
      } catch (error: any) {
        console.error("[Auth][JWT Callback] Error:", error);
        token.error = "JWTCallbackError";
        return token;
      }
    },
    async session({ session, token }) {
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
        } else {
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

// @ts-ignore
global.nextauth = global.nextauth ?? {};
// @ts-ignore
global.nextauth.authjs = global.nextauth.authjs ?? {};
// @ts-ignore
global.nextauth.authjs.esm = global.nextauth.authjs.esm ?? {};
// @ts-ignore
global.nextauth.authjs.esm.client = global.nextauth.authjs.esm.client ?? {};
// @ts-ignore
global.nextauth.authjs.esm.client.env = global.nextauth.authjs.esm.client.env ?? {};
// @ts-ignore
global.nextauth.authjs.esm.client.env.NEXTAUTH_URL = process.env.APP_URL ?? process.env.NEXTAUTH_URL;


// @ts-ignore
global.nextauth.authjs.esm.client.env.NEXTAUTH_COOKIE_DOMAIN = "";
// @ts-ignore
global.nextauth.authjs.esm.client.env.NEXTAUTH_COOKIE_PATH = "/";
// @ts-ignore
global.nextauth.authjs.esm.client.env.NEXTAUTH_COOKIE_PREFIX = "";
// @ts-ignore
global.nextauth.authjs.esm.client.env.NEXTAUTH_COOKIE_SECURE = process.env.NODE_ENV === 'production';
// @ts-ignore
global.nextauth.authjs.esm.client.env.NEXTAUTH_COOKIE_SAME_SITE = "lax";

if (!global.nextauth_ಉ) {
  // @ts-ignore
  global.nextauth_ಉ = true;
  console.debug("nextauth_ಉ", "NEXTAUTH_URL (used by Auth.js internally):", process.env.APP_URL ?? process.env.NEXTAUTH_URL);
  console.debug("nextauth_ಉ", "NEXTAUTH_SECRET (used by Auth.js internally):", process.env.NEXTAUTH_SECRET ? "[set]" : "[not set]");
  console.debug("nextauth_ಉ", "NEXTAUTH_URL_INTERNAL (Auth.js internal, usually not needed to set manually):", process.env.NEXTAUTH_URL_INTERNAL);
  console.debug("nextauth_ಉ", "AUTH_TRUST_HOST (Auth.js setting):", process.env.AUTH_TRUST_HOST); // For Next.js >= 14.0.2, might use this internally
  console.debug("nextauth_ಉ", "APP_URL (custom, used by this app):", process.env.APP_URL);
}
    
