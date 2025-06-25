
"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTemplatesForAdmin, getTemplateDataForExport, getDistinctTemplateCategories } from '@/actions/admin';
import type { ITemplate } from '@/models/Template';
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
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, Download, Eye, BarChartHorizontalBig, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

const ITEMS_PER_PAGE = 10;

export default function AdminTemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
    } else if (status === 'authenticated') {
      fetchDistinctCategories();
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchTemplates(currentPage, statusFilter, categoryFilter);
    }
  }, [currentPage, statusFilter, categoryFilter, status, session]);


  const fetchDistinctCategories = async () => {
    const result = await getDistinctTemplateCategories();
    if (result.error) {
      toast({ title: "Error", description: "Could not fetch template categories.", variant: "destructive" });
    } else if (result.categories) {
      setAvailableCategories(result.categories);
    }
  };

  const fetchTemplates = async (page: number, currentStatus: string, currentCategory: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTemplatesForAdmin({ 
        page, 
        limit: ITEMS_PER_PAGE, 
        statusFilter: currentStatus === 'all' ? undefined : currentStatus, 
        categoryFilter: currentCategory === 'all' ? undefined : currentCategory 
      });
      if (result.error) {
        setError(result.error);
        setTemplates([]);
      } else if (result.templates && result.totalTemplates !== undefined) {
        setTemplates(result.templates);
        setTotalPages(Math.ceil(result.totalTemplates / ITEMS_PER_PAGE));
      }
    } catch (e: any) {
      setError('An unexpected error occurred.');
      console.error("Fetch Templates Error:", e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExportTemplate = async (templateId: string, templateName: string) => {
    toast({ title: "Exporting...", description: `Preparing template "${templateName}" for download.` });
    try {
      const result = await getTemplateDataForExport(templateId);
      if (result.error) {
        toast({ title: "Export Failed", description: result.error, variant: "destructive" });
      } else if (result.template) {
        const jsonString = JSON.stringify(result.template, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${templateName.replace(/\s+/g, '_').toLowerCase()}_template.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast({ title: "Export Successful", description: `Template "${templateName}" downloaded.` });
      }
    } catch (e: any) {
      toast({ title: "Export Error", description: "An unexpected error occurred during export.", variant: "destructive" });
      console.error("Export Template Error:", e);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(newPage, statusFilter, categoryFilter);
  };

  const handleFilterChange = (filterType: 'status' | 'category', value: string) => {
    setCurrentPage(1); // Reset to first page on filter change
    if (filterType === 'status') {
      setStatusFilter(value);
      updateUrlParams(1, value, categoryFilter);
    } else {
      setCategoryFilter(value);
      updateUrlParams(1, statusFilter, value);
    }
  };

  const updateUrlParams = (page: number, currentStatus: string, currentCategory: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('status', currentStatus);
    params.set('category', currentCategory);
    router.push(`/admin/templates?${params.toString()}`);
  };


  if (status === 'loading' || (isLoading && templates.length === 0)) {
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
        <h1 className="text-2xl font-headline font-semibold">Manage Templates</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <Label htmlFor="statusFilter" className="text-sm font-medium">Status:</Label>
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger id="statusFilter" className="w-full sm:w-[180px] bg-input text-sm capitalize">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="categoryFilter" className="text-sm font-medium">Category:</Label>
            <Select value={categoryFilter} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger id="categoryFilter" className="w-full sm:w-[180px] bg-input text-sm capitalize">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive border border-destructive rounded-md flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      )}

      {templates.length === 0 && !isLoading && !error && (
        <p className="text-muted-foreground text-center py-8">No templates found for the current filters. Try adjusting your filters or check back later.</p>
      )}

      {templates.length > 0 && (
        <div className="overflow-x-auto bg-card p-1 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center"><Eye className="inline-block h-4 w-4 mr-1" />Views</TableHead>
                <TableHead className="text-center"><BarChartHorizontalBig className="inline-block h-4 w-4 mr-1" />Uses</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template._id as string}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="capitalize">{template.category || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      template.status === 'approved' ? 'default' :
                      template.status === 'pending_approval' ? 'outline' :
                      template.status === 'rejected' ? 'destructive' : 'secondary'
                    } className="capitalize">
                      {template.status?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{template.viewCount ?? 0}</TableCell>
                  <TableCell className="text-center">{template.usageCount ?? 0}</TableCell>
                  <TableCell>{(template.createdByUserId as any)?.name || 'System'}</TableCell>
                  <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportTemplate(template._id as string, template.name)}>
                        <Download className="mr-1 h-3.5 w-3.5" /> Export
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/templates/edit/${template._id}`} title="Edit Template Metadata & Status">
                        <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                      </Link>
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
