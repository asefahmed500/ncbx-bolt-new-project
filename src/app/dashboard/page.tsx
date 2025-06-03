
"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, CreditCard, ShoppingCart, ListChecks, Settings2 as SettingsIcon, BarChart2, Tag, ArrowUpCircle, ExternalLink, PlusSquare, Edit3, Globe, Trash2, Link2, CheckCircle, AlertCircle, FileText, AlertTriangle, XCircle } from "lucide-react";
import { createStripeCheckoutSession, createOneTimePaymentIntent, createStripeCustomerPortalSession } from '@/actions/stripe';
import { getUserWebsites, deleteWebsite as deleteWebsiteAction } from '@/actions/website'; 
import type { IWebsite, DomainConnectionStatus } from '@/models/Website';
import { useToast } from '@/hooks/use-toast';
import { STRIPE_PRICE_ID_PRO_MONTHLY, getPlanById, type AppPlan } from '@/config/plans';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { loadStripe, type Stripe as StripeType } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes("YOUR_STRIPE_PUBLISHABLE_KEY")
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface OneTimePaymentFormProps {
  couponCode: string;
  setCouponCode: (code: string) => void;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
}

function OneTimePaymentForm({ couponCode, setCouponCode, paymentAmount, setPaymentAmount }: OneTimePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleOneTimePaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast({ title: "Stripe Not Loaded", description: "Stripe.js has not loaded yet. Please try again in a moment.", variant: "destructive" });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({ title: "Card Element Error", description: "Card input element not found.", variant: "destructive" });
      return;
    }

    setIsProcessingPayment(true);
    const amountInCents = Math.round(parseFloat(paymentAmount) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid payment amount.", variant: "destructive" });
      setIsProcessingPayment(false);
      return;
    }

    const intentResult = await createOneTimePaymentIntent(amountInCents, 'usd', couponCode.trim() || undefined);

    if (intentResult.error || !intentResult.clientSecret) {
      toast({ title: "Payment Setup Error", description: intentResult.error || "Could not create payment intent.", variant: "destructive" });
      setIsProcessingPayment(false);
      return;
    }

    const { clientSecret, paymentIntentId, finalAmount, discountApplied, couponApplied } = intentResult;

    toast({ title: "Processing Payment...", description: `Attempting to confirm payment for $${(finalAmount! / 100).toFixed(2)}.`});

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      toast({ title: "Payment Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } else if (paymentIntent?.status === 'succeeded') {
      let successMessage = `Payment of $${(paymentIntent.amount / 100).toFixed(2)} Succeeded!`;
       if(couponApplied && discountApplied) {
        successMessage += ` Discount of $${(discountApplied/100).toFixed(2)} applied.`;
      }
      toast({ title: "Payment Successful!", description: successMessage });
      setPaymentAmount("10.00");
      setCouponCode("");
      cardElement.clear();
    } else {
      toast({ title: "Payment Incomplete", description: `Payment status: ${paymentIntent?.status}.`, variant: "destructive" });
    }
    setIsProcessingPayment(false);
  };
  
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#FFFFFF' : '#32325d',
        fontFamily: 'Inter, sans-serif',
        '::placeholder': {
          color: typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#aab7c4' : '#aab7c4',
        },
        iconColor: typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#FFFFFF' : '#32325d',
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
    hidePostalCode: true,
  };


  return (
    <form onSubmit={handleOneTimePaymentSubmit} className="space-y-4">
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
      <div className="p-3 border border-input rounded-md bg-background">
        <CardElement options={cardElementOptions} />
      </div>
      <Button
        type="submit"
        disabled={isProcessingPayment || !stripe || !elements}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        {isProcessingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
        {isProcessingPayment ? "Processing..." : `Pay $${paymentAmount}`}
      </Button>
    </form>
  );
}


