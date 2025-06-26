
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getApprovedTemplates } from '@/actions/templates';
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Search, ExternalLink, Tags, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import type { ITemplate } from '@/models/Template';
import { PremiumTemplatePaymentModal } from './premium-template-payment-modal';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (stripeKey && !stripeKey.includes("YOUR_STRIPE_PUBLISHABLE_KEY")) {
  stripePromise = loadStripe(stripeKey);
}

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onApplyTemplate: (template: ITemplate) => void;
}

export function TemplateGalleryModal({ isOpen, onOpenChange, onApplyTemplate }: TemplateGalleryModalProps) {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [premiumFilter, setPremiumFilter] = useState<"all" | "free" | "premium">("all");

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [templateForPurchase, setTemplateForPurchase] = useState<ITemplate | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    const result = await getApprovedTemplates({
        page: 1, 
        limit: 100, // Fetch a large number for client-side filtering
        categoryFilter: undefined, // Filtering done on client
    }); 
    if (result.error) {
        toast({ title: "Error loading templates", description: result.error, variant: "destructive" });
        setTemplates([]);
    } else if (result.templates) {
        setTemplates(result.templates);
    }
    setIsLoadingTemplates(false);
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
        fetchTemplates();
    }
  }, [isOpen, fetchTemplates]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(templates.map(t => t.category).filter(Boolean) as string[]);
    return ["all", ...Array.from(categories)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearchTerm = template.name.toLowerCase().includes(searchTerm.toLowerCase()) || (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
      const matchesPremiumFilter =
        premiumFilter === "all" ||
        (premiumFilter === "free" && !template.isPremium) ||
        (premiumFilter === "premium" && template.isPremium);
      
      return template.status === 'approved' && matchesSearchTerm && matchesCategory && matchesPremiumFilter;
    });
  }, [searchTerm, selectedCategory, premiumFilter, templates]);

  const handleTemplateAction = async (template: ITemplate) => {
    const templateIdString = (template._id as unknown as string).toString();

    if (!session?.user?.id) {
       toast({ title: "Login Required", description: "Please log in to use templates.", variant: "destructive" });
       return;
    }
    
    const hasPurchased = session.user.purchasedTemplateIds?.includes(templateIdString);

    if (template.isPremium && !hasPurchased && template.price) {
      setTemplateForPurchase(template);
      setIsPaymentModalOpen(true);
    } else {
      // Free template or already purchased premium template
      onApplyTemplate(template);
      onOpenChange(false);
    }
  };

  const onPaymentSuccess = async (purchasedTemplate: ITemplate) => {
      toast({ title: "Purchase Successful!", description: `You can now use the "${purchasedTemplate.name}" template.` });
      await updateSession({ refreshSubscription: true }); // A generic way to trigger a session refresh
      onApplyTemplate(purchasedTemplate); // Apply it to the editor
      setIsPaymentModalOpen(false); // Close payment modal
      onOpenChange(false); // Close gallery modal
  };

  const isLoadingSession = sessionStatus === 'loading';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col bg-card">
          <DialogHeader>
            <DialogTitle className="font-headline text-foreground flex items-center">
              <LayoutGrid className="mr-2 h-5 w-5" /> Template Gallery
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose an approved, pre-made template to start building your website.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 px-1 py-2 border-b border-border">
            <div>
              <Label htmlFor="template-search" className="text-sm font-medium text-muted-foreground">Search by Name or Tag</Label>
              <div className="relative mt-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="template-search" type="search" placeholder="e.g., Portfolio, modern..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 bg-input" /></div>
            </div>
            <div>
              <Label htmlFor="template-category" className="text-sm font-medium text-muted-foreground">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}><SelectTrigger id="template-category" className="bg-input capitalize mt-1"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{uniqueCategories.map(category => (<SelectItem key={category} value={category} className="capitalize">{category === "all" ? "All Categories" : category || "Uncategorized"}</SelectItem>))}</SelectContent></Select>
            </div>
            <div>
              <Label htmlFor="template-premium" className="text-sm font-medium text-muted-foreground">Type</Label>
              <Select value={premiumFilter} onValueChange={(value) => setPremiumFilter(value as "all" | "free" | "premium")}><SelectTrigger id="template-premium" className="bg-input capitalize mt-1"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent></Select>
            </div>
          </div>

          <ScrollArea className="flex-1 pr-4 -mr-4">
            {isLoadingTemplates || isLoadingSession ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10"><Search className="w-16 h-16 mb-4 text-muted-foreground/50" /><p className="text-lg font-medium">No Templates Found</p><p className="text-sm">Try adjusting your search or filter criteria.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                {filteredTemplates.map((template) => {
                  const templateIdString = (template._id as unknown as string).toString();
                  const hasPurchased = session?.user?.purchasedTemplateIds?.includes(templateIdString);
                  let buttonText = "Use Template";
                  if (template.isPremium && !hasPurchased && template.price) {
                    buttonText = `Buy for $${(template.price / 100).toFixed(2)}`;
                  }

                  return (
                    <Card key={templateIdString} className="overflow-hidden bg-card border-border hover:shadow-lg transition-shadow flex flex-col">
                      <CardHeader className="p-0 relative">
                        <Image src={template.previewImageUrl || "https://placehold.co/300x200.png"} alt={template.name} width={300} height={200} className="w-full h-auto object-cover aspect-[3/2]" data-ai-hint={(template as any).dataAiHint || template.tags?.join(" ") || template.name} />
                        {template.isPremium && (<Badge variant={hasPurchased ? "default" : "destructive"} className="absolute top-2 right-2">{hasPurchased ? "Purchased" : "Premium"}</Badge>)}
                        <Badge variant="outline" className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm capitalize">{template.category || 'General'}</Badge>
                      </CardHeader>
                      <CardContent className="p-4 flex-grow"><CardTitle className="text-md font-headline text-card-foreground">{template.name}</CardTitle>{template.isPremium && !hasPurchased && template.price && (<p className="text-sm font-semibold text-primary mt-1">Price: ${(template.price / 100).toFixed(2)}</p>)}{template.tags && template.tags.length > 0 && (<div className="mt-2 flex flex-wrap gap-1 items-center"><Tags className="w-3 h-3 text-muted-foreground mr-1" />{template.tags.slice(0, 3).map(tag => (<Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>))}{template.tags.length > 3 && <Badge variant="secondary" className="text-xs">...</Badge>}</div>)}</CardContent>
                      <CardFooter className="p-4 pt-0 mt-auto flex flex-col sm:flex-row gap-2">
                        <Button size="sm" className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => handleTemplateAction(template)} disabled={isLoadingSession}>{(template.isPremium && !hasPurchased && template.price) ? <ShoppingCart className="mr-2 h-4 w-4" /> : null}{buttonText}</Button>
                        {template.liveDemoUrl && (<Button asChild size="sm" variant="outline" className="w-full sm:flex-1"><a href={template.liveDemoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Live Demo</a></Button>)}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {templateForPurchase && stripePromise && (
         <Elements stripe={stripePromise}>
            <PremiumTemplatePaymentModal
                isOpen={isPaymentModalOpen}
                onOpenChange={setIsPaymentModalOpen}
                template={templateForPurchase}
                onPaymentSuccess={onPaymentSuccess}
            />
         </Elements>
      )}
    </>
  );
}
