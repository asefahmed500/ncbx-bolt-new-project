
"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lightbulb, Loader2, CreditCard, ShoppingCart, ListChecks, FileText, Settings2, BarChart2, Tag } from "lucide-react";
import { createStripeCheckoutSession, createOneTimePaymentIntent } from '@/actions/stripe';
import { useToast } from '@/hooks/use-toast';

// TODO: In a real app, you would load Stripe.js and use Elements for secure payment.
// For example:
// import { loadStripe } from '@stripe/stripe-js';
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("10.00");
  const [couponCode, setCouponCode] = useState(""); // New state for coupon code
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);


  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [session, status, router]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    const priceId = 'price_YOUR_STRIPE_PRICE_ID';
    if (priceId === 'price_YOUR_STRIPE_PRICE_ID') {
        toast({
            title: "Configuration Needed",
            description: "Please replace 'price_YOUR_STRIPE_PRICE_ID' in src/app/dashboard/page.tsx with an actual Stripe Price ID.",
            variant: "destructive",
            duration: 7000,
        });
        setIsSubscribing(false);
        return;
    }

    const result = await createStripeCheckoutSession(priceId);

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
      // Here you would typically proceed with Stripe Elements to confirm the payment
      // e.g., stripe.confirmCardPayment(result.clientSecret, { payment_method: { card: cardElement } })
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
            <p className="text-muted-foreground">You haven't created any websites yet.</p>
            <Button className="mt-4 w-full">Create New Website</Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary" />Subscription</CardTitle>
            <CardDescription>Manage your subscription plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">You are currently on the free plan.</p>
            <Button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" /> }
              {isSubscribing ? "Processing..." : "Upgrade to Pro"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Stripe Checkout allows promotion codes.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" />Invoice History</CardTitle>
            <CardDescription>View your past invoices and payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No invoices found.</p>
             <Button variant="outline" className="mt-4 w-full" disabled>View Invoices</Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary" />Payment Methods</CardTitle>
            <CardDescription>Manage your saved payment methods.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No payment methods saved.</p>
            <Button variant="outline" className="mt-4 w-full" disabled>Manage Payment Methods</Button>
          </CardContent>
        </Card>

         <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <BarChart2 className="mr-2 h-5 w-5 text-primary" />
            <CardTitle className="font-headline">Usage Metrics</CardTitle>
            <CardDescription>Overview of your account usage.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Usage data will be displayed here.</p>
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
                  min="0.50" // Stripe minimum
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
              Your billing dashboard provides a clear overview of your subscription, payment history, and usage.
              More detailed analytics and management options are coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
