
"use client";

import { useState, useMemo } from 'react';
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
import { Loader2, ShoppingCart, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// In a real app, this data would come from a database
const templates = [
  { id: "t1", name: "Modern Portfolio", category: "Portfolio", imgSrc: "https://placehold.co/300x200.png", hint:"portfolio website", isPremium: false },
  { id: "t2", name: "E-commerce Storefront", category: "E-commerce", imgSrc: "https://placehold.co/300x200.png", hint: "online store", isPremium: true, price: 2000 }, // $20.00
  { id: "t3", name: "Restaurant Landing", category: "Business", imgSrc: "https://placehold.co/300x200.png", hint: "restaurant food", isPremium: false },
  { id: "t4", name: "Startup Agency", category: "Business", imgSrc: "https://placehold.co/300x200.png", hint: "business office", isPremium: true, price: 1500 }, // $15.00
  { id: "t5", name: "Blog Minimal", category: "Blog", imgSrc: "https://placehold.co/300x200.png", hint: "writing blog", isPremium: false },
  { id: "t6", name: "Photography Showcase", category: "Portfolio", imgSrc: "https://placehold.co/300x200.png", hint: "camera photography", isPremium: false },
  { id: "t7", name: "SaaS Product Page", category: "Business", imgSrc: "https://placehold.co/300x200.png", hint: "software interface", isPremium: true, price: 2500 }, // $25.00
  { id: "t8", name: "Real Estate Listing", category: "Business", imgSrc: "https://placehold.co/300x200.png", hint: "modern house", isPremium: false },
  { id: "t9", name: "Fitness Trainer Site", category: "Portfolio", imgSrc: "https://placehold.co/300x200.png", hint: "gym workout", isPremium: false },
  { id: "t10", name: "Event Invitation", category: "Other", imgSrc: "https://placehold.co/300x200.png", hint: "party invitation", isPremium: true, price: 500 }, // $5.00
  { id: "t11", name: "Non-Profit Organization", category: "Other", imgSrc: "https://placehold.co/300x200.png", hint: "community help", isPremium: false },
  { id: "t12", name: "Educational Course", category: "Other", imgSrc: "https://placehold.co/300x200.png", hint: "online learning", isPremium: false },
];

export function TemplateGalleryModal({ isOpen, onOpenChange }: TemplateGalleryModalProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [processingPaymentFor, setProcessingPaymentFor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [premiumFilter, setPremiumFilter] = useState<"all" | "free" | "premium">("all");

  const uniqueCategories = useMemo(() => {
    const categories = new Set(templates.map(t => t.category).filter(Boolean));
    return ["all", ...Array.from(categories)];
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearchTerm = template.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
      const matchesPremiumFilter =
        premiumFilter === "all" ||
        (premiumFilter === "free" && !template.isPremium) ||
        (premiumFilter === "premium" && template.isPremium);
      
      return matchesSearchTerm && matchesCategory && matchesPremiumFilter;
    });
  }, [searchTerm, selectedCategory, premiumFilter]);

  const handleTemplateAction = async (template: (typeof templates)[0]) => {
    if (!session?.user?.id) {
      toast({ title: "Not Authenticated", description: "Please log in to use or purchase templates.", variant: "destructive" });
      return;
    }

    const hasPurchased = session.user.purchasedTemplateIds?.includes(template.id);

    if (template.isPremium && !hasPurchased) {
      setProcessingPaymentFor(template.id);
      const result = await createOneTimePaymentIntent(template.price!, 'usd', undefined, {
        userId: session.user.id,
        templateId: template.id,
        templateName: template.name,
        description: `Purchase of template: ${template.name}`,
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
        console.log("Stripe PaymentIntent Client Secret for template purchase:", result.clientSecret);
      }
    } else {
      console.log(`Using template: ${template.name}`);
      toast({ title: "Template Selected", description: `You are now using the "${template.name}" template. (Conceptual)` });
      onOpenChange(false);
    }
  };

  const isLoading = status === 'loading';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-foreground">Template Gallery</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a pre-made template to start building your website.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 px-1 py-2 border-b border-border">
          <div>
            <Label htmlFor="template-search" className="text-sm font-medium text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="template-search"
                type="search"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-input"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="template-category" className="text-sm font-medium text-muted-foreground">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="template-category" className="bg-input">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="template-premium" className="text-sm font-medium text-muted-foreground">Type</Label>
            <Select value={premiumFilter} onValueChange={(value) => setPremiumFilter(value as "all" | "free" | "premium")}>
              <SelectTrigger id="template-premium" className="bg-input">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[55vh] pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
              <Search className="w-16 h-16 mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No Templates Found</p>
              <p className="text-sm">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {filteredTemplates.map((template) => {
                const hasPurchased = session?.user?.purchasedTemplateIds?.includes(template.id);
                const isProcessingThis = processingPaymentFor === template.id;
                let buttonText = "Use Template";
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
                        className="w-full h-auto object-cover aspect-[3/2]"
                        data-ai-hint={template.hint}
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
                        onClick={() => handleTemplateAction(template)}
                        disabled={isProcessingThis}
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
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
