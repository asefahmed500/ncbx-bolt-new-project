
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ITemplate } from '@/models/Template';
import { createOneTimePaymentIntent } from '@/actions/stripe';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PremiumTemplatePaymentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  template: ITemplate | null;
  onPaymentSuccess: (template: ITemplate) => void;
}

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

export function PremiumTemplatePaymentModal({ isOpen, onOpenChange, template, onPaymentSuccess }: PremiumTemplatePaymentModalProps) {
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [finalAmount, setFinalAmount] = useState<number | null>(template?.price || null);

  useEffect(() => {
    if (isOpen && template && template.price) {
      setError(null);
      setIsLoading(true);
      setClientSecret(null);

      const createIntent = async () => {
        const result = await createOneTimePaymentIntent(
            template.price!, 
            'usd', 
            couponCode.trim() || undefined, 
            {
                templateId: (template._id as unknown as string).toString(),
                templateName: template.name,
                description: `Purchase of premium template: "${template.name}"`,
            }
        );
        if (result.error || !result.clientSecret) {
          setError(result.error || "Failed to initialize payment.");
          toast({ title: "Payment Setup Error", description: result.error, variant: "destructive" });
        } else {
          setClientSecret(result.clientSecret);
          setFinalAmount(result.finalAmount || template.price!);
        }
        setIsLoading(false);
      };

      createIntent();
    }
  }, [isOpen, template, couponCode, toast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret || !template) {
      toast({ title: "Error", description: "Payment system not ready.", variant: "destructive" });
      return;
    }

    setIsProcessingPayment(true);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
        toast({ title: "Error", description: "Card details not found.", variant: "destructive" });
        setIsProcessingPayment(false);
        return;
    }
    
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (stripeError) {
      setError(stripeError.message || "An unknown payment error occurred.");
      toast({ title: "Payment Failed", description: stripeError.message, variant: "destructive" });
    } else if (paymentIntent?.status === 'succeeded') {
      onPaymentSuccess(template);
    } else {
      setError(`Payment status: ${paymentIntent?.status}. Please try again.`);
      toast({ title: "Payment Incomplete", description: `Status: ${paymentIntent?.status}`, variant: "destructive" });
    }

    setIsProcessingPayment(false);
  };
  
  const priceDisplay = finalAmount !== null ? `$${(finalAmount / 100).toFixed(2)}` : '...';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-foreground flex items-center"><ShoppingCart className="mr-2 h-5 w-5"/>Purchase Premium Template</DialogTitle>
          <DialogDescription className="text-muted-foreground">Complete your secure payment for "{template?.name}".</DialogDescription>
        </DialogHeader>
        {isLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-destructive text-center p-4 bg-destructive/10 rounded-md">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Payment Error</p>
                <p className="text-sm">{error}</p>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                 <div>
                    <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                    <Input id="couponCode" placeholder="Enter code" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="bg-input mt-1" />
                 </div>
                 <div className="p-3 border border-input rounded-md bg-background">
                    <CardElement options={cardElementOptions} />
                 </div>
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessingPayment}>Cancel</Button>
                    <Button type="submit" disabled={isProcessingPayment || !stripe || !elements} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {isProcessingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        {isProcessingPayment ? 'Processing...' : `Pay ${priceDisplay}`}
                    </Button>
                </DialogFooter>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
