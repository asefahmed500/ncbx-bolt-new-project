
"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lightbulb, Loader2, CreditCard, ShoppingCart, ListChecks, FileText, Settings2, BarChart2, Tag, ShieldAlert, ArrowUpCircle, ExternalLink, PlusSquare } from "lucide-react";
import { createStripeCheckoutSession, createOneTimePaymentIntent, createStripeCustomerPortalSession } from '@/actions/stripe';
import { useToast } from '@/hooks/use-toast';
import { STRIPE_PRICE_ID_PRO_MONTHLY, getPlanById, type AppPlan } from '@/config/plans';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("10.00");
  const [couponCode, setCouponCode] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  const currentPlan = session?.user?.subscriptionPlanId ? getPlanById(session.user.subscriptionPlanId) : getPlanById('free');
  const subscriptionStatus = session?.user?.subscriptionStatus;
  const isActiveSubscription = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
  
  // Check if the Pro Monthly Price ID is a placeholder
  const isProPlanConfigured = STRIPE_PRICE_ID_PRO_MONTHLY && !STRIPE_PRICE_ID_PRO_MONTHLY.includes('_YOUR_');


  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/admin/dashboard');
    }
    // Check for Stripe Checkout session success query parameter
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('session_id')) {
        toast({
            title: "Subscription Updated!",
            description: "Your subscription details may take a moment to refresh.",
        });
        // updateSession(); // Request session update after returning from Stripe
        router.replace('/dashboard', undefined); // Remove query params
    }
  }, [session, status, router, toast, updateSession]);

  const handleSubscribeToPro = async () => {
    setIsSubscribing(true);
    if (!isProPlanConfigured) {
        toast({
            title: "Configuration Needed",
            description: `Please ensure NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY is set correctly in your .env file. The current value is a placeholder: ${STRIPE_PRICE_ID_PRO_MONTHLY}`,
            variant: "destructive",
            duration: 10000,
        });
        setIsSubscribing(false);
        return;
    }

    const result = await createStripeCheckoutSession(STRIPE_PRICE_ID_PRO_MONTHLY);

    if (result.error) {
      toast({
        title: "Subscription Error",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.url) {
      router.push(result.url);
    }
    setIsSubscribing(false);
  };

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    const result = await createStripeCustomerPortalSession();
    if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result.url) {
        router.push(result.url);
    }
    setIsManagingSubscription(false);
  };

  const handleOneTimePayment = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);

    const amountInCents = Math.round(parseFloat(paymentAmount) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid payment amount.", variant: "destructive" });
      setIsProcessingPayment(false);
      return;
    }

    const result = await createOneTimePaymentIntent(amountInCents, 'usd', couponCode.trim() || undefined);

    if (result.error) {
      toast({ title: "Payment Error", description: result.error, variant: "destructive" });
    } else if (result.clientSecret && result.paymentIntentId) {
      let description = `Client Secret ready. PI ID: ${result.paymentIntentId}. Final amount: $${(result.finalAmount!/100).toFixed(2)}.`;
      if(result.couponApplied) {
        description += ` Discount of $${(result.discountApplied!/100).toFixed(2)} applied with coupon.`
      }
      description += ` Integrate Stripe Elements to complete payment.`

      toast({
        title: "Payment Intent Created",
        description: description,
      });
      console.log("PaymentIntent Client Secret:", result.clientSecret);
    }
    setIsProcessingPayment(false);
  };


  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

   if (status === 'authenticated' && session?.user?.role === 'admin') {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Redirecting to admin dashboard...</p>
      </div>
    );
  }
  
  const userProjectsUsed = session?.user?.projectsUsed || 0;
  const websiteLimit = currentPlan?.limits?.websites ?? 0;
  const canCreateWebsite = websiteLimit === Infinity || userProjectsUsed < websiteLimit;

  return (
    <div className="flex-1 p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-semibold">Dashboard</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />My Websites</CardTitle>
            <CardDescription>View and manage your created websites.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You have created {userProjectsUsed} out of {websiteLimit === Infinity ? 'unlimited' : websiteLimit} websites.</p>
            {!canCreateWebsite && (
                 <p className="text-sm text-destructive mt-1">You've reached your website limit for the {currentPlan?.name || 'current plan'}.</p>
            )}
            <Button asChild className="mt-4 w-full" disabled={!canCreateWebsite}>
              <Link href="/dashboard/websites/create">
                <PlusSquare className="mr-2 h-4 w-4" /> Create New Website
              </Link>
            </Button>
             {!canCreateWebsite && currentPlan?.id !== 'enterprise' && (
                <Button variant="outline" className="mt-2 w-full" onClick={handleSubscribeToPro}>Upgrade to Pro/Enterprise</Button>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary" />Subscription</CardTitle>
            <CardDescription>Manage your subscription plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isActiveSubscription && currentPlan ? (
              <>
                <p>Current Plan: <span className="font-semibold text-primary">{currentPlan.name}</span></p>
                <p>Status: <span className="font-semibold capitalize text-green-600">{subscriptionStatus}</span></p>
                <Button
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isManagingSubscription ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings2 className="mr-2 h-4 w-4" />}
                  Manage Subscription & Billing
                </Button>
                 <p className="text-xs text-muted-foreground text-center">Manage details via Stripe Customer Portal.</p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">You are currently on the {currentPlan?.name || 'Free plan'}.</p>
                <Button
                  onClick={handleSubscribeToPro}
                  disabled={isSubscribing || !isProPlanConfigured}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" /> }
                  {isSubscribing ? "Processing..." : (!isProPlanConfigured ? "Setup Pro Plan ID in .env" : "Upgrade to Pro")}
                </Button>
                {!isProPlanConfigured && <p className="text-xs text-destructive text-center mt-1">Admin: Configure Pro Plan Price ID in .env file.</p>}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-primary" />Usage Metrics</CardTitle>
            <CardDescription>Overview of your account usage.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="mt-2 space-y-1 text-sm">
              <p>Websites Created: {userProjectsUsed} / {websiteLimit === Infinity ? 'Unlimited' : (currentPlan?.limits?.websites ?? 'N/A')}</p>
              <p>AI Copy Generations: 5 / {currentPlan?.id === 'pro' || currentPlan?.id === 'enterprise' ? 'Unlimited' : '50 per month'} (Placeholder)</p>
              <p>Storage: 100MB / {currentPlan?.id === 'pro' ? '5GB' : currentPlan?.id === 'enterprise' ? '20GB' : '1GB'} (Placeholder)</p>
            </div>
            {!canCreateWebsite && currentPlan?.id !== 'enterprise' && (
              <Button className="mt-4 w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleSubscribeToPro}>
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Upgrade Plan to Increase Limits
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><ShoppingCart className="mr-2 h-5 w-5 text-primary" />One-Time Payment</CardTitle>
            <CardDescription>Make a single payment for credits or services.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOneTimePayment} className="space-y-4">
              <div>
                <Label htmlFor="paymentAmount" className="text-sm">Amount (USD)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g., 10.00"
                  step="0.01"
                  min="0.50"
                  required
                  className="bg-input mt-1"
                />
              </div>
              <div>
                <Label htmlFor="couponCode" className="text-sm flex items-center">
                  <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                  Coupon Code (Optional)
                </Label>
                <Input
                  id="couponCode"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g., SUMMER25"
                  className="bg-input mt-1"
                />
              </div>
              <div className="p-3 border border-dashed rounded-md bg-muted/50 text-center text-muted-foreground">
                Stripe Card Element would be here for secure input.
              </div>
              <Button
                type="submit"
                disabled={isProcessingPayment}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isProcessingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                {isProcessingPayment ? "Processing..." : `Pay $${paymentAmount}`}
              </Button>
            </form>
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">This is a demo. Full card input with Stripe Elements is needed for actual payments.</p>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-10 p-6 bg-accent/10 rounded-lg border border-accent/30">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-6 h-6 text-accent mt-1" />
          <div>
            <h3 className="font-semibold text-accent-foreground">Billing & Usage Insights</h3>
            <p className="text-sm text-muted-foreground">
              Your dashboard provides a clear overview of your subscription, payment history (via Stripe Portal), and conceptual usage limits.
              More detailed analytics and management options are coming soon!
            </p>
             <p className="text-xs text-muted-foreground mt-2">
                Note: If you've just completed a subscription action via Stripe, your session here might take a moment to update (or require a page refresh/re-login) to reflect the latest status due to webhook processing delays.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
