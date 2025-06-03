
"use client";

import { useState, useMemo, useEffect } from 'react';
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
import { createOneTimePaymentIntent } from '@/actions/stripe'; // For purchasing premium templates
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, Search, ExternalLink, Tags, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import type { ITemplate } from '@/models/Template'; // Import ITemplate
// TODO: Fetch templates from an action. For now, using placeholders.
// import { getApprovedTemplates } from '@/actions/templates'; // Conceptual action

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onApplyTemplate: (template: ITemplate) => void; // Callback to apply template
}

// In a real app, this data would come from a database
const initialTemplatesData: ITemplate[] = [ 
  { _id: "t1", name: "Modern Portfolio", category: "Portfolio", previewImageUrl: "https://placehold.co/300x200.png", dataAiHint:"portfolio website", isPremium: false, liveDemoUrl: "https://example.com/demo/portfolio", tags: ["minimal", "creative"], status: 'approved', pages: [{ name: 'Home', slug: '/', elements: [{_id: 'el1', type: 'heading', config: {text: 'My Portfolio'}, order:0 }] }], viewCount:100, usageCount:20, createdAt: new Date(), updatedAt: new Date() } as any,
  { _id: "t2", name: "E-commerce Storefront", category: "E-commerce", previewImageUrl: "https://placehold.co/300x200.png", dataAiHint: "online store", isPremium: true, price: 2000, liveDemoUrl: "https://example.com/demo/ecommerce", tags: ["shop", "conversion"], status: 'approved', pages: [{ name: 'Home', slug: '/', elements: [{_id: 'el2', type: 'heading', config: {text: 'Welcome Shopper!'}, order:0 }] }], viewCount:250, usageCount:50, createdAt: new Date(), updatedAt: new Date() } as any,
  { _id: "t3", name: "Restaurant Landing", category: "Business", previewImageUrl: "https://placehold.co/300x200.png", dataAiHint: "restaurant food", isPremium: false, tags: ["food", "local"], status: 'approved', pages: [{ name: 'Home', slug: '/', elements: [] }], viewCount:120, usageCount:15, createdAt: new Date(), updatedAt: new Date() } as any,
  { _id: "t4", name: "Startup Agency", category: "Business", previewImageUrl: "https://placehold.co/300x200.png", dataAiHint: "business office", isPremium: true, price: 1500, tags: ["corporate", "modern"], status: 'approved', pages: [{ name: 'Home', slug: '/', elements: [] }], viewCount:300, usageCount:30, createdAt: new Date(), updatedAt: new Date() } as any,
  { _id: "t5", name: "Pending User Template", category: "User Submitted", previewImageUrl: "https://placehold.co/300x200.png", dataAiHint: "design draft", isPremium: false, tags: ["new", "pending"], status: 'pending_approval', pages: [{ name: 'Home', slug: '/', elements: [] }], viewCount:0, usageCount:0, createdAt: new Date(), updatedAt: new Date() } as any, // Example of a pending template
];

