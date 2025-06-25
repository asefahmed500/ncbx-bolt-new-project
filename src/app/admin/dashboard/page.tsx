
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStats, type AdminDashboardStats } from "@/actions/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Users, BarChartBig, LineChart, Search, Activity, Settings, MessageSquare, ShieldAlert, ServerCog, Eye, Settings2, SlidersHorizontal, Construction, AlertTriangle, LayoutGrid, Ticket, FileText, TrendingUp, UserMinus, Percent, DollarSignIcon, History, DatabaseBackup, Globe, CheckSquare, Server, Route, Sparkles, Hourglass, AlertCircle, GitBranch, ListChecks, Wrench, Webhook, Banknote, UserPlus } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            const result = await getAdminDashboardStats();
            if (result.error) {
                toast({
                    title: "Error loading dashboard stats",
                    description: result.error,
                    variant: "destructive"
                });
            } else if (result.stats) {
                setStats(result.stats);
            }
            setIsLoading(false);
        };

        fetchStats();
    }, [toast]);
    
    const StatCard = ({ title, value, change, icon, isLoading }: { title: string, value: string | number, change?: string, icon: React.ElementType, isLoading: boolean }) => {
        const Icon = icon;
        return (
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex items-center"><Icon className="mr-2 h-5 w-5 text-primary" />{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <>
                            <Skeleton className="h-8 w-24 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </>
                    ) : (
                        <>
                            <p className="text-3xl font-bold">{value}</p>
                            {change && <p className="text-xs text-muted-foreground">{change}</p>}
                        </>
                    )}
                </CardContent>
            </Card>
        );
    };

  return (
    <div className="flex-1 p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-semibold flex items-center">
          <ShieldCheck className="w-8 h-8 mr-3 text-primary" />
          Admin Dashboard
        </h1>
      </div>

      {/* Overview Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold font-headline mb-4">Overview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Users" 
            value={stats?.totalUsers.toLocaleString() ?? '...'}
            change={stats ? `+${stats.newUsersLastWeek} in last 7 days` : ''}
            icon={Users}
            isLoading={isLoading}
          />
           <StatCard 
            title="Active Subscriptions" 
            value={stats?.activeSubscriptions.toLocaleString() ?? '...'}
            change="Across all plans"
            icon={Activity}
            isLoading={isLoading}
          />
           <StatCard 
            title="Estimated MRR" 
            value={stats ? `$${stats.monthlyRevenue.toLocaleString()}` : '...'}
            change="Based on active subs"
            icon={BarChartBig}
            isLoading={isLoading}
          />
           <StatCard 
            title="System Health" 
            value={stats?.systemHealth ?? '...'}
            change="Last check: now"
            icon={LineChart}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Main Admin Features Section */}
      <section>
        <h2 className="text-2xl font-semibold font-headline mb-6">Management Tools</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />User Management</CardTitle>
              <CardDescription>View, search, and manage user accounts.</CardDescription>
            </CardHeader>
            <CardContent>
               <Link href="/admin/users" legacyBehavior passHref>
                <Button variant="outline" className="w-full"><Search className="mr-2 h-4 w-4"/>Search & Manage Users</Button>
              </Link>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">Actions: Suspend, Reactivate, etc.</p>
            </CardFooter>
          </Card>

           <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><LayoutGrid className="mr-2 h-5 w-5 text-primary" />Template Management</CardTitle>
              <CardDescription>Review and manage website templates.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/templates" legacyBehavior passHref>
                <Button variant="outline" className="w-full"><Eye className="mr-2 h-4 w-4"/>View & Manage Templates</Button>
              </Link>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">Approve, reject, and edit templates.</p>
            </CardFooter>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Ticket className="mr-2 h-5 w-5 text-primary" />Coupon Management</CardTitle>
              <CardDescription>Create and manage promotional coupons.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/coupons" legacyBehavior passHref>
                <Button variant="outline" className="w-full"><Settings2 className="mr-2 h-4 w-4"/>Manage Coupons</Button>
              </Link>
              <Link href="/admin/coupons/create" legacyBehavior passHref>
                <Button variant="default" className="w-full">Create New Coupon</Button>
              </Link>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">Set discounts, limits, and expiration.</p>
            </CardFooter>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-primary" />Content Moderation</CardTitle>
              <CardDescription>Review user-generated content.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/moderation" legacyBehavior passHref>
                <Button variant="outline" className="w-full"><Eye className="mr-2 h-4 w-4"/>View Moderation Queue ({isLoading ? '...' : stats?.pendingModerationItems ?? 0})</Button>
              </Link>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">Approve or reject submissions.</p>
            </CardFooter>
          </Card>
            
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><UserPlus className="mr-2 h-5 w-5 text-primary" />Affiliate System (Future)</CardTitle>
              <CardDescription>Manage your affiliate program.</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-muted-foreground">This feature is planned for future development. The groundwork models are in place.</p>
                 <div className="mt-4 space-y-2">
                    <Button variant="outline" className="w-full" disabled>Manage Affiliates</Button>
                    <Button variant="outline" className="w-full" disabled>View Referrals</Button>
                </div>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">Track referrals, commissions, and payouts.</p>
            </CardFooter>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary" />Application Configuration</CardTitle>
              <CardDescription>Global settings and feature flags.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Manage site-wide configurations, integrations, rate limits, and maintenance mode.</p>
              <div className="mt-3 space-y-2">
                <Button variant="outline" className="w-full" disabled><SlidersHorizontal className="mr-2 h-4 w-4" />Feature Flags</Button>
                <Button variant="outline" className="w-full" disabled><Construction className="mr-2 h-4 w-4" />Maintenance Mode</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

       <div className="mt-10 p-6 bg-blue-500/10 rounded-lg border border-blue-500/30">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-700">Admin Area Guide</h3>
            <p className="text-sm text-muted-foreground">
              This dashboard provides a real-time overview of key platform metrics. More detailed analytics and reports are planned for future updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
