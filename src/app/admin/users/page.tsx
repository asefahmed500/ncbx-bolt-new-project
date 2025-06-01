
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUsersForAdmin, updateUserStatus } from '@/actions/admin';
import type { IUser } from '@/models/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Search, ChevronLeft, ChevronRight, ExternalLink, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 10;

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);


  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchUsers(currentPage, searchTerm);
    }
  }, [currentPage, searchTerm, status, session]);

  const fetchUsers = async (page: number, currentSearchTerm: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUsersForAdmin(currentSearchTerm, page, ITEMS_PER_PAGE);
      if (result.error) {
        setError(result.error);
        setUsers([]);
      } else if (result.users && result.totalUsers !== undefined) {
        setUsers(result.users);
        setTotalPages(Math.ceil(result.totalUsers / ITEMS_PER_PAGE));
      }
    } catch (e: any) {
      setError('An unexpected error occurred.');
      console.error("Fetch Users Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
    updateUrlParams(1, event.target.value);
  };
  
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchTerm);
    updateUrlParams(1, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(newPage, searchTerm);
  };

  const updateUrlParams = (page: number, search: string) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (search) params.set('search', search);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleToggleUserStatus = async (userId: string, currentIsActive: boolean) => {
    setIsUpdatingStatus(userId);
    const result = await updateUserStatus(userId, !currentIsActive);
    setIsUpdatingStatus(null);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result.success && result.user) {
      toast({ title: "Success", description: result.success });
      setUsers(prevUsers => prevUsers.map(u => u._id === userId ? { ...u, isActive: result.user!.isActive } : u));
    }
  };
  
  const getStripeCustomerDashboardUrl = (customerId: string) => {
    // Note: Stripe dashboard URLs can change. This is a common pattern but verify.
    // Also, ensure your Stripe account ID is used if this structure differs for your region/account.
    return `https://dashboard.stripe.com/customers/${customerId}`;
  };


  if (status === 'loading' || (isLoading && users.length === 0)) {
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
        <h1 className="text-2xl font-headline font-semibold">Manage Users</h1>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            type="search"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full sm:w-72 bg-input"
            aria-label="Search users"
          />
          <Button type="submit" variant="outline" size="icon" aria-label="Submit search">
            <Search className="h-5 w-5" />
          </Button>
        </form>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive border border-destructive rounded-md flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      )}

      {users.length === 0 && !isLoading && !error && (
        <p className="text-muted-foreground text-center py-8">No users found for the current search criteria. Try adjusting your search or creating new users.</p>
      )}

      {users.length > 0 && (
        <div className="overflow-x-auto bg-card p-1 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id as string}>
                  <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'destructive'}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                  </TableCell>
                   <TableCell>
                    {user.stripeCustomerId ? (
                      <a
                        href={getStripeCustomerDashboardUrl(user.stripeCustomerId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs flex items-center"
                        title={`View ${user.name || user.email} in Stripe`}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> Stripe
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleUserStatus(user._id as string, user.isActive)}
                      disabled={isUpdatingStatus === (user._id as string)}
                    >
                      {isUpdatingStatus === (user._id as string) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : user.isActive ? (
                        <UserX className="h-4 w-4 mr-1" />
                      ) : (
                        <UserCheck className="h-4 w-4 mr-1" />
                      )}
                      {user.isActive ? 'Suspend' : 'Reactivate'}
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