export function TemplateGalleryModal({ isOpen, onOpenChange, onApplyTemplate }: TemplateGalleryModalProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [processingPaymentFor, setProcessingPaymentFor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [premiumFilter, setPremiumFilter] = useState<"all" | "free" | "premium">("all");
  
  const [templates, setTemplates] = useState<ITemplate[]>([]); 
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  
  useEffect(() => {
    // Simulate fetching approved templates
    // In a real app, replace this with:
    // const fetchTemplates = async () => {
    //   setIsLoadingTemplates(true);
    //   const result = await getApprovedTemplates(); // Conceptual action
    //   if (result.error) {
    //     toast({ title: "Error loading templates", description: result.error, variant: "destructive" });
    //     setTemplates([]);
    //   } else if (result.templates) {
    //     setTemplates(result.templates);
    //   }
    //   setIsLoadingTemplates(false);
    // };
    // fetchTemplates();
    
    // For now, filter initial data
    setTemplates(initialTemplatesData.filter(t => t.status === 'approved'));
    setIsLoadingTemplates(false);
  }, [toast]);


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
      
      // Ensure we only show approved templates in the gallery for users to select
      return template.status === 'approved' && matchesSearchTerm && matchesCategory && matchesPremiumFilter;
    });
  }, [searchTerm, selectedCategory, premiumFilter, templates]);

  const handleTemplateAction = async (template: ITemplate) => {
    if (!session?.user?.id && !template.isPremium) { // Allow applying free templates even if not logged in (conceptual)
        onApplyTemplate(template);
        return;
    }
    if (!session?.user?.id && template.isPremium) {
       toast({ title: "Login Required", description: "Please log in to purchase premium templates.", variant: "destructive" });
       return;
    }
    
    const templateIdString = (template._id as unknown as string).toString();
    const hasPurchased = session?.user?.purchasedTemplateIds?.includes(templateIdString);

    if (template.isPremium && !hasPurchased && template.price && session?.user?.id) {
      setProcessingPaymentFor(templateIdString);
      const result = await createOneTimePaymentIntent(template.price, 'usd', undefined, {
        userId: session.user.id,
        templateId: templateIdString,
        templateName: template.name,
        description: `Purchase of template: ${template.name}`,
      });
      setProcessingPaymentFor(null);

      if (result.error) {
        toast({ title: "Payment Error", description: result.error, variant: "destructive" });
      } else if (result.clientSecret) {
        toast({
          title: "Payment Intent Created",
          description: `To complete purchase of "${template.name}", integrate Stripe Elements for card payment.`,
          duration: 10000,
        });
        // Here, a full implementation would show a Stripe Card Element modal to complete the payment.
        // After successful payment (confirmed by webhook), onApplyTemplate would be called.
        // For now, we'll simulate that a successful payment intent means they can use it for demo.
        // In a real app, onApplyTemplate should only be called after Stripe payment_intent.succeeded webhook confirms.
        // For now, let's assume the purchase will succeed and allow applying.
        // A real app would need to manage this state carefully.
        console.log("Stripe PaymentIntent Client Secret for template purchase:", result.clientSecret, "User must complete payment.");
        // A more robust flow:
        // 1. Show Stripe Elements form.
        // 2. On payment success via Elements, wait for webhook.
        // 3. Webhook updates user.purchasedTemplateIds.
        // 4. User re-opens gallery or session updates, then onApplyTemplate works without new payment.
        // For this step, we'll allow applying and then the user would need to complete the purchase flow.
        // This isn't ideal but fits the scope of not building a full payment modal here.
        onApplyTemplate(template); // Call apply, user still needs to complete payment step outside this modal.
      }
    } else {
      // Free template or already purchased premium template
      onApplyTemplate(template);
    }
  };

  const isLoadingSession = sessionStatus === 'loading';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-foreground flex items-center">
            <LayoutGrid className="mr-2 h-5 w-5" /> Template Gallery
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose an approved, pre-made template to start building your website.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 px-1 py-2 border-b border-border">
          <div>
            <Label htmlFor="template-search" className="text-sm font-medium text-muted-foreground">Search by Name or Tag</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="template-search"
                type="search"
                placeholder="e.g., Portfolio, modern..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-input"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="template-category" className="text-sm font-medium text-muted-foreground">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="template-category" className="bg-input capitalize">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category === "all" ? "All Categories" : category || "Uncategorized"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="template-premium" className="text-sm font-medium text-muted-foreground">Type</Label>
            <Select value={premiumFilter} onValueChange={(value) => setPremiumFilter(value as "all" | "free" | "premium")}>
              <SelectTrigger id="template-premium" className="bg-input capitalize">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[55vh] pr-4">
          {isLoadingTemplates || isLoadingSession ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
              <Search className="w-16 h-16 mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No Approved Templates Found</p>
              <p className="text-sm">Try adjusting your search or filter criteria, or check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {filteredTemplates.map((template) => {
                const templateIdString = (template._id as unknown as string).toString();
                const hasPurchased = session?.user?.purchasedTemplateIds?.includes(templateIdString);
                const isProcessingThis = processingPaymentFor === templateIdString;
                let buttonText = "Use Template";
                if (template.isPremium && !hasPurchased && template.price) {
                  buttonText = `Buy for $${(template.price / 100).toFixed(2)}`;
                }

                return (
                  <Card key={templateIdString} className="overflow-hidden bg-card border-border hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader className="p-0 relative">
                      <Image
                        src={template.previewImageUrl || "https://placehold.co/300x200.png"}
                        alt={template.name}
                        width={300}
                        height={200}
                        className="w-full h-auto object-cover aspect-[3/2]"
                        data-ai-hint={(template as any).dataAiHint || template.tags?.join(" ") || template.name}
                      />
                      {template.isPremium && (
                        <Badge variant={hasPurchased ? "default" : "destructive"} className="absolute top-2 right-2">
                          {hasPurchased ? "Purchased" : "Premium"}
                        </Badge>
                      )}
                       <Badge variant="outline" className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm capitalize">{template.category || 'General'}</Badge>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                      <CardTitle className="text-md font-headline text-card-foreground">{template.name}</CardTitle>
                      {template.isPremium && !hasPurchased && template.price && (
                        <p className="text-sm font-semibold text-primary mt-1">
                          Price: ${(template.price / 100).toFixed(2)}
                        </p>
                      )}
                      {template.tags && template.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 items-center">
                          <Tags className="w-3 h-3 text-muted-foreground mr-1" />
                          {template.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                          {template.tags.length > 3 && <Badge variant="secondary" className="text-xs">...</Badge>}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 mt-auto flex flex-col sm:flex-row gap-2">
                      <Button 
                        size="sm" 
                        className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => handleTemplateAction(template)}
                        disabled={isProcessingThis || isLoadingSession}
                      >
                        {isProcessingThis ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (template.isPremium && !hasPurchased && template.price) ? (
                          <ShoppingCart className="mr-2 h-4 w-4" />
                        ) : null}
                        {isProcessingThis ? "Processing..." : buttonText}
                      </Button>
                      {template.liveDemoUrl && (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="w-full sm:flex-1"
                        >
                          <a href={template.liveDemoUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Live Demo
                          </a>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Ensure IPageComponent and IWebsiteVersionPage from models are compatible and have _id
declare module '@/models/Website' {
  interface IPageComponent {
    _id?: string | import('mongoose').Types.ObjectId;
  }
  interface IWebsiteVersionPage {
    _id?: string | import('mongoose').Types.ObjectId;
  }
}
// Import mongoose for ObjectId generation if not already available
import mongoose from 'mongoose';
