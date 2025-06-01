
"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lightbulb, Loader2, CreditCard, ShoppingCart } from "lucide-react";
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
  const [paymentAmount, setPaymentAmount] = useState("10.00"); // Default to $10.00
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);


  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/admin/dashboard'); 
    }
  }, [session, status, router]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    const priceId = 'price_YOUR_STRIPE_PRICE_ID'; // TODO: Replace with actual Stripe Price ID
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

    const result = await createOneTimePaymentIntent(amountInCents, 'usd');

    if (result.error) {
      toast({ title: "Payment Error", description: result.error, variant: "destructive" });
    } else if (result.clientSecret && result.paymentIntentId) {
      toast({
        title: "Payment Intent Created",
        description: `Client Secret ready. PI ID: ${result.paymentIntentId}. Integrate Stripe Elements to complete payment.`,
      });
      console.log("PaymentIntent Client Secret:", result.clientSecret);
      // TODO: Implement Stripe Elements and stripe.confirmCardPayment(result.clientSecret, { payment_method: ... })
      // For now, we just log it.
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline">My Websites</CardTitle>
            <CardDescription>View and manage your created websites.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You haven't created any websites yet.</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline">Subscription</CardTitle>
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
            <p className="text-xs text-muted-foreground text-center">You will be redirected to Stripe Checkout.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline">One-Time Payment</CardTitle>
            <CardDescription>Make a single payment.</CardDescription>
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
                  min="0.50" // Stripe minimums may apply
                  required
                  className="bg-input mt-1"
                />
              </div>
              {/* Placeholder for Stripe Elements Card Element */}
              <div className="p-3 border border-dashed rounded-md bg-muted/50 text-center text-muted-foreground">
                Stripe Card Element would be here.
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
            <h3 className="font-semibold text-accent-foreground">Coming Soon!</h3>
            <p className="text-sm text-muted-foreground">
              We're working hard to bring you more dashboard features, including detailed analytics,
              website management tools, and more quick actions. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
