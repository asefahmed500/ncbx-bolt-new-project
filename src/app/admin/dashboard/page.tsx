
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Users, BarChartBig, FileSpreadsheet, LineChart, Search, Activity, Settings, MessageSquare, ShieldAlert, ServerCog, Eye, Settings2, SlidersHorizontal, Construction, AlertTriangle, LayoutGrid, Ticket, FileText, TrendingUp, UserMinus, Percent, DollarSignIcon, History, DatabaseBackup, Globe, CheckSquare, Server, Route, Sparkles, Hourglass, AlertCircle, GitBranch, ListChecks, Wrench, Webhook, Banknote } from "lucide-react";
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
              <p className="text-xs text-muted-foreground">Last check: 2 mins ago</p>
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
              <CardDescription>View, search, manage user accounts (including subscribers), and handle billing issues via Stripe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
               <Link href="/admin/users" legacyBehavior passHref>
                <Button variant="outline" className="w-full"><Search className="mr-2 h-4 w-4"/>Search & Manage Users</Button>
              </Link>
              <Button variant="secondary" className="w-full" disabled><MessageSquare className="mr-2 h-4 w-4"/>Communicate with Users</Button>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">Actions: Suspend, Reactivate, View in Stripe (Conceptual).</p>
            </CardFooter>
          </Card>

           <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><LayoutGrid className="mr-2 h-5 w-5 text-primary" />Template Management</CardTitle>
              <CardDescription>Review, approve, and manage website templates, including user submissions for the public gallery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/templates" legacyBehavior passHref>
                <Button variant="outline" className="w-full"><Eye className="mr-2 h-4 w-4"/>View & Manage Templates</Button>
              </Link>
              <Button variant="secondary" className="w-full" disabled>Approve Pending (0)</Button>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">Export, edit, and set premium status for templates.</p>
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
                <p className="text-xs text-muted-foreground">Set discount types, values, and usage limits.</p>
            </CardFooter>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-primary" />Content Moderation</CardTitle>
              <CardDescription>Review user-generated content, published websites, template submissions, and manage reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/moderation" legacyBehavior passHref>
                <Button variant="outline" className="w-full"><Eye className="mr-2 h-4 w-4"/>View Moderation Queue (0)</Button>
              </Link>
              <Button variant="secondary" className="w-full" disabled>Moderation Settings</Button>
              <Button variant="secondary" className="w-full" disabled>Community Guidelines</Button>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">Approval workflows, automated scanning, and appeals.</p>
            </CardFooter>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" />Financial Reporting & Analytics</CardTitle>
              <CardDescription>View revenue, subscriptions, and key business metrics. (Data from Stripe & internal system)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                  <p className="flex items-center"><TrendingUp className="mr-2 h-4 w-4 text-green-500" />Monthly Recurring Revenue (MRR): <span className="font-semibold ml-1">$XXXX</span></p>
                  <p className="flex items-center"><BarChartBig className="mr-2 h-4 w-4 text-blue-500" />Revenue by Month: (Chart Placeholder)</p>
                  <div className="pl-6">
                     <p className="text-xs text-muted-foreground">Plan Breakdown:</p>
                     <ul className="list-disc list-inside text-xs text-muted-foreground">
                        <li>Pro Subscribers: XXX ($YYYY/mo)</li>
                        <li>Enterprise Subscribers: XX ($ZZZZ/mo)</li>
                     </ul>
                  </div>
                  <p className="flex items-center"><LineChart className="mr-2 h-4 w-4 text-yellow-500" />Growth Trends: +X% this month</p>
                  <p className="flex items-center"><UserMinus className="mr-2 h-4 w-4 text-red-500" />Churn Rate: Y%</p>
                  <p className="flex items-center"><DollarSignIcon className="mr-2 h-4 w-4 text-teal-500" />Customer Lifetime Value (LTV): $ZZZ</p>
                  <p className="flex items-center"><Percent className="mr-2 h-4 w-4 text-indigo-500" />Most Popular Plans: (e.g., Pro - 80%)</p>
                  <p className="flex items-center"><History className="mr-2 h-4 w-4 text-gray-500" />Refund Processing: (via Stripe Dashboard)</p>
              </div>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">These are conceptual placeholders. Actual data requires backend integration.</p>
            </CardFooter>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary" />Application Configuration</CardTitle>
              <CardDescription>Manage global settings, feature flags, and system parameters.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Site-wide configurations, integrations, rate limits, security settings, and maintenance mode.</p>
              <div className="mt-3 space-y-2">
                <Button variant="outline" className="w-full" disabled><SlidersHorizontal className="mr-2 h-4 w-4" />Manage Feature Flags</Button>
                <Button variant="outline" className="w-full" disabled><Settings className="mr-2 h-4 w-4" />Configure Integrations</Button>
                <Button variant="outline" className="w-full" disabled><AlertTriangle className="mr-2 h-4 w-4" />Rate Limits & Security</Button>
                <Button variant="outline" className="w-full" disabled><Construction className="mr-2 h-4 w-4" />Maintenance Mode</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><ServerCog className="mr-2 h-5 w-5 text-primary" />System & Publishing Monitoring</CardTitle>
              <CardDescription>Monitor application health, website creation, publishing infrastructure, and performance.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div>
                        <h4 className="font-medium text-sm mb-1">Website Creation Oversight:</h4>
                        <p className="text-xs text-muted-foreground flex items-center"><ListChecks className="mr-1.5 h-3.5 w-3.5" /> X new websites created today (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><DatabaseBackup className="mr-1.5 h-3.5 w-3.5" /> Database storage at Y% capacity (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Popular Templates: "Template Z" (X uses) (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><AlertCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Z websites failed to publish (Placeholder)</p>
                    </div>
                     <div>
                        <h4 className="font-medium text-sm mb-1">Publishing Infrastructure:</h4>
                        <p className="text-xs text-muted-foreground flex items-center"><Server className="mr-1.5 h-3.5 w-3.5" /> Server health: Optimal (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><Globe className="mr-1.5 h-3.5 w-3.5" /> CDN performance: Normal (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><CheckSquare className="mr-1.5 h-3.5 w-3.5" /> SSL certificates: All valid (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><Route className="mr-1.5 h-3.5 w-3.5" /> Domain connections: X pending (Placeholder)</p>
                    </div>
                     <div>
                        <h4 className="font-medium text-sm mb-1">Payment & Stripe Integration:</h4>
                        <p className="text-xs text-muted-foreground flex items-center"><Webhook className="mr-1.5 h-3.5 w-3.5" /> Stripe Webhook Health: OK (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><Banknote className="mr-1.5 h-3.5 w-3.5" /> Payment Gateway Status: Operational (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><AlertCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Failed Payments (24h): X (Placeholder)</p>
                    </div>
                </div>
              <div className="mt-4 space-y-2">
                <Button variant="outline" className="w-full" disabled>View Server Logs</Button>
                <Button variant="outline" className="w-full" disabled>CDN Status Page</Button>
                 <Button variant="outline" className="w-full" disabled>Stripe Dashboard</Button>
              </div>
            </CardContent>
             <CardFooter>
              <p className="text-xs text-muted-foreground">Health check endpoint: /api/health (Conceptual)</p>
            </CardFooter>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><BarChartBig className="mr-2 h-5 w-5 text-primary" />System & Business Analytics</CardTitle>
              <CardDescription>Track system performance, user behavior, feature usage, and conversion funnels.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div>
                        <h4 className="font-medium text-sm mb-1">System Performance:</h4>
                        <p className="text-xs text-muted-foreground flex items-center"><CheckSquare className="mr-1.5 h-3.5 w-3.5 text-green-500" />Publishing success rate: X% (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><Hourglass className="mr-1.5 h-3.5 w-3.5" />Avg. publish time: Y seconds (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><AlertCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" />Publishing errors (last 24h): Z (Placeholder)</p>
                    </div>
                     <div>
                        <h4 className="font-medium text-sm mb-1">Business & User Behavior:</h4>
                        <p className="text-xs text-muted-foreground flex items-center"><GitBranch className="mr-1.5 h-3.5 w-3.5" />Website creation trends: (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><LayoutGrid className="mr-1.5 h-3.5 w-3.5" />Template performance (conversion): (Placeholder)</p>
                        <p className="text-xs text-muted-foreground flex items-center"><Users className="mr-1.5 h-3.5 w-3.5" />User behavior in editor: (Placeholder)</p>
                         <p className="text-xs text-muted-foreground flex items-center"><Globe className="mr-1.5 h-3.5 w-3.5" />Geographic data of users/sites: (Placeholder)</p>
                    </div>
                </div>
              <div className="mt-4 space-y-2">
                <Button variant="outline" className="w-full" disabled>View Behavior Reports</Button>
                <Button variant="outline" className="w-full" disabled>Custom Analytics Dashboard</Button>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">Generate insights for product improvement and growth.</p>
            </CardFooter>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><DatabaseBackup className="mr-2 h-5 w-5 text-primary" />Technical Administration & Maintenance</CardTitle>
              <CardDescription>Key operational considerations for administrators.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground">
                    <li>
                        <strong>Data Backups:</strong> User data and application database backups are critical. Typically managed at the database infrastructure level (e.g., MongoDB Atlas). Ensure configured, tested, and monitored.
                    </li>
                     <li>
                        <strong>Server Scaling:</strong> Infrastructure should be configured for auto-scaling or manual scaling procedures should be in place to handle load.
                    </li>
                     <li>
                        <strong>Database Optimization:</strong> Regularly review query performance, schema design, and apply indexing strategies.
                    </li>
                    <li>
                        <strong>Security Monitoring:</strong> Implement and monitor security tools (firewalls, intrusion detection), review logs for suspicious activity, and keep dependencies updated.
                    </li>
                    <li>
                        <strong>System Logs:</strong> Regularly review application and server logs for errors, unusual activity, or performance bottlenecks.
                    </li>
                    <li>
                        <strong>Custom Domain Support:</strong> Assist users with DNS issues, monitor SSL provisioning, and verify domain ownership.
                    </li>
                </ul>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">This section is for informational purposes. Specific actions depend on your infrastructure.</p>
            </CardFooter>
          </Card>

           <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Wrench className="mr-2 h-5 w-5 text-primary" />User Support Tools</CardTitle>
              <CardDescription>Tools and information to assist users with platform issues.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Conceptual tools for aiding user support:</p>
              <div className="mt-3 space-y-2">
                <Button variant="outline" className="w-full" disabled><AlertTriangle className="mr-2 h-4 w-4" />View Publishing Failure Alerts</Button>
                <Button variant="outline" className="w-full" disabled><MessageSquare className="mr-2 h-4 w-4" />Support Ticket System (Link)</Button>
                <Button variant="outline" className="w-full" disabled><Eye className="mr-2 h-4 w-4" />Remote Assistance (Conceptual)</Button>
                <Button variant="outline" className="w-full" disabled><BarChartBig className="mr-2 h-4 w-4" />View User Usage Analytics</Button>
              </div>
            </CardContent>
             <CardFooter>
              <p className="text-xs text-muted-foreground">Facilitate efficient troubleshooting and user assistance.</p>
            </CardFooter>
          </Card>

        </div>
      </section>

       <div className="mt-10 p-6 bg-blue-500/10 rounded-lg border border-blue-500/30">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-700">Admin Area Guide</h3>
            <p className="text-sm text-muted-foreground">
              This dashboard provides an overview and tools for managing the application. Specific functionalities and data will be built out progressively. Many features listed here are conceptual and require significant backend and infrastructure development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
    
    

    
