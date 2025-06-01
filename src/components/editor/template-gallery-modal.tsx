
"use client";

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

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const templates = [
  { id: "t1", name: "Modern Portfolio", imgSrc: "https://placehold.co/300x200.png", hint:"portfolio website" },
  { id: "t2", name: "E-commerce Storefront", imgSrc: "https://placehold.co/300x200.png", hint: "online store" },
  { id: "t3", name: "Restaurant Landing", imgSrc: "https://placehold.co/300x200.png", hint: "restaurant food" },
  { id: "t4", name: "Startup Agency", imgSrc: "https://placehold.co/300x200.png", hint: "business office" },
  { id: "t5", name: "Blog Minimal", imgSrc: "https://placehold.co/300x200.png", hint: "writing blog" },
  { id: "t6", name: "Photography Showcase", imgSrc: "https://placehold.co/300x200.png", hint: "camera photography" },
  { id: "t7", name: "SaaS Product Page", imgSrc: "https://placehold.co/300x200.png", hint: "software interface" },
  { id: "t8", name: "Real Estate Listing", imgSrc: "https://placehold.co/300x200.png", hint: "modern house" },
  { id: "t9", name: "Fitness Trainer Site", imgSrc: "https://placehold.co/300x200.png", hint: "gym workout" },
  { id: "t10", name: "Event Invitation", imgSrc: "https://placehold.co/300x200.png", hint: "party invitation" },
  { id: "t11", name: "Non-Profit Organization", imgSrc: "https://placehold.co/300x200.png", hint: "community help" },
  { id: "t12", name: "Educational Course", imgSrc: "https://placehold.co/300x200.png", hint: "online learning" },
];

export function TemplateGalleryModal({ isOpen, onOpenChange }: TemplateGalleryModalProps) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {templates.map((template) => (
              <Card key={template.id} className="overflow-hidden bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <Image
                    src={template.imgSrc}
                    alt={template.name}
                    width={300}
                    height={200}
                    className="w-full h-auto object-cover"
                    data-ai-hint={template.hint}
                  />
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-md font-headline text-card-foreground">{template.name}</CardTitle>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    size="sm" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      console.log(`Using template: ${template.name}`);
                      onOpenChange(false);
                    }}
                  >
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
