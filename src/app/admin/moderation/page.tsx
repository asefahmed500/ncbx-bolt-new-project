
"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getModerationQueueItems, processModerationItemByAdmin, type ProcessModerationItemInput } from '@/actions/admin';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, Eye, CheckCircle, XCircle, MessageSquare, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link'; // Keep if needed for links like View Content
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const ITEMS_PER_PAGE = 10;

type ModerationAction = 'approve' | 'reject' | 'escalate';

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

  const [processingItemId, setProcessingItemId] = useState<string | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<IModerationQueueItem | null>(null);
  const [currentAction, setCurrentAction] = useState<ModerationAction | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState("");


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
    setCurrentPage(1);
    setStatusFilter(value);
    updateUrlParams(1, value);
  };

  const updateUrlParams = (page: number, status: string) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (status) params.set('status', status);
    router.push(`/admin/moderation?${params.toString()}`);
  };

  const openActionDialog = (item: IModerationQueueItem, action: ModerationAction) => {
    setSelectedItemForAction(item);
    setCurrentAction(action);
    setModeratorNotes(item.moderatorNotes || ""); // Pre-fill notes if they exist
    setShowActionDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedItemForAction || !currentAction || !selectedItemForAction._id) return;

    setProcessingItemId(selectedItemForAction._id.toString());
    const payload: ProcessModerationItemInput = {
      itemId: selectedItemForAction._id.toString(),
      action: currentAction,
      moderatorNotes: moderatorNotes.trim() || undefined,
    };

    const result = await processModerationItemByAdmin(payload);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result.success) {
      toast({ title: "Success", description: result.success });
      fetchModerationItems(currentPage, statusFilter); // Refresh list
    }
    setProcessingItemId(null);
    setShowActionDialog(false);
    setSelectedItemForAction(null);
    setCurrentAction(null);
    setModeratorNotes("");
  };
  
  const getStatusBadgeVariant = (status: IModerationQueueItem['status']) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'escalated': return 'secondary'; // Use secondary for escalated (often yellowish/orange in themes)
      default: return 'secondary';
    }
  };

  const viewContentDetails = (item: IModerationQueueItem) => {
     // This could open a modal with more content details or navigate to a specific view page.
     // For now, using a toast as a placeholder.
     toast({
        title: `Content Details: ${item.contentType.replace('_',' ')}`,
        description: `ID: ${item.contentId}. Reason: ${item.reason}. Details: ${item.details || 'N/A'}`,
        duration: 10000,
     });
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
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Reported At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id as string}>
                  <TableCell className="font-medium capitalize">{item.contentType.replace('_', ' ')}</TableCell>
                  <TableCell className="max-w-xs truncate" title={item.reason}>{item.reason}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(item.status)} className="capitalize">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{(item.userId as any)?.name || (item.userId as any)?.email || 'N/A'}</TableCell>
                  <TableCell className="text-xs">{(item.reporterId as any)?.name || (item.reporterId as any)?.email || 'System/AI'}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => viewContentDetails(item)} title="View Details">
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="default" size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={() => openActionDialog(item, 'approve')} title="Approve">
                        <CheckCircle className="h-4 w-4" />
                    </Button>
                     <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => openActionDialog(item, 'reject')} title="Reject">
                        <XCircle className="h-4 w-4" />
                    </Button>
                     <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => openActionDialog(item, 'escalate')} title="Escalate">
                        <ShieldAlert className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
        
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action: {currentAction?.toUpperCase()}</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to <span className="font-semibold">{currentAction}</span> the content:
              <br/>Type: <span className="font-medium">{selectedItemForAction?.contentType.replace('_',' ')}</span>
              <br/>Reason: <span className="font-medium">{selectedItemForAction?.reason}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="moderatorNotes" className="text-sm font-medium">Moderator Notes (Optional)</Label>
            <Textarea
              id="moderatorNotes"
              value={moderatorNotes}
              onChange={(e) => setModeratorNotes(e.target.value)}
              placeholder="Add notes for this action..."
              className="mt-1 bg-input"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowActionDialog(false)} disabled={!!processingItemId}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={!!processingItemId} 
              className={cn(
                currentAction === 'approve' && "bg-green-500 hover:bg-green-600",
                currentAction === 'reject' && "bg-destructive hover:bg-destructive/90",
                currentAction === 'escalate' && "bg-amber-500 hover:bg-amber-600"
              )}
            >
              {processingItemId === selectedItemForAction?._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm {currentAction?.toUpperCase()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

    