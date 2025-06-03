
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { updateUserProfile, type UpdateUserProfileInput } from '@/actions/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCircle, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const profileFormSchema = z.object({
  name: z.string().max(100, "Name cannot exceed 100 characters.").optional().or(z.literal('')),
  avatarUrl: z.string().url("Please enter a valid URL for the avatar.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      avatarUrl: '',
    },
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      form.reset({
        name: session.user.name || '',
        avatarUrl: session.user.avatarUrl || '',
      });
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [session, status, form, router]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    const updateData: UpdateUserProfileInput = {};
    if (data.name !== session?.user?.name && data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.avatarUrl !== session?.user?.avatarUrl && data.avatarUrl !== undefined) {
      updateData.avatarUrl = data.avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
        toast({ title: "No Changes", description: "No information was changed." });
        setIsLoading(false);
        return;
    }

    try {
      const result = await updateUserProfile(updateData);
      if (result.error) {
        toast({
          title: 'Error Updating Profile',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result.success && result.user) {
        toast({
          title: 'Profile Updated!',
          description: 'Your profile has been successfully updated.',
        });
        // Update the session to reflect changes immediately
        await updateSession({
            user: {
                ...session?.user,
                name: result.user.name,
                avatarUrl: result.user.avatarUrl,
            }
        });
        form.reset({ // Re-sync form with potentially new session data (though result.user should be source of truth)
          name: result.user.name || '',
          avatarUrl: result.user.avatarUrl || '',
        });
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast({
        title: 'Failed to Update Profile',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 flex justify-center items-start min-h-[calc(100vh-150px)]">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <Button variant="ghost" size="sm" className="absolute left-4 top-4 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <CardTitle className="text-2xl font-headline text-center pt-8 flex items-center justify-center">
            <UserCircle className="mr-3 h-8 w-8 text-primary" />
            Manage Your Profile
          </CardTitle>
          <CardDescription className="text-center">
            Update your personal information. Your email <code className="bg-muted px-1 py-0.5 rounded text-sm">{session.user.email}</code> cannot be changed here.
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
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} className="bg-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com/avatar.png" {...field} className="bg-input" />
                    </FormControl>
                     <p className="text-xs text-muted-foreground mt-1">
                        Enter a URL to an image for your profile picture.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.getValues("avatarUrl") && (
                <div className="flex justify-center">
                    <img
                        src={form.getValues("avatarUrl")}
                        alt="Avatar Preview"
                        className="h-24 w-24 rounded-full object-cover border"
                        data-ai-hint="person avatar"
                        onError={(e) => e.currentTarget.style.display='none'} // Hide if image fails to load
                    />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || !form.formState.isDirty}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Changes to your name and avatar will be reflected across the platform.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
