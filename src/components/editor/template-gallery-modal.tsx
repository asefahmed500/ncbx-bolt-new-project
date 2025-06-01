
"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { createOneTimePaymentIntent } from '@/actions/stripe';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart } from 'lucide-react';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// In a real app, this data would come from a database
const templates = [
  { id: "t1", name: "Modern Portfolio", imgSrc: "https://placehold.co/300x200.png", hint:"portfolio website", isPremium: false },
  { id: "t2", name: "E-commerce Storefront", imgSrc: "https://placehold.co/300x200.png", hint: "online store", isPremium: true, price: 2000 }, // $20.00
  { id: "t3", name: "Restaurant Landing", imgSrc: "https://placehold.co/300x200.png", hint: "restaurant food", isPremium: false },
  { id: "t4", name: "Startup Agency", imgSrc: "https://placehold.co/300x200.png", hint: "business office", isPremium: true, price: 1500 }, // $15.00
  { id: "t5", name: "Blog Minimal", imgSrc: "https://placehold.co/300x200.png", hint: "writing blog", isPremium: false },
  { id: "t6", name: "Photography Showcase", imgSrc: "https://placehold.co/300x200.png", hint: "camera photography", isPremium: false },
  { id: "t7", name: "SaaS Product Page", imgSrc: "https://placehold.co/300x200.png", hint: "software interface", isPremium: true, price: 2500 }, // $25.00
  { id: "t8", name: "Real Estate Listing", imgSrc: "https://placehold.co/300x200.png", hint: "modern house", isPremium: false },
  { id: "t9", name: "Fitness Trainer Site", imgSrc: "https://placehold.co/300x200.png", hint: "gym workout", isPremium: false },
  { id: "t10", name: "Event Invitation", imgSrc: "https://placehold.co/300x200.png", hint: "party invitation", isPremium: true, price: 500 }, // $5.00
  { id: "t11", name: "Non-Profit Organization", imgSrc: "https://placehold.co/300x200.png", hint: "community help", isPremium: false },
  { id: "t12", name: "Educational Course", imgSrc: "https://placehold.co/300x200.png", hint: "online learning", isPremium: false },
];

export function TemplateGalleryModal({ isOpen, onOpenChange }: TemplateGalleryModalProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [processingPaymentFor, setProcessingPaymentFor] = useState<string | null>(null);

  const handleTemplateAction = async (template: (typeof templates)[0]) => {
    if (!session?.user?.id) {
      toast({ title: "Not Authenticated", description: "Please log in to use or purchase templates.", variant: "destructive" });
      return;
    }

    const hasPurchased = session.user.purchasedTemplateIds?.includes(template.id);

    if (template.isPremium && !hasPurchased) {
      // Initiate payment for premium template
      setProcessingPaymentFor(template.id);
      const result = await createOneTimePaymentIntent(template.price!, 'usd', undefined, {
        userId: session.user.id,
        templateId: template.id,
        templateName: template.name,
        description: `Purchase of template: ${template.name}`, // For Stripe dashboard
      });
      setProcessingPaymentFor(null);

      if (result.error) {
        toast({ title: "Payment Error", description: result.error, variant: "destructive" });
      } else if (result.clientSecret) {
        toast({
          title: "Payment Intent Created",
          description: `To complete purchase of "${template.name}", integrate Stripe Elements with client secret: ${result.clientSecret.substring(0,40)}...`,
          duration: 10000,
        });
        // In a real app, you'd navigate to a checkout page or use Stripe Elements here
        // For now, we log and the webhook will handle granting access after payment success
        console.log("Stripe PaymentIntent Client Secret for template purchase:", result.clientSecret);
        // onOpenChange(false); // Optionally close modal or wait for payment completion
      }
    } else {
      // Use free template or already purchased premium template
      console.log(`Using template: ${template.name}`);
      toast({ title: "Template Selected", description: `You are now using the "${template.name}" template. (Conceptual)` });
      onOpenChange(false);
    }
  };

  const isLoading = status === 'loading';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-foreground">Template Gallery</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a pre-made template to start building your website.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {templates.map((template) => {
                const hasPurchased = session?.user?.purchasedTemplateIds?.includes(template.id);
                const isProcessingThis = processingPaymentFor === template.id;
                let buttonText = "Use Template";
                let buttonAction = () => handleTemplateAction(template);
                let buttonDisabled = isProcessingThis;

                if (template.isPremium && !hasPurchased) {
                  buttonText = `Buy for $${(template.price! / 100).toFixed(2)}`;
                }

                return (
                  <Card key={template.id} className="overflow-hidden bg-card border-border hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader className="p-0 relative">
                      <Image
                        src={template.imgSrc}
                        alt={template.name}
                        width={300}
                        height={200}
                        className="w-full h-auto object-cover"
                        data-ai-hint={template.hint}
                      />
                      {template.isPremium && (
                        <Badge variant={hasPurchased ? "default" : "destructive"} className="absolute top-2 right-2">
                          {hasPurchased ? "Purchased" : "Premium"}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                      <CardTitle className="text-md font-headline text-card-foreground">{template.name}</CardTitle>
                      {template.isPremium && !hasPurchased && (
                        <p className="text-sm font-semibold text-primary mt-1">
                          Price: ${(template.price! / 100).toFixed(2)}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 mt-auto">
                      <Button 
                        size="sm" 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={buttonAction}
                        disabled={buttonDisabled}
                      >
                        {isProcessingThis ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (template.isPremium && !hasPurchased) ? (
                          <ShoppingCart className="mr-2 h-4 w-4" />
                        ) : null}
                        {isProcessingThis ? "Processing..." : buttonText}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
