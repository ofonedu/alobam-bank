
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ListChecks, Landmark, UserCircle, ArrowRight, Wallet, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, Info, Send } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { Transaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { fetchUserTransactionsAction } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Timestamp } from "firebase/firestore";


const chartData = [
  { month: "Mar", income: 3000, expenses: 2200 },
  { month: "Apr", income: 3200, expenses: 1900 },
  { month: "May", income: 2800, expenses: 2500 },
];

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--primary))",
    icon: TrendingUp,
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--destructive))",
    icon: TrendingDown,
  },
} satisfies ChartConfig;

const formatDateDisplay = (dateInput: Date | Timestamp | undefined): string => {
    if (!dateInput) return "N/A";
    let date: Date;
    if ((dateInput as Timestamp)?.toDate && typeof (dateInput as Timestamp).toDate === 'function') {
      date = (dateInput as Timestamp).toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      try {
        const parsed = new Date(dateInput as string | number);
        if (!isNaN(parsed.getTime())) {
          date = parsed;
        } else {
          return "Invalid Date";
        }
      } catch {
        return "Invalid Date";
      }
    }
    return date.toLocaleDateString();
  };

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      setTransactionsLoading(true);
      setTransactionsError(null);
      fetchUserTransactionsAction(user.uid, 5)
        .then(result => {
          if (result.success && result.transactions) {
            // Ensure dates are JS Date objects
            const processedTransactions = result.transactions.map(tx => ({
                ...tx,
                date: (tx.date as Timestamp)?.toDate ? (tx.date as Timestamp).toDate() : new Date(tx.date as Date | string | number)
            }));
            setTransactions(processedTransactions);
          } else {
            setTransactionsError(result.error || "Failed to load transactions.");
          }
        })
        .catch(err => {
          console.error("Error fetching transactions:", err);
          setTransactionsError("An unexpected error occurred while fetching transactions.");
        })
        .finally(() => {
          setTransactionsLoading(false);
        });
    } else if (!authLoading) {
      setTransactionsLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading) {
     return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
         <div className="grid gap-6 md:grid-cols-2">
           <Skeleton className="h-64 rounded-lg" />
           <Skeleton className="h-64 rounded-lg" />
         </div>
      </div>
    );
  }

  if (!user) return null; 

  const kycStatusDisplay = {
    not_started: "Not Started",
    pending_review: "Pending Review",
    verified: "Verified",
    rejected: "Rejected",
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "N/A";
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  const formatTransactionType = (type: Transaction["type"]) => {
    if (type === 'manual_credit' || type === 'credit') return 'Credit';
    if (type === 'manual_debit' || type === 'debit') return 'Debit';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {userProfile?.isFlagged && (
        <Alert variant="destructive" className="shadow-lg">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Account Flagged</AlertTitle>
          <AlertDescription>
            Your account has been flagged for a security review. Some features may be limited. Please contact support for more information.
          </AlertDescription>
        </Alert>
      )}

      <h1 className="text-3xl font-bold">Welcome, {userProfile?.displayName || user.email}!</h1>
      <p className="text-muted-foreground">Here's an overview of your Wohana Funds account.</p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProfile ? formatCurrency(userProfile.balance) : <Skeleton className="h-8 w-24" />}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Account No: {userProfile?.accountNumber || <Skeleton className="h-4 w-20" />}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Status</CardTitle>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProfile?.kycStatus ? kycStatusDisplay[userProfile.kycStatus] : <Skeleton className="h-8 w-32" />}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              {userProfile?.kycStatus === "verified" ? "Your identity is verified." : "Complete KYC for full access."}
            </p>
            {userProfile?.kycStatus !== "verified" && (
              <Button size="sm" className="mt-4" asChild>
                <Link href="/dashboard/kyc">
                  {userProfile?.kycStatus === "not_started" || userProfile?.kycStatus === "rejected" ? "Start KYC" : "View KYC"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Health</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProfile?.accountHealthScore !== undefined ? `${userProfile.accountHealthScore}/100` : <Skeleton className="h-8 w-20" />}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Overall account standing.
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
            <UserCircle className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {userProfile?.profileCompletionPercentage !== undefined ? `${userProfile.profileCompletionPercentage}%` : <Skeleton className="h-8 w-16" />}
            </div>
            {userProfile?.profileCompletionPercentage !== undefined && (
              <Progress value={userProfile.profileCompletionPercentage} className="h-2" />
            )}
             <p className="text-xs text-muted-foreground pt-1">
              Complete your profile for better experience.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                Recent Transactions
            </CardTitle>
            <CardDescription>Your last few financial activities.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transactionsError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{transactionsError}</AlertDescription>
              </Alert>
            ) : transactions.length > 0 ? (
              <ul className="space-y-3">
                {transactions.map((transaction) => (
                  <li key={transaction.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0 dark:border-slate-700">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="text-xs text-muted-foreground">
                        {formatDateDisplay(transaction.date)} - <span className="capitalize">{formatTransactionType(transaction.type)}</span> - <Badge variant={transaction.status === 'completed' ? 'default' : transaction.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">{transaction.status}</Badge>
                      </div>
                    </div>
                    <span className={`font-semibold ${transaction.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {transaction.amount < 0 ? "-" : "+"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent transactions.</p>
            )}
             <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                <Link href="/dashboard/transactions">View All Transactions <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Funds Flow Overview
            </CardTitle>
            <CardDescription>Your income vs. expenses for the last 3 months (mock data).</CardDescription>
          </CardHeader>
          <CardContent className="aspect-[16/9] sm:aspect-[2/1]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend content={({ payload }) => (
                    <div className="flex justify-center gap-4 pt-2">
                      {payload?.map((entry) => (
                        <div key={entry.value} className="flex items-center gap-1 text-xs">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          {entry.value && (entry.value.charAt(0).toUpperCase() + entry.value.slice(1))}
                        </div>
                      ))}
                    </div>
                  )} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" asChild className="justify-start text-left h-auto py-3">
                <Link href="/dashboard/profile" className="flex items-center gap-3">
                    <UserCircle className="h-6 w-6 text-primary" />
                    <div>
                        <p className="font-medium">Manage Profile</p>
                        <p className="text-xs text-muted-foreground">Update your personal information.</p>
                    </div>
                </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start text-left h-auto py-3">
                <Link href="/dashboard/kyc" className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <div>
                        <p className="font-medium">Verify Identity (KYC)</p>
                        <p className="text-xs text-muted-foreground">Complete verification process.</p>
                    </div>
                </Link>
            </Button>
             <Button variant="outline" asChild className="justify-start text-left h-auto py-3">
                <Link href="/dashboard/transfer" className="flex items-center gap-3">
                    <Send className="h-6 w-6 text-primary" />
                    <div>
                        <p className="font-medium">Transfer Funds</p>
                        <p className="text-xs text-muted-foreground">Send money locally or internationally.</p>
                    </div>
                </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
