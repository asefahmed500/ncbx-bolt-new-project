
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createWebsite, type CreateWebsiteInput } from '@/actions/website';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, PlusSquare } from 'lucide-react';
import Link from 'next/link';

const createWebsiteFormSchema = z.object({
  name: z.string().min(3, "Website name must be at least 3 characters.").max(100),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters.")
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Subdomain must be lowercase alphanumeric with hyphens.")
    .optional()
    .or(z.literal('')), // Allow empty string for auto-generation
  // templateId: z.string().optional(), // Future: Add template selection
});

type CreateWebsiteFormValues = z.infer<typeof createWebsiteFormSchema>;

export default function CreateWebsitePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateWebsiteFormValues>({
    resolver: zodResolver(createWebsiteFormSchema),
    defaultValues: {
      name: '',
      subdomain: '',
    },
  });

  const onSubmit = async (data: CreateWebsiteFormValues) => {
    setIsLoading(true);

    const inputData: CreateWebsiteInput = {
        name: data.name,
        subdomain: data.subdomain || undefined, // Pass undefined if empty for auto-generation
        // templateId: data.templateId || undefined, // Pass templateId if selected
    };

    try {
      const result = await createWebsite(inputData);
      if (result.error) {
        toast({
          title: 'Error Creating Website',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result.success && result.website) {
        toast({
          title: 'Website Created!',
          description: `Your new website "${result.website.name}" is ready.`,
        });
        // TODO: Consider redirecting to the editor for the new website: router.push(`/editor?websiteId=${result.website._id}`);
        router.push('/dashboard'); 
      }
    } catch (error) {
      console.error("Create website error:", error);
      toast({
        title: 'Failed to Create Website',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 flex justify-center items-start min-h-[calc(100vh-150px)]">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader>
          <Button variant="ghost" size="sm" className="absolute left-4 top-4 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <CardTitle className="text-2xl font-headline text-center pt-8">Create New Website</CardTitle>
          <CardDescription className="text-center">
            Give your new website a name. You can also suggest a subdomain or let us generate one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Project" {...field} className="bg-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subdomain (Optional)</FormLabel>
                    <FormControl>
                        <div className="flex items-center">
                         <Input placeholder="my-project" {...field} className="bg-input rounded-r-none" />
                         <span className="px-3 py-2 text-sm bg-muted border border-input border-l-0 rounded-r-md text-muted-foreground">
                           .{process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || 'notthedomain.com'}
                         </span>
                        </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                        Leave blank to auto-generate. Example: <code>my-project.notthedomain.com</code>
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Future: Template Selection Dropdown */}
              {/* 
              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start with a Template (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-input">
                          <SelectValue placeholder="Select a template or start blank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Start Blank</SelectItem>
                        // Populate with fetched templates
                        <SelectItem value="template_id_1">Portfolio Template</SelectItem>
                        <SelectItem value="template_id_2">Business Template</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusSquare className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Creating Website...' : 'Create Website'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    