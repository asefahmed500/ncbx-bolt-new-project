
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
import { createTemplate } from '@/actions/templates'; // You'll create this action
import { Loader2 } from 'lucide-react';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // In a real app, you'd pass the current website design data here
  // currentDesignData?: any; 
}

export function SaveTemplateModal({ isOpen, onOpenChange }: SaveTemplateModalProps) {
  const { data: session } = useSession();
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
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

    setIsLoading(true);

    // MOCK DATA: In a real implementation, this would come from the editor's current state
    const mockPagesData = [
      {
        name: "Homepage",
        slug: "/",
        elements: [
          { type: "heading", config: { level: "h1", text: "Welcome to My Template" }, order: 0 },
          { type: "text", config: { htmlContent: "<p>This is a sample paragraph for the template.</p>" }, order: 1 },
        ],
      },
    ];

    try {
      const result = await createTemplate({
        name: templateName,
        description: templateDescription,
        // For now, using mock pages data. Ideally, this would be serialized from the editor.
        pages: mockPagesData, 
        // Other fields like previewImageUrl, category, tags, isPremium, price would be set here
        // or through a more complex form if needed.
        // For user-submitted templates, isPremium would likely be false by default.
        isPremium: false, 
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
          <DialogTitle className="font-headline text-foreground">Save Design as Template</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share your design with others or reuse it for future projects. It will be submitted for approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="templateName" className="text-foreground">Template Name</Label>
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
            <Label htmlFor="templateDescription" className="text-foreground">Description (Optional)</Label>
            <Textarea
              id="templateDescription"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="A brief description of your template..."
              className="bg-input text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
          </div>
          {/* Add fields for category, tags, preview image upload if desired */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit for Approval
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
