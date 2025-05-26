
"use client"; // Make it a client component to fetch stats

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListChecks, Landmark, Activity, DollarSign, LifeBuoy, SettingsIcon, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStatsAction } from '@/lib/actions/admin-actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface DashboardStats {
  totalUsers: number;
  pendingKyc: number;
  activeLoans: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoadingStats(true);
      setStatsError(null);
      const result = await getAdminDashboardStatsAction();
      if (result.success && result.stats) {
        setStats(result.stats);
      } else {
        setStatsError(result.error || "Failed to load dashboard statistics.");
      }
      setIsLoadingStats(false);
    }
    fetchStats();
  }, []);

  const StatDisplay = ({ value, isLoading }: { value?: number, isLoading: boolean }) => {
    if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
    if (value === undefined || value === null) return "N/A";
    return <div className="text-2xl font-bold">{value}</div>;
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground">Manage users, transactions, loans, and system settings for Wohana Funds.</p>
      
      {statsError && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Stats</AlertTitle>
          <AlertDescription>{statsError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <StatDisplay value={stats?.totalUsers} isLoading={isLoadingStats} />
            {/* <p className="text-xs text-muted-foreground pt-1">+201 since last month</p> */}
            <Button size="sm" variant="outline" className="mt-4" asChild>
                <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <ListChecks className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <StatDisplay value={stats?.pendingKyc} isLoading={isLoadingStats} />
            <p className="text-xs text-muted-foreground pt-1">Awaiting review</p>
             <Button size="sm" variant="outline" className="mt-4" asChild>
                <Link href="/admin/kyc">Review KYC</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <Landmark className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <StatDisplay value={stats?.activeLoans} isLoading={isLoadingStats} />
            {/* <p className="text-xs text-muted-foreground pt-1">Total Loan Value: $5.6M</p> */}
             <Button size="sm" variant="outline" className="mt-4" asChild>
                <Link href="/admin/loans">Manage Loans</Link>
            </Button>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operational</div>
            <p className="text-xs text-muted-foreground pt-1">All systems running smoothly.</p>
             <Button size="sm" variant="outline" className="mt-4" disabled>View Logs</Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Quick Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="flex items-center justify-start gap-2">
                <Link href="/admin/users"><Users className="h-4 w-4"/>Manage Users</Link>
            </Button>
            <Button variant="outline" asChild className="flex items-center justify-start gap-2">
                <Link href="/admin/kyc"><ShieldAlert className="h-4 w-4"/>KYC Review</Link>
            </Button>
             <Button variant="outline" asChild className="flex items-center justify-start gap-2">
                <Link href="/admin/transactions"><ListChecks className="h-4 w-4"/>All Transactions</Link>
            </Button>
            <Button variant="outline" asChild className="flex items-center justify-start gap-2">
                <Link href="/admin/loans"><Landmark className="h-4 w-4"/>Loan Approvals</Link>
            </Button>
            <Button variant="outline" asChild className="flex items-center justify-start gap-2">
                <Link href="/admin/financial-ops"><DollarSign className="h-4 w-4"/>Financial Ops</Link>
            </Button>
            <Button variant="outline" asChild className="flex items-center justify-start gap-2">
                <Link href="/admin/support"><LifeBuoy className="h-4 w-4"/>Support Tickets</Link>
            </Button>
             <Button variant="outline" asChild className="flex items-center justify-start gap-2">
                <Link href="/admin/settings"><SettingsIcon className="h-4 w-4"/>System Settings</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

