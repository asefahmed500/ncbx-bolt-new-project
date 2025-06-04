
// @ts-nocheck
console.log("[Auth Module] src/auth.ts loaded by server."); // New log

import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { IUser } from '@/models/User'; // Keep type import
import type { ISubscription } from "@/models/Subscription"; // Keep type import
import mongoose from 'mongoose';
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
          // Throwing an error here can sometimes provide a more structured error to Auth.js
          throw new Error("Database configuration error. Please contact support or check server logs.");
          // return null; 
        }

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

        try {
          await dbConnect();
          const connectionState = mongoose.connection.readyState;
          if (connectionState !== mongoose.ConnectionStates.connected) {
              const dbErrorMsg = `[Auth][Authorize] Database not connected despite dbConnect() completing! State: ${mongoose.ConnectionStates[connectionState]}`;
              console.error(dbErrorMsg);
              console.error("[Auth][Authorize] HINT: Check your MONGODB_URI for correctness (including database name), cluster status (e.g., not paused in Atlas), and IP access list if applicable.");
              throw new Error("Database connection failed during authorization."); // Throw error
              // return null;
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
            // Consider throwing a specific error or returning an object that middleware can interpret
            // For now, null will lead to "Invalid credentials" on client
            throw new Error("User account is inactive."); // Throw specific error
            // return null; 
          }

          if (!user.password || typeof user.password !== 'string') { 
            console.log(`[Auth][Authorize] User ${normalizedEmail} has no password set in the database, it was not retrieved, or it's not a string.`);
            throw new Error("User account has no password set or password format is invalid."); // Throw error
            // return null;
          }

          const isPasswordMatch = await bcrypt.compare(password, user.password);
          if (!isPasswordMatch) {
            console.log(`[Auth][Authorize] Password mismatch for user: ${normalizedEmail}`);
            return null; // Standard way to indicate credentials mismatch
          }

          let currentSubscription: ISubscription | null = null;
          try {
            currentSubscription = await Subscription.findOne({
              userId: user._id,
              // Optionally filter by active status here if Stripe webhooks are perfect
              // stripeSubscriptionStatus: { $in: ['active', 'trialing'] } 
            }).sort({ stripeCurrentPeriodEnd: -1 }).lean(); // Get the latest one if multiple (should ideally not happen for same user)
          } catch (subError) {
            console.error(`[Auth][Authorize] Error fetching subscription for user ${user._id}:`, subError);
            // Decide if this should block login. For now, assume user can log in but might have Free plan.
          }

          let planDetails: AppPlan | undefined;
          let subscriptionStatusForSession: string | null = null;

          if (currentSubscription && currentSubscription.stripePriceId) {
             planDetails = getPlanByStripePriceId(currentSubscription.stripePriceId);
             subscriptionStatusForSession = currentSubscription.stripeSubscriptionStatus as string;
             // If planDetails is undefined here, it means the stripePriceId from DB doesn't match any known plan.
             // This could happen if plans change in Stripe but not in app config. Default to free.
             if (!planDetails) {
                console.warn(`[Auth][Authorize] No matching plan found in PLANS_CONFIG for stripePriceId: ${currentSubscription.stripePriceId}. User ${user._id} will default to free plan limits.`);
                planDetails = getPlanById('free');
             }
          } else {
            // No active-like subscription found, default to free plan
            planDetails = getPlanById('free');
            // Subscription status is null if no relevant subscription record
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
          
          // Re-throw the error or throw a new generic one to ensure Auth.js handles it
          if (error.message.startsWith("Database configuration error") || 
              error.message.startsWith("Database connection failed") ||
              error.message.startsWith("User account is inactive") ||
              error.message.startsWith("User account has no password set")) {
            throw error; // Re-throw specific errors from above
          }
          throw new Error("An unexpected error occurred during authorization."); // Generic fallback
          // return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // console.log("[Auth][JWT Callback] Triggered. Current Token:", JSON.stringify(token), "User obj:", JSON.stringify(user));
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

          // console.log("[Auth][JWT Callback] User data (incl. subscription) added to token on signIn/signUp:", JSON.stringify(token));
        }

        if (trigger === "update" && session) {
            if (session.name !== undefined) token.name = session.name; // Allow clearing name by passing empty string
            if (session.avatarUrl !== undefined) token.avatarUrl = session.avatarUrl; // Allow clearing avatar by passing empty string
            
            // If session update needs to refresh subscription status from DB (e.g., after a webhook update):
            // This is an example, actual implementation might differ based on how you trigger updates.
            // For instance, after a successful purchase/upgrade via webhook, you might want to force an update.
            if (session.refreshSubscription) { // Custom property you might add to session in an update call
                const SubscriptionModel = (await import('@/models/Subscription')).default;
                const dbSub = await SubscriptionModel.findOne({ userId: token.id }).sort({ stripeCurrentPeriodEnd: -1 }).lean();
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
            // console.log("[Auth][JWT Callback] Token updated via 'update' trigger:", JSON.stringify(token));
        }
        return token;
      } catch (error: any) {
        console.error("[Auth][JWT Callback] Error:", error);
        token.error = "JWTCallbackError";
        return token;
      }
    },
    async session({ session, token }) {
      // console.log("[Auth][Session Callback] Triggered. Current Session:", JSON.stringify(session), "Token:", JSON.stringify(token));
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
          // console.log("[Auth][Session Callback] Session user hydrated from token (incl. subscription):", JSON.stringify(session.user));
        } else {
          // console.warn("[Auth][Session Callback] Token or session.user not available.");
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
    // If you have a custom error page for auth errors:
    // error: '/auth/error', 
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for some deployments, ensure you understand implications
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null; // Default NextAuth property, can be ignored if avatarUrl is used
      role: 'user' | 'admin';
      avatarUrl?: string;
      isActive: boolean;
      purchasedTemplateIds?: string[];
      subscriptionStatus?: string | null; 
      subscriptionPlanId?: 'free' | 'pro' | 'enterprise';
      subscriptionLimits?: PlanLimit;
      projectsUsed?: number; // Added for consistency if needed directly on session.user from token
    };
    refreshSubscription?: boolean; // Custom property for triggering subscription refresh
  }

  interface User { // This is the User object returned by the authorize callback
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
    projectsUsed?: number; // For user object passed to JWT callback
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
    projectsUsed?: number; // Ensure JWT can carry this if set from User object
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
  // console.debug("nextauth_ಉ", "AUTH_URL (deprecated in v5):", process.env.AUTH_URL); // Log if present, but note deprecation
  console.debug("nextauth_ಉ", "APP_URL (custom, used by this app):", process.env.APP_URL);
}
    

