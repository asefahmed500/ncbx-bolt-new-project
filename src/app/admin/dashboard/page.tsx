
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Users, BarChartBig, FileSpreadsheet, LineChart, Search, Activity, Settings, MessageSquare, ShieldAlert, ServerCog, Eye } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
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
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">1,234</p> {/* Placeholder */}
              <p className="text-xs text-muted-foreground">+20 since last week</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" />Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">567</p> {/* Placeholder */}
              <p className="text-xs text-muted-foreground">+5 this month</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center"><BarChartBig className="mr-2 h-5 w-5 text-primary" />Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">$12,345</p> {/* Placeholder */}
              <p className="text-xs text-muted-foreground">Target: $15,000</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center"><LineChart className="mr-2 h-5 w-5 text-primary" />System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-500 font-semibold">Optimal</p> {/* Placeholder */}
              <p className="text-xs text-muted-foreground">Last check: 2 mins ago (via external monitoring)</p>
            </CardContent>
          </Card>
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
            <CardContent className="space-y-4">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input type="search" placeholder="Search users (email, name, ID)..." className="bg-input" />
                <Button type="submit" variant="outline"><Search className="h-4 w-4" /></Button>
              </div>
              <p className="text-sm text-muted-foreground">Actions: View Details, Edit Role, Suspend, Delete.</p>
              <Button variant="secondary" className="w-full" disabled><MessageSquare className="mr-2 h-4 w-4"/>Communicate with Users</Button>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">User activity logs and detailed profiles will be accessible.</p>
            </CardFooter>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><FileSpreadsheet className="mr-2 h-5 w-5 text-primary" />Financial Reporting</CardTitle>
              <CardDescription>View revenue, subscriptions, and financial metrics.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detailed financial reports and dashboards for MRR, LTV, Churn.</p>
              <div className="mt-3 space-y-1 text-sm">
                  <p>Monthly Recurring Revenue (MRR): $XXXX</p>
                  <p>Customer Lifetime Value (LTV): $YYYY</p>
                  <p>Churn Rate: X%</p>
                  <p><Link href="/admin/reports/tax" className="text-primary hover:underline">View Tax Reports (Placeholder)</Link></p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" />Application Settings</CardTitle>
              <CardDescription>Configure global settings for the application.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Site-wide configurations, integrations, and feature flags.</p>
              <div className="mt-3 space-y-2">
                <Button variant="outline" className="w-full" disabled>Manage Feature Flags</Button>
                <Button variant="outline" className="w-full" disabled>Configure Integrations</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-primary" />Content Moderation</CardTitle>
              <CardDescription>Review and manage user-generated content.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Approval workflows, automated scanning (AI), and appeals.</p>
              <div className="mt-3 space-y-2">
                <Button variant="outline" className="w-full" disabled><Eye className="mr-2 h-4 w-4"/>View Pending Queue (0)</Button>
                <Button variant="outline" className="w-full" disabled>Moderation Settings</Button>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">Community guidelines and content policies.</p>
            </CardFooter>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><ServerCog className="mr-2 h-5 w-5 text-primary" />System Monitoring</CardTitle>
              <CardDescription>Monitor application health and performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Links to external monitoring tools and dashboards.</p>
              <div className="mt-3 space-y-2">
                <Button variant="outline" className="w-full" disabled>Server Performance</Button>
                <Button variant="outline" className="w-full" disabled>Database Queries</Button>
                <Button variant="outline" className="w-full" disabled>Error Tracking (Sentry)</Button>
                <Button variant="outline" className="w-full" disabled>Uptime Monitoring (External)</Button>
              </div>
            </CardContent>
             <CardFooter>
              <p className="text-xs text-muted-foreground">Health check endpoint: /api/health</p>
            </CardFooter>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><BarChartBig className="mr-2 h-5 w-5 text-primary" />Site Analytics</CardTitle>
              <CardDescription>Overview of website usage and statistics.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Integrate with Plausible, Google Analytics, etc.</p>
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
              This dashboard provides an overview and tools for managing the application. Specific functionalities like detailed user lists, actions, and full reports will be built out progressively.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
