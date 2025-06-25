
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: PlanFeature[];
  isPopular?: boolean;
  actionLabel: string;
  actionLink: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free Tier',
    description: 'Get started and explore basic features.',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { text: '1 Website', included: true },
      { text: 'Basic Templates', included: true },
      { text: 'AI Copy Suggestions (Limited)', included: true },
      { text: 'Community Support', included: true },
      { text: 'Custom Domain', included: false },
      { text: 'Advanced AI Tools', included: false },
      { text: 'Priority Support', included: false },
    ],
    actionLabel: 'Get Started',
    actionLink: '/register',
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    description: 'For professionals and growing businesses.',
    monthlyPrice: 29,
    annualPrice: 228, // Equivalent to $19/month
    features: [
      { text: '5 Websites', included: true },
      { text: 'All Templates', included: true },
      { text: 'AI Copy Suggestions (Unlimited)', included: true },
      { text: 'Advanced AI Tools', included: true },
      { text: 'Custom Domain', included: true },
      { text: 'Basic Analytics', included: true },
      { text: 'Priority Support', included: true },
    ],
    isPopular: true,
    actionLabel: 'Choose Pro',
    actionLink: '/register?plan=pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Tailored solutions for large organizations.',
    monthlyPrice: -1, // Indicates "Custom"
    annualPrice: -1,  // Indicates "Custom"
    features: [
      { text: 'Unlimited Websites', included: true },
      { text: 'All Pro Features', included: true },
      { text: 'Dedicated Account Manager', included: true },
      { text: 'Custom Integrations', included: true },
      { text: 'Advanced Security & SSO', included: true },
      { text: 'Premium Support & SLA', included: true },
      { text: 'Volume Discounts', included: true },
    ],
    actionLabel: 'Contact Us',
    actionLink: '/support?topic=enterprise',
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  const getPriceDisplay = (plan: Plan) => {
    if (plan.monthlyPrice === -1) return <p className="text-3xl font-bold">Custom</p>;
    const price = isAnnual ? plan.annualPrice / 12 : plan.monthlyPrice;
    const period = isAnnual ? '/yr' : '/mo';
    const actualDisplayPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    
    return (
      <>
        <p className="text-4xl font-bold">${actualDisplayPrice}<span className="text-base font-normal text-muted-foreground">{period}</span></p>
        {isAnnual && plan.monthlyPrice > 0 && (
          <p className="text-sm text-muted-foreground mt-1">(${price.toFixed(0)}/month billed annually)</p>
        )}
      </>
    );
  };

  return (
    <section id="pricing" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-6 text-center">
        <DollarSign className="w-12 h-12 text-primary/80 mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-headline font-semibold mb-6">
          Simple, Transparent Pricing
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Choose the plan that's right for you. No hidden fees, cancel anytime.
        </p>

        <div className="flex justify-center items-center mb-12">
          <span className={`mr-3 font-medium ${!isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>Monthly</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAnnual(!isAnnual)}
            aria-pressed={isAnnual}
            aria-label={isAnnual ? "Switch to monthly billing" : "Switch to annual billing"}
            className="rounded-full w-14 h-8 p-1 bg-muted hover:bg-muted/90 data-[state=on]:bg-primary data-[state=off]:bg-muted"
          >
            {isAnnual ? <ToggleRight className="h-7 w-7 text-primary-foreground" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
          </Button>
          <span className={`ml-3 font-medium ${isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>
            Annually <span className="text-xs text-accent">(Save up to 20%)</span>
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`shadow-lg hover:shadow-xl transition-shadow flex flex-col ${plan.isPopular ? 'border-2 border-primary' : ''}`}
            >
              <CardHeader className={`p-6 ${plan.isPopular ? 'bg-primary/5' : 'bg-muted/30'}`}>
                {plan.isPopular && (
                  <div className="text-right mb-2">
                    <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold">Popular</span>
                  </div>
                )}
                <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground min-h-[40px]">{plan.description}</CardDescription>
                <div className="mt-4 h-20 flex flex-col justify-center items-center">
                 {getPriceDisplay(plan)}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3 flex-grow">
                <ul className="space-y-2 text-left">
                  {plan.features.map((feature, index) => (
                    <li key={index} className={`flex items-start ${!feature.included ? 'text-muted-foreground line-through' : ''}`}>
                      <CheckCircle className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${feature.included ? 'text-green-500' : 'text-muted-foreground/50'}`} />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 mt-auto">
                <Button
                  asChild
                  className={`w-full ${plan.isPopular ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'}`}
                  variant={plan.isPopular ? 'default' : 'secondary'}
                >
                  <Link href={plan.actionLink}>{plan.actionLabel}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
