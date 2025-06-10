
// src/app/dashboard/transactions/page.tsx
"use client"; 

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionTable, columns } from "./components/transaction-table"; 
import type { Transaction } from "@/types";
import { useAuth } from '@/hooks/use-auth';
import { fetchUserTransactionsAction } from '@/lib/actions';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function TransactionsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      if (authLoading) return; // Wait for auth to settle
      if (!user?.uid) {
        setIsLoadingTransactions(false);
        setTransactions([]);
        return;
      }
      if (userProfile?.isSuspended) {
        setIsLoadingTransactions(false);
        setTransactions([]);
        return;
      }

      setIsLoadingTransactions(true);
      setFetchError(null);
      try {
        const result = await fetchUserTransactionsAction(user.uid); 
        if (result.success && result.transactions) {
          setTransactions(result.transactions);
        } else {
          setFetchError(result.error || "Failed to load transactions.");
        }
      } catch (error: any) {
        console.error("Error fetching transactions page:", error);
        setFetchError(`Failed to fetch transactions. Server error: ${error.message}`);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    loadTransactions();
  }, [user, userProfile, authLoading]);

  if (authLoading || (isLoadingTransactions && !userProfile?.isSuspended) ) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-1/3 mb-2" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-5 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center py-4 gap-4">
                <Skeleton className="h-10 w-full max-w-sm" />
                <Skeleton className="h-10 w-[180px]" />
              </div>
              <Skeleton className="h-12 w-full rounded-md border" /> 
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" /> 
              ))}
              <div className="flex items-center justify-end space-x-2 py-4">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userProfile?.isSuspended) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View and manage your financial transactions.</p>
        </div>
        <Alert variant="destructive" className="mt-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Account Suspended</AlertTitle>
          <AlertDescription>
            Access to transaction history is restricted because your account is suspended. Please contact support for assistance.
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View and manage your financial transactions.</p>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            A detailed list of all your past and pending transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Transactions</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          ) : (
            <TransactionTable data={transactions} columns={columns} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    
