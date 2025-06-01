
"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, CreditCard } from "lucide-react";
import { createStripeCheckoutSession } from '@/actions/stripe';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = React.useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/admin/dashboard'); 
    }
  }, [session, status, router]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    // Replace 'YOUR_STRIPE_PRICE_ID' with an actual Price ID from your Stripe account
    const priceId = 'price_YOUR_STRIPE_PRICE_ID'; // TODO: Replace with actual Price ID
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
      router.push(result.url); // Redirect to Stripe Checkout
    }
    setIsSubscribing(false);
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
            {/* TODO: Replace with actual Stripe Price ID from your dashboard */}
            <Button 
              onClick={handleSubscribe} 
              disabled={isSubscribing}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" /> }
              {isSubscribing ? "Processing..." : "Upgrade to Pro"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">You will be redirected to Stripe to complete your purchase.</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline">Usage Statistics</CardTitle>
            <CardDescription>Overview of your account usage.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Statistics are not yet available.</p>
          </CardContent>
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
