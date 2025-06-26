
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createCoupon, type CreateCouponInput } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, PlusCircle, ArrowLeft, CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const createCouponFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(50),
  description: z.string().max(255, "Description cannot exceed 255 characters").optional(),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.number().min(0, "Discount value must be non-negative."),
  isActive: z.boolean(),
  usageLimit: z.number().min(0, "Usage limit must be non-negative.").int(),
  userUsageLimit: z.number().min(0, "Per-user limit must be non-negative.").int(),
  expiresAt: z.date().optional(),
  minPurchaseAmount: z.number().min(0, "Minimum purchase amount must be non-negative.").optional(),
}).refine(data => {
    if (data.discountType === "percentage" && (data.discountValue < 0 || data.discountValue > 100)) {
        return false;
    }
    return true;
}, {
    message: "Percentage discount must be between 0 and 100.",
    path: ["discountValue"],
});

type CreateCouponFormValues = z.infer<typeof createCouponFormSchema>;

export default function CreateCouponPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateCouponFormValues>({
    resolver: zodResolver(createCouponFormSchema),
    defaultValues: {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      isActive: true,
      usageLimit: 100,
      userUsageLimit: 1,
      minPurchaseAmount: 0,
    },
  });

  const onSubmit = async (data: CreateCouponFormValues) => {
    setIsLoading(true);
    
    // Server action expects discount value for fixed_amount in cents
    const discountValueForAction = data.discountType === 'fixed_amount' 
      ? Math.round(data.discountValue * 100) 
      : data.discountValue;
      
    const minPurchaseAmountForAction = data.minPurchaseAmount !== undefined
      ? Math.round(data.minPurchaseAmount * 100)
      : 0;

    const inputForAction: CreateCouponInput = {
      ...data,
      code: data.code.toUpperCase(),
      discountValue: discountValueForAction,
      minPurchaseAmount: minPurchaseAmountForAction,
      expiresAt: data.expiresAt?.toISOString(),
    };
    
    const result = await createCoupon(inputForAction);
    setIsLoading(false);

    if (result.error) {
      toast({
        title: 'Error Creating Coupon',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result.success && result.coupon) {
      toast({
        title: 'Coupon Created!',
        description: `Coupon "${result.coupon.code}" has been successfully created.`,
      });
      router.push('/admin/coupons');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 flex justify-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-headline">Create New Coupon</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/coupons">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Coupons
              </Link>
            </Button>
          </div>
          <CardDescription>
            Fill in the details to create a new promotional coupon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SUMMER25" {...field} className="bg-input" />
                    </FormControl>
                    <FormDescription>This is the code users will enter at checkout. Must be unique.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., 25% off all summer items" {...field} className="bg-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-input">
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Value</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="bg-input" />
                      </FormControl>
                      <FormDescription>
                        {form.watch("discountType") === "percentage" ? "Enter a value between 0 and 100." : "Enter the amount in dollars, e.g., 10.50 for $10.50."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Usage Limit</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 100" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} className="bg-input" />
                      </FormControl>
                       <FormDescription>Total times this coupon can be used by all users. 0 for unlimited.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userUsageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Per User Usage Limit</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} className="bg-input" />
                      </FormControl>
                      <FormDescription>Max times a single user can use this. 0 for unlimited.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="minPurchaseAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Purchase Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 50.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="bg-input" />
                      </FormControl>
                       <FormDescription>Minimum cart total for coupon to apply. 0 for no minimum.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiration Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-input",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Allow this coupon to be used immediately.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Create Coupon
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    