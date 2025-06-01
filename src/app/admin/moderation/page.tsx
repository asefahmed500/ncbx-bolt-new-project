
"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getModerationQueueItems } from '@/actions/admin';
import type { IModerationQueueItem } from '@/models/ModerationQueueItem';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, Eye, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const ITEMS_PER_PAGE = 10;

export default function AdminModerationPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [items, setItems] = useState<IModerationQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'pending');

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login');
    } else if (sessionStatus === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [session, sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.role === 'admin') {
      fetchModerationItems(currentPage, statusFilter);
    }
  }, [currentPage, statusFilter, sessionStatus, session]);

  const fetchModerationItems = async (page: number, currentStatus: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getModerationQueueItems(page, ITEMS_PER_PAGE, currentStatus);
      if (result.error) {
        setError(result.error);
        setItems([]);
      } else if (result.items && result.totalItems !== undefined) {
        setItems(result.items);
        setTotalPages(Math.ceil(result.totalItems / ITEMS_PER_PAGE));
      }
    } catch (e: any) {
      setError('An unexpected error occurred.');
      console.error("Fetch Moderation Items Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(newPage, statusFilter);
  };

  const handleFilterChange = (value: string) => {
    setCurrentPage(1); // Reset to first page on filter change
    setStatusFilter(value);
    updateUrlParams(1, value);
  };

  const updateUrlParams = (page: number, status: string) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (status) params.set('status', status);
    router.push(`/admin/moderation?${params.toString()}`);
  };

  const handleAction = (itemId: string, action: 'approve' | 'reject' | 'view') => {
    // Placeholder for actual approve/reject/view logic
    toast({
      title: `Action: ${action}`,
      description: `Item ID: ${itemId} would be processed. (Conceptual)`,
    });
    // Example: After action, refresh data
    // fetchModerationItems(currentPage, statusFilter);
  };
  
  const getStatusBadgeVariant = (status: IModerationQueueItem['status']) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'escalated': return 'secondary';
      default: return 'secondary';
    }
  };

  if (sessionStatus === 'loading' || (isLoading && items.length === 0)) {
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
        <h1 className="text-2xl font-headline font-semibold flex items-center">
          <MessageSquare className="w-7 h-7 mr-2 text-primary" />Content Moderation Queue
        </h1>
        <div>
          <Label htmlFor="statusFilter" className="text-sm font-medium mr-2">Filter by Status:</Label>
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger id="statusFilter" className="w-full sm:w-[180px] bg-input text-sm capitalize">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive border border-destructive rounded-md flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      )}

      {items.length === 0 && !isLoading && !error && (
        <p className="text-muted-foreground text-center py-8">No items found in the moderation queue for the current filter.</p>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto bg-card p-1 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Content Owner</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Reported At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id as string}>
                  <TableCell className="font-medium capitalize">{item.contentType.replace('_', ' ')}</TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell className="max-w-xs truncate" title={item.details}>{item.details || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(item.status)} className="capitalize">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{(item.userId as any)?.name || 'N/A'}</TableCell>
                  <TableCell>{(item.reporterId as any)?.name || 'System/AI'}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAction(item._id as string, 'view')} title="View Content (Conceptual)">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="default" size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={() => handleAction(item._id as string, 'approve')} title="Approve">
                        <CheckCircle className="h-4 w-4" />
                    </Button>
                     <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleAction(item._id as string, 'reject')} title="Reject">
                        <XCircle className="h-4 w-4" />
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