export default function DashboardPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("10.00");
  const [couponCode, setCouponCode] = useState("");
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [userWebsites, setUserWebsites] = useState<IWebsite[]>([]);
  const [isLoadingWebsites, setIsLoadingWebsites] = useState(true);
  const [deletingWebsiteId, setDeletingWebsiteId] = useState<string | null>(null);
  const [isStripePublishableKeyMissing, setIsStripePublishableKeyMissing] = useState(false);


  const currentPlan = session?.user?.subscriptionPlanId ? getPlanById(session.user.subscriptionPlanId) : getPlanById('free');
  const subscriptionStatus = session?.user?.subscriptionStatus;
  const isActiveSubscription = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
  
  const isProPlanConfigured = STRIPE_PRICE_ID_PRO_MONTHLY && !STRIPE_PRICE_ID_PRO_MONTHLY.includes('_YOUR_');

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('YOUR_STRIPE_PUBLISHABLE_KEY')) {
      setIsStripePublishableKeyMissing(true);
      console.warn("Stripe Publishable Key is missing or is a placeholder. Payment form will not work.");
      if (stripePromise === null) { // Explicitly check if stripePromise remained null
        toast({
            title: "Stripe Configuration Incomplete",
            description: "The Stripe Publishable Key is missing or invalid. Payment features will be disabled. Admin: please check your .env file.",
            variant: "destructive",
            duration: 10000,
        });
      }
    } else {
      setIsStripePublishableKeyMissing(false);
    }
  }, []);


  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/admin/dashboard');
    }
    if (status === 'authenticated') {
        fetchWebsites();
    }
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('session_id')) {
        toast({
            title: "Subscription Updated!",
            description: "Your subscription details may take a moment to refresh.",
        });
        // Update session or re-fetch user data here if needed to reflect new subscription immediately
        updateSession();
        router.replace('/dashboard', undefined); 
    }
  }, [session, status, router, toast, updateSession]);

  const fetchWebsites = async () => {
    setIsLoadingWebsites(true);
    const result = await getUserWebsites();
    if (result.error) {
      toast({ title: "Error", description: `Failed to load your websites: ${result.error}`, variant: "destructive" });
      setUserWebsites([]);
    } else if (result.websites) {
      setUserWebsites(result.websites);
    }
    setIsLoadingWebsites(false);
  };

  const handleSubscribeToPro = async () => {
    setIsSubscribing(true);
    if (!isProPlanConfigured) {
        toast({
            title: "Configuration Needed",
            description: `Please ensure NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY is set correctly in your .env file.`,
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

  const handleDeleteWebsite = async () => {
    if (!deletingWebsiteId) return;
    const result = await deleteWebsiteAction({ websiteId: deletingWebsiteId });
    if (result.error) {
      toast({ title: "Error Deleting Website", description: result.error, variant: "destructive" });
    } else if (result.success) {
      toast({ title: "Website Deleted", description: "The website has been successfully deleted." });
      fetchWebsites(); 
    }
    setDeletingWebsiteId(null);
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
  
  const userProjectsUsed = userWebsites.length;
  const websiteLimit = currentPlan?.limits?.websites ?? 0;
  const canCreateWebsite = websiteLimit === Infinity || userProjectsUsed < websiteLimit;

  const getStatusBadgeVariant = (status: IWebsite['status']) => {
    switch (status) {
      case 'published': return 'default'; 
      case 'draft': return 'outline';
      case 'unpublished': return 'secondary';
      case 'error_publishing': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDomainStatusInfo = (status?: DomainConnectionStatus) => {
    switch (status) {
        case 'verified': return { text: 'Verified', icon: CheckCircle, color: 'text-green-500', badgeVariant: 'default' as const };
        case 'pending_verification': return { text: 'Pending', icon: Loader2, color: 'text-yellow-500 animate-spin', badgeVariant: 'outline' as const };
        case 'error_dns': return { text: 'DNS Error', icon: AlertCircle, color: 'text-red-500', badgeVariant: 'destructive' as const };
        case 'error_ssl': return { text: 'SSL Error', icon: AlertCircle, color: 'text-red-500', badgeVariant: 'destructive' as const };
        case 'unconfigured':
        default: return { text: 'Unconfigured', icon: Link2, color: 'text-muted-foreground', badgeVariant: 'secondary' as const };
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-semibold">Dashboard</h1>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!canCreateWebsite}>
          <Link href="/dashboard/websites/create">
            <PlusSquare className="mr-2 h-4 w-4" /> Create New Website
          </Link>
        </Button>
      </div>
      {!canCreateWebsite && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md text-sm flex items-center">
           <AlertTriangle className="h-5 w-5 mr-2" />
          You've reached your website limit of {websiteLimit} for the {currentPlan?.name || 'current plan'}. Please upgrade to create more websites.
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-2xl font-semibold font-headline mb-4 flex items-center"><ListChecks className="mr-3 h-6 w-6 text-primary" />My Websites</h2>
        {isLoadingWebsites ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => (
              <Card key={i} className="shadow-sm animate-pulse">
                <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
                <CardContent><div className="h-4 bg-muted rounded w-1/2 mb-2"></div><div className="h-4 bg-muted rounded w-full"></div></CardContent>
                <CardFooter className="flex justify-between items-center"><div className="h-8 bg-muted rounded w-1/4"></div><div className="h-8 bg-muted rounded w-1/4"></div></CardFooter>
              </Card>
            ))}
          </div>
        ) : userWebsites.length === 0 ? (
          <Card className="text-center py-10 bg-muted/30 border-dashed">
            <CardContent>
              <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No websites yet!</p>
              <p className="text-sm text-muted-foreground mb-6">Start building your online presence.</p>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!canCreateWebsite}>
                <Link href="/dashboard/websites/create">
                    <PlusSquare className="mr-2 h-4 w-4" /> Create Your First Website
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userWebsites.map(site => {
              const domainStatusInfo = getDomainStatusInfo(site.domainStatus);
              return (
              <Card key={site._id as string} className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline text-lg truncate">{site.name}</CardTitle>
                   <CardDescription className="text-xs truncate">
                    {site.customDomain ? (
                        <>Custom Domain: {site.customDomain}</>
                    ) : (
                        <>Subdomain: {site.subdomain}.{process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || 'notthedomain.com'}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getStatusBadgeVariant(site.status)} className="capitalize text-xs">{site.status.replace('_', ' ')}</Badge>
                    <Badge variant={domainStatusInfo.badgeVariant} className="capitalize text-xs">
                      <domainStatusInfo.icon className={`mr-1 h-3 w-3 ${domainStatusInfo.color}`} />
                      Domain: {domainStatusInfo.text}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(site.createdAt).toLocaleDateString()}
                  </p>
                  {site.lastPublishedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last Published: {new Date(site.lastPublishedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="gap-2 flex-wrap items-center">
                  <Button asChild variant="outline" size="sm" className="flex-1 min-w-[70px]">
                    <Link href={`/editor?websiteId=${site._id}`}>
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm" className="flex-1 min-w-[70px]">
                     <Link href={`/dashboard/websites/${site._id}/settings`}>
                        <SettingsIcon className="mr-1.5 h-3.5 w-3.5" /> Settings
                     </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => setDeletingWebsiteId(site._id as string)}>
                         <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Delete Website</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the website "{site.name}" and all its data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingWebsiteId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteWebsite} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            );
          })}
          </div>
        )}
      </section>


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary" />Subscription</CardTitle>
            <CardDescription>Manage your subscription plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isActiveSubscription && currentPlan ? (
              <>
                <p>Current Plan: <span className="font-semibold text-primary">{currentPlan.name}</span></p>
                <p>Status: 
                    <Badge variant={subscriptionStatus === 'active' || subscriptionStatus === 'trialing' ? 'default' : 'secondary'} className="ml-2 capitalize">
                        {subscriptionStatus === 'active' || subscriptionStatus === 'trialing' ? <CheckCircle className="inline-block h-3 w-3 mr-1" /> : <AlertCircle className="inline-block h-3 w-3 mr-1" />}
                        {subscriptionStatus}
                    </Badge>
                </p>
                <Button
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isManagingSubscription ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SettingsIcon className="mr-2 h-4 w-4" />}
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
            {!isActiveSubscription && currentPlan?.id !== 'enterprise' && (
              <Button className="mt-4 w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleSubscribeToPro} disabled={!isProPlanConfigured || isStripePublishableKeyMissing}>
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
            {isStripePublishableKeyMissing ? (
              <div className="p-4 bg-destructive/10 text-destructive border border-destructive rounded-md text-sm">
                <AlertTriangle className="inline h-5 w-5 mr-2" />
                Stripe payments are not configured. Admin: Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file.
              </div>
            ) : stripePromise ? (
              <Elements stripe={stripePromise}>
                <OneTimePaymentForm 
                  couponCode={couponCode}
                  setCouponCode={setCouponCode}
                  paymentAmount={paymentAmount}
                  setPaymentAmount={setPaymentAmount}
                />
              </Elements>
            ) : (
                 <div className="flex items-center justify-center h-full">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading Stripe...
                </div>
            )}
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">
              {isStripePublishableKeyMissing 
                ? "Payment form disabled until Stripe is configured."
                : "Secure payments powered by Stripe."}
            </p>
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

    