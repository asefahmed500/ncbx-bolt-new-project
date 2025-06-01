"use client";

import { useState, type FormEvent } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateWebsiteCopy, type GenerateWebsiteCopyInput } from '@/ai/flows/generate-website-copy';
import { Loader2 } from 'lucide-react';

interface AiCopyModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const copyStyles = ["Professional", "Casual", "Friendly", "Persuasive", "Playful", "Formal", "Humorous"];

export function AiCopyModal({ isOpen, onOpenChange }: AiCopyModalProps) {
  const [websiteSection, setWebsiteSection] = useState('');
  const [keywords, setKeywords] = useState('');
  const [style, setStyle] = useState(copyStyles[0]);
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!websiteSection || !keywords || !style) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields to generate copy.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGeneratedCopy('');

    try {
      const input: GenerateWebsiteCopyInput = { websiteSection, keywords, style };
      const result = await generateWebsiteCopy(input);
      setGeneratedCopy(result.copySuggestions);
      toast({
        title: "Copy Generated!",
        description: "Your website copy suggestions are ready.",
      });
    } catch (error) {
      console.error("Error generating website copy:", error);
      toast({
        title: "Error",
        description: "Failed to generate website copy. Please try again.",
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
          <DialogTitle className="font-headline text-foreground">AI Copy Suggestions</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Generate compelling content for different sections of your website.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="websiteSection" className="text-foreground">Website Section</Label>
            <Input
              id="websiteSection"
              value={websiteSection}
              onChange={(e) => setWebsiteSection(e.target.value)}
              placeholder="e.g., Homepage Hero, About Us Mission"
              className="bg-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="keywords" className="text-foreground">Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., innovative, AI, solutions"
              className="bg-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="style" className="text-foreground">Tone/Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger id="style" className="w-full bg-input text-foreground">
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {copyStyles.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {generatedCopy && (
            <div className="grid gap-2">
              <Label htmlFor="generatedCopy" className="text-foreground">Generated Copy</Label>
              <Textarea
                id="generatedCopy"
                value={generatedCopy}
                readOnly
                rows={6}
                className="bg-input text-foreground"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate Copy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
