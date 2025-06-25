
// In a real application, Price IDs should come from your Stripe account.
// These are now read from environment variables.
// Ensure you have NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY, etc., set in your .env file.

export const STRIPE_PRICE_ID_PRO_MONTHLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || 'price_YOUR_PRO_MONTHLY_PRICE_ID_FROM_ENV';
export const STRIPE_PRICE_ID_PRO_YEARLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY || 'price_YOUR_PRO_YEARLY_PRICE_ID_FROM_ENV';
export const STRIPE_PRICE_ID_ENTERPRISE_MONTHLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE_MONTHLY || 'price_YOUR_ENTERPRISE_MONTHLY_PRICE_ID_FROM_ENV';

export interface PlanLimit {
  websites: number;
  // Add other limits like teamMembers, storageGB, etc.
}

export interface PlanFeature {
  text: string;
  includedInPro: boolean;
  includedInEnterprise: boolean;
}

export interface AppPlan {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  description: string;
  stripeMonthlyPriceId?: string;
  stripeYearlyPriceId?: string; // Optional
  monthlyPrice?: number; // For display, if needed. Stripe is source of truth.
  yearlyPrice?: number; // For display
  features: PlanFeature[];
  limits: PlanLimit;
}

export const PLANS_CONFIG: AppPlan[] = [
  {
    id: 'free',
    name: 'Free Tier',
    description: 'Get started and explore basic features.',
    features: [
      { text: 'Build 1 Website', includedInPro: true, includedInEnterprise: true },
      { text: 'Basic Templates', includedInPro: true, includedInEnterprise: true },
      { text: 'AI Copy Suggestions (Limited)', includedInPro: true, includedInEnterprise: true },
      { text: 'Community Support', includedInPro: true, includedInEnterprise: true },
      { text: 'Custom Domain', includedInPro: false, includedInEnterprise: false }, // Example: free doesn't get custom domain
      { text: 'Advanced AI Tools', includedInPro: false, includedInEnterprise: false },
      { text: 'Priority Support', includedInPro: false, includedInEnterprise: false },
    ],
    limits: {
      websites: 1,
    },
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    description: 'For professionals and growing businesses.',
    stripeMonthlyPriceId: STRIPE_PRICE_ID_PRO_MONTHLY,
    stripeYearlyPriceId: STRIPE_PRICE_ID_PRO_YEARLY,
    monthlyPrice: 29, // Example display price
    yearlyPrice: 228, // Example display price, for MRR calc
    features: [
      { text: 'Build up to 5 Websites', includedInPro: true, includedInEnterprise: true },
      { text: 'Access to All Templates', includedInPro: true, includedInEnterprise: true },
      { text: 'AI Copy Suggestions (Standard)', includedInPro: true, includedInEnterprise: true },
      { text: 'Custom Domain Support', includedInPro: true, includedInEnterprise: true },
      { text: 'Basic Analytics', includedInPro: true, includedInEnterprise: true },
      { text: 'Email Support', includedInPro: true, includedInEnterprise: true },
      { text: 'Advanced AI Tools', includedInPro: false, includedInEnterprise: true }, // Pro doesn't get this
    ],
    limits: {
      websites: 5,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    description: 'Tailored solutions for large organizations.',
    stripeMonthlyPriceId: STRIPE_PRICE_ID_ENTERPRISE_MONTHLY,
    monthlyPrice: 99, // Example display price
    yearlyPrice: 948, // Example display price
    features: [
      { text: 'Build Unlimited Websites', includedInPro: true, includedInEnterprise: true },
      { text: 'Access to All Templates', includedInPro: true, includedInEnterprise: true },
      { text: 'AI Copy Suggestions (Advanced)', includedInPro: true, includedInEnterprise: true },
      { text: 'Custom Domain Support', includedInPro: true, includedInEnterprise: true },
      { text: 'Advanced Analytics', includedInPro: true, includedInEnterprise: true },
      { text: 'Priority Support & SLA', includedInPro: true, includedInEnterprise: true },
      { text: 'Dedicated Account Manager', includedInPro: true, includedInEnterprise: true },
      { text: 'Advanced AI Tools', includedInPro: true, includedInEnterprise: true },
    ],
    limits: {
      websites: Infinity, // Or a very large number
    },
  },
];

export function getPlanById(planId: 'free' | 'pro' | 'enterprise'): AppPlan | undefined {
  return PLANS_CONFIG.find(p => p.id === planId);
}

export function getPlanByStripePriceId(stripePriceId: string): AppPlan | undefined {
  // Ensure we are comparing against actual Price IDs, not default placeholders if env vars are missing.
  // This comparison should still work as long as STRIPE_PRICE_ID_PRO_MONTHLY etc. resolve to the actual IDs.
  return PLANS_CONFIG.find(p =>
    (p.stripeMonthlyPriceId && p.stripeMonthlyPriceId === stripePriceId && !p.stripeMonthlyPriceId.includes('_YOUR_')) ||
    (p.stripeYearlyPriceId && p.stripeYearlyPriceId === stripePriceId && !p.stripeYearlyPriceId.includes('_YOUR_'))
  );
}
