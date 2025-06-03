
"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCouponsForAdmin } from '@/actions/admin';
import type { ICoupon } from '@/models/Coupon';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, PlusCircle, Tag, Edit, Trash2, Percent, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const ITEMS_PER_PAGE = 10;

export default function AdminCouponsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchCoupons(currentPage);
    }
  }, [currentPage, status, session]);

  const fetchCoupons = async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCouponsForAdmin(page, ITEMS_PER_PAGE);
      if (result.error) {
        setError(result.error);
        setCoupons([]);
      } else if (result.coupons && result.totalCoupons !== undefined) {
        setCoupons(result.coupons);
        setTotalPages(Math.ceil(result.totalCoupons / ITEMS_PER_PAGE));
      }
    } catch (e: any) {
      setError('An unexpected error occurred.');
      console.error("Fetch Coupons Error:", e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(newPage);
  };

  const updateUrlParams = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    router.push(`/admin/coupons?${params.toString()}`);
  };

  const formatDiscountValue = (coupon: ICoupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    }
    if (coupon.discountType === 'fixed_amount') {
      return `$${(coupon.discountValue / 100).toFixed(2)}`;
    }
    return coupon.discountValue;
  };

  if (status === 'loading' || (isLoading && coupons.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null; 
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-headline font-semibold">Manage Coupons</h1>
        <Link href="/admin/coupons/create">
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Coupon
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive border border-destructive rounded-md flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      )}

      {coupons.length === 0 && !isLoading && !error && (
        <p className="text-muted-foreground text-center py-8">No coupons found. Start by creating a new coupon.</p>
      )}

      {coupons.length > 0 && (
        <div className="overflow-x-auto bg-card p-1 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Usage (Used/Limit)</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon._id as string}>
                  <TableCell className="font-medium">
                    <Tag className="inline-block h-4 w-4 mr-1 text-muted-foreground" />{coupon.code}
                  </TableCell>
                  <TableCell className="font-semibold text-primary">{formatDiscountValue(coupon)}</TableCell>
                  <TableCell className="capitalize">
                    {coupon.discountType === 'percentage' ? <Percent className="inline-block h-4 w-4 mr-1 text-blue-500" /> : <DollarSign className="inline-block h-4 w-4 mr-1 text-green-500" />}
                    {coupon.discountType.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.isActive ? 'default' : 'destructive'}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {coupon.timesUsed} / {coupon.usageLimit === 0 ? 'Unlimited' : coupon.usageLimit}
                  </TableCell>
                  <TableCell>
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>{new Date(coupon.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button asChild variant="outline" size="icon" className="h-8 w-8">
                      <Link href={`/admin/coupons/edit/${coupon._id}`} title="Edit Coupon (Conceptual)">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Coupon</span>
                      </Link>
                    </Button>
                     <Button variant="destructive" size="icon" className="h-8 w-8" disabled title="Delete Coupon (Conceptual)">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Coupon</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
