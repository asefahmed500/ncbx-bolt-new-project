
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCouponByIdForAdmin, updateCouponByAdmin, type UpdateCouponInput } from '@/actions/admin';
import type { ICoupon } from '@/models/Coupon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";


const editCouponFormSchema = z.object({
  description: z.string().max(255, "Description max 255 chars").optional(),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.number().min(0, "Discount value must be non-negative."), // This will be in dollars for fixed_amount in UI
  isActive: z.boolean(),
  usageLimit: z.number().min(0, "Usage limit must be non-negative.").int(),
  userUsageLimit: z.number().min(0, "User usage limit must be non-negative.").int(),
  expiresAt: z.date().nullable().optional(),
  minPurchaseAmount: z.number().min(0, "Min purchase amount must be non-negative.").optional(), // This will be in dollars for UI
}).refine(data => {
    if (data.discountType === "percentage" && (data.discountValue < 0 || data.discountValue > 100)) {
        return false;
    }
    return true;
}, {
    message: "Percentage discount must be between 0 and 100.",
    path: ["discountValue"],
});

type EditCouponFormValues = z.infer<typeof editCouponFormSchema>;

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.couponId as string;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [couponData, setCouponData] = useState<ICoupon | null>(null);
  const [isFetchingCoupon, setIsFetchingCoupon] = useState(true);

  const form = useForm<EditCouponFormValues>({
    resolver: zodResolver(editCouponFormSchema),
    defaultValues: {
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      isActive: true,
      usageLimit: 100,
      userUsageLimit: 1,
      expiresAt: null,
      minPurchaseAmount: 0,
    },
  });

  useEffect(() => {
    if (couponId) {
      const fetchCoupon = async () => {
        setIsFetchingCoupon(true);
        const result = await getCouponByIdForAdmin(couponId);
        if (result.error || !result.coupon) {
          toast({ title: "Error", description: result.error || "Coupon not found.", variant: "destructive" });
          router.push('/admin/coupons');
        } else {
          setCouponData(result.coupon);
          form.reset({
            description: result.coupon.description || '',
            discountType: result.coupon.discountType,
            discountValue: result.coupon.discountType === 'fixed_amount' ? result.coupon.discountValue / 100 : result.coupon.discountValue,
            isActive: result.coupon.isActive,
            usageLimit: result.coupon.usageLimit,
            userUsageLimit: result.coupon.userUsageLimit,
            expiresAt: result.coupon.expiresAt ? parseISO(result.coupon.expiresAt.toString()) : null,
            minPurchaseAmount: result.coupon.minPurchaseAmount !== undefined ? result.coupon.minPurchaseAmount / 100 : 0,
          });
        }
        setIsFetchingCoupon(false);
      };
      fetchCoupon();
    }
  }, [couponId, router, toast, form]);

  const onSubmit = async (data: EditCouponFormValues) => {
    setIsLoading(true);
    
    const updatePayload: UpdateCouponInput = {
      couponId,
      description: data.description,
      discountType: data.discountType,
      // Convert to cents if fixed_amount
      discountValue: data.discountType === 'fixed_amount' ? Math.round(data.discountValue * 100) : data.discountValue,
      isActive: data.isActive,
      usageLimit: data.usageLimit,
      userUsageLimit: data.userUsageLimit,
      expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null,
      // Convert to cents
      minPurchaseAmount: data.minPurchaseAmount !== undefined ? Math.round(data.minPurchaseAmount * 100) : undefined,
    };
    
    const result = await updateCouponByAdmin(updatePayload);
    if (result.error) {
      toast({ title: "Error Updating Coupon", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Coupon Updated!", description: `Coupon "${result.coupon?.code}" has been successfully updated.` });
      router.push('/admin/coupons');
    }
    setIsLoading(false);
  };

  if (isFetchingCoupon) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!couponData) return null; 

  return (
    <div className="container mx-auto p-4 md:p-8 flex justify-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
           <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-headline">Edit Coupon: {couponData.code}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/coupons">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Coupons
              </Link>
            </Button>
          </div>
          <CardDescription>Modify the details of this coupon.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Summer Sale Special" {...field} className="bg-input" />
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
                      <Select onValueChange={(value) => {
                          field.onChange(value);
                          // Reset discountValue if type changes to percentage and current value is > 100
                          if (value === 'percentage' && form.getValues("discountValue") > 100) {
                            form.setValue("discountValue", 100);
                          }
                        }} 
                        defaultValue={field.value}>
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
                      <FormLabel>Discount Value {form.watch("discountType") === "fixed_amount" ? "($)" : "(%)"}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" 
                               placeholder={form.getValues("discountType") === "percentage" ? "e.g., 20" : "e.g., 10.00"} 
                               {...field} 
                               onChange={e => field.onChange(parseFloat(e.target.value))} 
                               className="bg-input" />
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
                        <Input type="number" placeholder="e.g., 100 (0 for unlimited)" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} className="bg-input" />
                      </FormControl>
                       <FormDescription>Total times this coupon can be used by all users.</FormDescription>
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
                        <Input type="number" placeholder="e.g., 1 (0 for unlimited)" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} className="bg-input" />
                      </FormControl>
                      <FormDescription>Max times a single user can use this coupon.</FormDescription>
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
                        <Input type="number" step="0.01" placeholder="e.g., 50.00 (0 for no minimum)" {...field} 
                               onChange={e => field.onChange(parseFloat(e.target.value))} 
                               className="bg-input" />
                      </FormControl>
                       <FormDescription>Enter the minimum purchase amount in dollars.</FormDescription>
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
                            {field.value ? format(field.value, "PPP") : <span>Pick a date, or leave blank</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => field.onChange(date || null)}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
                          initialFocus
                        />
                         <Button size="sm" variant="ghost" className="w-full" onClick={() => field.onChange(null)}>Clear Date</Button>
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
                        Inactive coupons cannot be used.
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
              <Button type="submit" className="w-full" disabled={isLoading || !form.formState.isDirty}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground">Coupon code <strong>{couponData.code}</strong> cannot be changed.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
