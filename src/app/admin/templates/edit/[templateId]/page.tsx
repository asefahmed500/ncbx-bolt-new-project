
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  getTemplateDataForExport, 
  updateTemplateMetadataByAdmin, 
  updateTemplateStatusByAdmin,
  type UpdateTemplateMetadataInput,
  type UpdateTemplateStatusInput
} from '@/actions/admin';
import type { ITemplate, TemplateStatus } from '@/models/Template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const editTemplateFormSchema = z.object({
  name: z.string().min(1, "Name cannot be empty.").max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')), // Comma-separated string for input
  isPremium: z.boolean(),
  price: z.number().min(0, "Price must be non-negative.").optional(),
  previewImageUrl: z.string().url("Invalid URL for preview image.").optional().or(z.literal('')),
  liveDemoUrl: z.string().url("Invalid URL for live demo.").optional().or(z.literal('')),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected']),
}).refine(data => {
    if (data.isPremium && (data.price === undefined || data.price < 0)) {
        return false; // Price must be set and non-negative if premium
    }
    return true;
}, {
    message: "Price is required and must be non-negative for premium templates.",
    path: ["price"],
});

type EditTemplateFormValues = z.infer<typeof editTemplateFormSchema>;

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.templateId as string;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [templateData, setTemplateData] = useState<ITemplate | null>(null);
  const [isFetchingTemplate, setIsFetchingTemplate] = useState(true);

  const form = useForm<EditTemplateFormValues>({
    resolver: zodResolver(editTemplateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      tags: '',
      isPremium: false,
      price: 0,
      previewImageUrl: '',
      liveDemoUrl: '',
      status: 'draft',
    },
  });

  useEffect(() => {
    if (templateId) {
      const fetchTemplate = async () => {
        setIsFetchingTemplate(true);
        const result = await getTemplateDataForExport(templateId); // Using existing action
        if (result.error || !result.template) {
          toast({ title: "Error", description: result.error || "Template not found.", variant: "destructive" });
          router.push('/admin/templates');
        } else {
          setTemplateData(result.template);
          form.reset({
            name: result.template.name,
            description: result.template.description || '',
            category: result.template.category || '',
            tags: result.template.tags?.join(', ') || '',
            isPremium: result.template.isPremium,
            price: result.template.price !== undefined ? result.template.price / 100 : 0, // Assuming stored in cents
            previewImageUrl: result.template.previewImageUrl || '',
            liveDemoUrl: result.template.liveDemoUrl || '',
            status: result.template.status,
          });
        }
        setIsFetchingTemplate(false);
      };
      fetchTemplate();
    }
  }, [templateId, router, toast, form]);

  const onSubmit = async (data: EditTemplateFormValues) => {
    setIsLoading(true);
    
    const metadataPayload: UpdateTemplateMetadataInput = {
      templateId,
      name: data.name,
      description: data.description,
      category: data.category,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      isPremium: data.isPremium,
      price: data.isPremium && data.price !== undefined ? Math.round(data.price * 100) : undefined,
      previewImageUrl: data.previewImageUrl,
      liveDemoUrl: data.liveDemoUrl,
    };

    const statusPayload: UpdateTemplateStatusInput = {
      templateId,
      status: data.status,
    };

    let metadataSuccess = false;
    let statusSuccess = false;

    const metaResult = await updateTemplateMetadataByAdmin(metadataPayload);
    if (metaResult.error) {
      toast({ title: "Error Updating Metadata", description: metaResult.error, variant: "destructive" });
    } else {
      toast({ title: "Metadata Updated!", description: `Template "${metaResult.template?.name}" metadata saved.` });
      metadataSuccess = true;
    }

    // Only update status if it has changed from the original template data
    if (templateData && data.status !== templateData.status) {
        const statusResult = await updateTemplateStatusByAdmin(statusPayload);
        if (statusResult.error) {
        toast({ title: "Error Updating Status", description: statusResult.error, variant: "destructive" });
        } else {
        toast({ title: "Status Updated!", description: `Template "${statusResult.template?.name}" status changed to ${data.status}.` });
        statusSuccess = true;
        }
    } else {
        statusSuccess = true; // No change needed, consider it successful
    }


    if (metadataSuccess && statusSuccess) {
      router.push('/admin/templates');
    }
    setIsLoading(false);
  };

  if (isFetchingTemplate) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!templateData) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 flex justify-center">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader>
           <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-headline">Edit Template: {templateData.name}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/templates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
              </Link>
            </Button>
          </div>
          <CardDescription>Modify the metadata and status of this template. Content editing is done via re-submission.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Template" {...field} className="bg-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief description..." {...field} className="bg-input" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Business, Portfolio" {...field} className="bg-input" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="bg-input capitalize">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
              </div>
               <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., modern, minimal, dark-theme" {...field} className="bg-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="previewImageUrl"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Preview Image URL</FormLabel>
                        <FormControl>
                        <Input type="url" placeholder="https://example.com/image.png" {...field} className="bg-input" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="liveDemoUrl"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Live Demo URL</FormLabel>
                        <FormControl>
                        <Input type="url" placeholder="https://example.com/demo" {...field} className="bg-input" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                 <FormField
                    control={form.control}
                    name="isPremium"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm space-x-3">
                        <div className="space-y-0.5">
                        <FormLabel>Premium Template</FormLabel>
                        <FormDescription>
                            Is this a paid template?
                        </FormDescription>
                        </div>
                        <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (!checked) {
                                    form.setValue('price', 0); // Reset price if not premium
                                }
                            }}
                        />
                        </FormControl>
                    </FormItem>
                    )}
                />
                {form.watch("isPremium") && (
                    <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 19.99" {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))} 
                            className="bg-input" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
               </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground">
                Note: Editing template content (pages, elements) requires re-submitting the template through the user-facing editor. This form only updates metadata and status.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
