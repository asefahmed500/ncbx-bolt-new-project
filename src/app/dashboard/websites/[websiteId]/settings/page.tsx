"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getWebsiteEditorData, setCustomDomain, verifyCustomDomain } from '@/actions/website';
import type { IWebsite } from '@/models/Website';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const domainFormSchema = z.object({
  domainName: z.string().min(3, "Domain name must be at least 3 characters.").max(253)
    .regex(/^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,63}$/, "Invalid domain name format. e.g., yourdomain.com"),
});
type DomainFormValues = z.infer<typeof domainFormSchema>;

export default function WebsiteSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const websiteId = params.websiteId as string;
  const { toast } = useToast();

  const [website, setWebsite] = useState<IWebsite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingDomain, setIsSubmittingDomain] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<DomainFormValues>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: { domainName: '' },
  });
  
  useEffect(() => {
    if (websiteId) {
      const fetchWebsite = async () => {
        setIsLoading(true);
        const result = await getWebsiteEditorData(websiteId);
        if (result.error || !result.website) {
          toast({ title: "Error", description: result.error || "Website not found.", variant: "destructive" });
          router.push('/dashboard');
        } else {
          setWebsite(result.website);
          if (result.website.customDomain) {
            form.setValue('domainName', result.website.customDomain);
          }
        }
        setIsLoading(false);
      };
      fetchWebsite();
    }
  }, [websiteId, router, toast, form]);

  const onDomainSubmit = async (data: DomainFormValues) => {
    setIsSubmittingDomain(true);
    const result = await setCustomDomain({ websiteId, domainName: data.domainName });
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if(result.success && result.website) {
      toast({ title: "Success", description: result.success });
      setWebsite(result.website);
    }
    setIsSubmittingDomain(false);
  };
  
  const handleVerifyDomain = async () => {
    setIsVerifying(true);
    const result = await verifyCustomDomain({ websiteId });
    if (result.error) {
        toast({ title: "Verification Failed", description: result.error, variant: "destructive"});
    } else if (result.success && result.website) {
        toast({ title: "Success!", description: result.success, variant: "default" });
        setWebsite(result.website);
    }
    setIsVerifying(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[calc(100vh-150px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!website) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 flex justify-center items-start min-h-[calc(100vh-150px)]">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <Button variant="ghost" size="sm" className="absolute left-4 top-4 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
          </Button>
          <CardTitle className="text-2xl font-headline text-center pt-8 flex items-center justify-center"><Globe className="mr-3 h-7 w-7 text-primary"/>Domain Settings</CardTitle>
          <CardDescription className="text-center">Manage the custom domain for your website: {website.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-8">
             <h3 className="font-semibold">Default Subdomain</h3>
             <p className="text-sm text-muted-foreground">Your site is always available at your default subdomain:</p>
             <a href={`https://${website.subdomain}.${process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || 'example.com'}`} target="_blank" rel="noopener noreferrer" className="text-primary font-mono bg-muted px-2 py-1 rounded-md text-sm break-all">
                {`https://${website.subdomain}.${process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || 'example.com'}`}
            </a>
          </div>
          <hr className="my-6"/>
          <h3 className="font-semibold mb-4">Custom Domain</h3>
          
           {website.domainStatus === 'verified' ? (
                <div className="p-4 bg-green-500/10 text-green-700 rounded-md border border-green-500/30 text-center">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-semibold">Domain Verified & Connected!</p>
                    <p className="text-sm">{website.customDomain}</p>
                </div>
            ) : (
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onDomainSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="domainName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Custom Domain</FormLabel>
                            <FormControl>
                              <Input placeholder="yourdomain.com" {...field} className="bg-input"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isSubmittingDomain || website.domainStatus === 'pending_verification'}>
                        {isSubmittingDomain && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {website.domainStatus === 'pending_verification' ? "Domain is Pending" : "Set Domain"}
                      </Button>
                    </form>
                  </Form>
            )}

            {website.domainStatus === 'pending_verification' && (
                <div className="mt-6 p-4 bg-yellow-500/10 text-yellow-700 rounded-md border border-yellow-500/30">
                    <AlertCircle className="h-5 w-5 float-left mr-3"/>
                    <h4 className="font-bold">Pending Verification</h4>
                    <p className="text-sm mt-2">{website.dnsInstructions}</p>
                    <p className="text-xs mt-3">Once you have configured your DNS records, click the button below to check them. It can take some time for DNS changes to propagate.</p>
                    <Button onClick={handleVerifyDomain} size="sm" className="mt-4" disabled={isVerifying}>
                        {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify Domain
                    </Button>
                </div>
            )}
            {website.domainStatus === 'error_dns' && (
                <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/30">
                     <AlertCircle className="h-5 w-5 float-left mr-3"/>
                    <h4 className="font-bold">DNS Configuration Error</h4>
                    <p className="text-sm mt-2">We could not verify your DNS settings. Please ensure your records match the instructions provided and try again.</p>
                </div>
            )}

        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">Custom domains are a Pro feature. Ensure your subscription is active.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
