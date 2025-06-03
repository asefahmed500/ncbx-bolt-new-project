
"use client";

import { useState, type FormEvent } from 'react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createTemplate, type CreateTemplateInput } from '@/actions/templates';
import { Loader2, PackagePlus } from 'lucide-react';
import type { IWebsiteVersionPage, IPageComponent } from '@/models/Website'; // For currentDesignData type

interface SaveTemplateModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentDesignData?: IWebsiteVersionPage[]; // Pass the actual design data from the editor
}

export function SaveTemplateModal({ isOpen, onOpenChange, currentDesignData }: SaveTemplateModalProps) {
  const { data: session } = useSession();
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!templateName) {
      toast({
        title: "Missing fields",
        description: "Please provide a name for your template.",
        variant: "destructive",
      });
      return;
    }
    if (!session?.user?.id) {
        toast({ title: "Not Authenticated", description: "Please log in to save a template.", variant: "destructive" });
        return;
    }
    if (!currentDesignData || currentDesignData.length === 0) {
        toast({ title: "No Design Data", description: "Cannot save an empty design as a template.", variant: "destructive" });
        return;
    }

    setIsLoading(true);

    // Transform currentDesignData (IWebsiteVersionPage[]) to CreateTemplateInput['pages']
    const pagesForTemplate: CreateTemplateInput['pages'] = currentDesignData.map(page => ({
        name: page.name,
        slug: page.slug,
        elements: page.elements.map(el => ({ // Ensure elements are plain objects for Zod validation
            type: el.type,
            config: el.config, // Assuming config is already a plain object or serializable
            order: el.order,
        })),
        // seoTitle: page.seoTitle, // Add if these are part of IWebsiteVersionPage
        // seoDescription: page.seoDescription,
    }));


    try {
      const result = await createTemplate({
        name: templateName,
        description: templateDescription,
        pages: pagesForTemplate,
        category: category || undefined,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
        isPremium: false, // Default for user submissions
      });

      if (result.error) {
        toast({
          title: "Error Saving Template",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.success && result.template) {
        toast({
          title: "Template Submitted!",
          description: `"${result.template.name}" has been submitted for approval.`,
        });
        onOpenChange(false); // Close modal on success
        setTemplateName('');
        setTemplateDescription('');
        setCategory('');
        setTags('');
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-foreground flex items-center">
            <PackagePlus className="mr-2 h-5 w-5" />
            Save Design as Template
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share your current design with others or reuse it for future projects. It will be submitted for approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="templateName" className="text-foreground">Template Name *</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., My Awesome Portfolio"
              className="bg-input text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="templateDescription" className="text-foreground">Description</Label>
            <Textarea
              id="templateDescription"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="A brief description of your template..."
              className="bg-input text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="templateCategory" className="text-foreground">Category</Label>
            <Input
              id="templateCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Business, Portfolio, Blog"
              className="bg-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="templateTags" className="text-foreground">Tags (comma-separated)</Label>
            <Input
              id="templateTags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., modern, minimal, responsive"
              className="bg-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !currentDesignData || currentDesignData.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit for Approval
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
