
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createWebsite, type CreateWebsiteInput, createWebsiteFromPrompt, type CreateWebsiteFromPromptInput } from '@/actions/website';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, PlusSquare, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// Schema for the manual creation form
const createManualFormSchema = z.object({
  name: z.string().min(3, "Website name must be at least 3 characters.").max(100),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters.")
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Subdomain must be lowercase alphanumeric with hyphens.")
    .optional()
    .or(z.literal('')),
});
type CreateManualFormValues = z.infer<typeof createManualFormSchema>;

// Schema for the AI creation form
const createAiFormSchema = z.object({
  name: z.string().min(3, "Website name must be at least 3 characters.").max(100),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters.")
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Subdomain must be lowercase alphanumeric with hyphens.")
    .optional()
    .or(z.literal('')),
  prompt: z.string().min(10, "Prompt must be at least 10 characters.").max(500),
});
type CreateAiFormValues = z.infer<typeof createAiFormSchema>;


export default function CreateWebsitePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const manualForm = useForm<CreateManualFormValues>({
    resolver: zodResolver(createManualFormSchema),
    defaultValues: { name: '', subdomain: '' },
  });

  const aiForm = useForm<CreateAiFormValues>({
    resolver: zodResolver(createAiFormSchema),
    defaultValues: { name: '', subdomain: '', prompt: '' },
  });

  const onManualSubmit = async (data: CreateManualFormValues) => {
    setIsManualLoading(true);
    const inputData: CreateWebsiteInput = {
        name: data.name,
        subdomain: data.subdomain || undefined,
    };
    try {
      const result = await createWebsite(inputData);
      if (result.error) {
        toast({ title: 'Error Creating Website', description: result.error, variant: 'destructive' });
      } else if (result.success && result.website) {
        toast({ title: 'Website Created!', description: `Your new website "${result.website.name}" is ready.` });
        router.push('/dashboard');
      }
    } catch (error) {
      toast({ title: 'Failed to Create Website', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsManualLoading(false);
    }
  };

  const onAiSubmit = async (data: CreateAiFormValues) => {
    setIsAiLoading(true);
    const inputData: CreateWebsiteFromPromptInput = {
      name: data.name,
      subdomain: data.subdomain || undefined,
      prompt: data.prompt,
    };
     toast({ title: 'Generating Website...', description: 'The AI is building your website. This may take a moment.', duration: 15000 });
    try {
      const result = await createWebsiteFromPrompt(inputData);
      if (result.error) {
        toast({ title: 'AI Generation Failed', description: result.error, variant: 'destructive', duration: 10000 });
      } else if (result.success && result.website) {
        toast({ title: 'AI Website Created!', description: `Your new website "${result.website.name}" is ready to be edited.`, duration: 10000 });
        router.push(`/editor?websiteId=${result.website._id}`); // Redirect to editor to see the result
      }
    } catch (error) {
      toast({ title: 'Failed to Create Website with AI', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 flex justify-center items-start min-h-[calc(100vh-150px)]">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <Button variant="ghost" size="sm" className="absolute left-4 top-4 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
          </Button>
          <CardTitle className="text-2xl font-headline text-center pt-8">Create New Website</CardTitle>
          <CardDescription className="text-center">
            Start from scratch or let our AI build the foundation for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual"><PlusSquare className="mr-2 h-4 w-4" />Create Manually</TabsTrigger>
              <TabsTrigger value="ai"><Wand2 className="mr-2 h-4 w-4" />Create with AI</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="pt-6">
              <Form {...manualForm}>
                <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-6">
                  <FormField control={manualForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Website Name</FormLabel><FormControl><Input placeholder="My Awesome Project" {...field} className="bg-input" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={manualForm.control} name="subdomain" render={({ field }) => (
                    <FormItem><FormLabel>Subdomain (Optional)</FormLabel><FormControl>
                      <div className="flex items-center">
                        <Input placeholder="my-project" {...field} className="bg-input rounded-r-none" />
                        <span className="px-3 py-2 text-sm bg-muted border border-input border-l-0 rounded-r-md text-muted-foreground">.{process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || 'notthedomain.com'}</span>
                      </div>
                    </FormControl><p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate.</p><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isManualLoading}>
                    {isManualLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusSquare className="mr-2 h-4 w-4" />}
                    {isManualLoading ? 'Creating...' : 'Create Website'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="ai" className="pt-6">
              <Form {...aiForm}>
                <form onSubmit={aiForm.handleSubmit(onAiSubmit)} className="space-y-6">
                   <FormField control={aiForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Website Name</FormLabel><FormControl><Input placeholder="e.g., Jane's Bakery" {...field} className="bg-input" /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={aiForm.control} name="subdomain" render={({ field }) => (
                    <FormItem><FormLabel>Subdomain (Optional)</FormLabel><FormControl>
                      <div className="flex items-center">
                        <Input placeholder="janes-bakery" {...field} className="bg-input rounded-r-none" />
                        <span className="px-3 py-2 text-sm bg-muted border border-input border-l-0 rounded-r-md text-muted-foreground">.{process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || 'notthedomain.com'}</span>
                      </div>
                    </FormControl><p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate.</p><FormMessage /></FormItem>
                  )} />
                  <FormField control={aiForm.control} name="prompt" render={({ field }) => (
                    <FormItem><FormLabel>Describe Your Website</FormLabel><FormControl>
                      <Textarea placeholder="e.g., A modern and clean website for my new bakery in San Francisco called 'Jane's Bakery'. I want a homepage with a large hero image, a section for my products like cakes and cookies, and a contact page with a map." {...field} className="bg-input" rows={5} />
                    </FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isAiLoading}>
                    {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {isAiLoading ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
