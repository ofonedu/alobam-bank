
"use client"; 

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionTable, columns } from "./components/transaction-table"; // Import columns
import type { Transaction } from "@/types";
import { useAuth } from '@/hooks/use-auth';
import { fetchUserTransactionsAction } from '@/lib/actions';
import { PlusCircle, Download, Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        setTransactions([]);
        return;
      }
      setIsLoading(true);
      setFetchError(null);
      try {
        const result = await fetchUserTransactionsAction(user.uid); // No count to fetch all
        if (result.success && result.transactions) {
          setTransactions(result.transactions);
        } else {
          setFetchError(result.error || "Failed to load transactions.");
        }
      } catch (error: any) {
        console.error("Error fetching transactions page:", error);
        setFetchError(`Failed to fetch transactions. Server error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">View and manage your financial transactions.</p>
        </div>
        {/* Buttons are removed from here */}
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            A detailed list of all your past and pending transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center py-4 gap-4">
                <Skeleton className="h-10 w-full max-w-sm" />
                <Skeleton className="h-10 w-[180px]" />
              </div>
              <Skeleton className="h-12 w-full rounded-md border" /> {/* Placeholder for table header */}
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" /> /* Placeholders for table rows */
              ))}
              <div className="flex items-center justify-end space-x-2 py-4">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          ) : fetchError ? (
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

    
