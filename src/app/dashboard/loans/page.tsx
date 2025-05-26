
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Loan } from "@/types";
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { PlusCircle, Edit3, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoanApplicationSchema, type LoanApplicationData } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { submitLoanApplicationAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const StatusBadgeLoan = ({ status }: { status: Loan["status"] }) => {
  switch (status) {
    case "active": return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    case "approved": return <Badge className="bg-green-500 hover:bg-green-600 text-white">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    case "pending": return <Badge variant="secondary">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    case "rejected": return <Badge variant="destructive">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    case "paid": return <Badge variant="outline">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

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

export default function LoansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const form = useForm<LoanApplicationData>({
    resolver: zodResolver(LoanApplicationSchema),
    defaultValues: {
      amount: 1000,
      termMonths: 12,
      purpose: "",
    },
  });

  const fetchUserLoans = async () => {
    if (!user) {
      setIsLoading(false);
      setLoans([]);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    try {
      const q = query(collection(db, "loans"), where("userId", "==", user.uid), orderBy("applicationDate", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedLoans = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        let appDate: Date;
        if (data.applicationDate && (data.applicationDate as Timestamp)?.toDate) {
            appDate = (data.applicationDate as Timestamp).toDate();
        } else if (data.applicationDate instanceof Date) {
            appDate = data.applicationDate;
        } else {
            appDate = new Date(data.applicationDate as string | number);
        }

        let approvalDt: Date | undefined = undefined;
        if (data.approvalDate) {
            if ((data.approvalDate as Timestamp)?.toDate) {
                approvalDt = (data.approvalDate as Timestamp).toDate();
            } else if (data.approvalDate instanceof Date) {
                approvalDt = data.approvalDate;
            } else {
                approvalDt = new Date(data.approvalDate as string | number);
            }
        }
        
        return {
          ...data,
          id: doc.id,
          applicationDate: appDate,
          approvalDate: approvalDt,
        } as Loan;
      });
      setLoans(fetchedLoans);
    } catch (error: any) {
      console.error("Error fetching loans:", error);
      setFetchError("Failed to load your loan applications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserLoans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleApplyForLoan = async (values: LoanApplicationData) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to apply for a loan.", variant: "destructive" });
      return;
    }
    
    form.clearErrors(); 

    try {
      const result = await submitLoanApplicationAction(user.uid, values);
      if (result.success) {
        toast({ title: "Application Submitted", description: result.message });
        form.reset();
        setIsFormOpen(false);
        await fetchUserLoans(); 
      } else {
        toast({
          title: "Application Failed",
          description: typeof result.error === 'string' ? result.error : "Please check your application details.",
          variant: "destructive",
        });
         if (result.error && typeof result.error === 'object') {
          Object.entries(result.error).forEach(([fieldName, errors]) => {
            const field = fieldName as keyof LoanApplicationData;
            if (Array.isArray(errors)) {
                form.setError(field, { type: "server", message: errors.join(", ") });
            }
          });
        }
      }
    } catch (error) {
      console.error("Loan application submission error:", error);
      toast({ title: "Error", description: "An unexpected error occurred while submitting your application.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold">Loan Management</h1>
            <p className="text-muted-foreground">Apply for new loans and track your existing applications.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          if(!open) form.reset(); 
          setIsFormOpen(open);
        }}>
            <DialogTrigger asChild>
                <Button onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Apply for New Loan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Loan Application</DialogTitle>
                    <DialogDescription>Fill in the details below to apply for a new loan.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleApplyForLoan)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Loan Amount ($)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 5000" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="termMonths"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Loan Term (Months)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 24" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="purpose"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Purpose of Loan</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Briefly describe the purpose of this loan..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={form.formState.isSubmitting}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Submit Application
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Loans</CardTitle>
          <CardDescription>List of your active and past loan applications.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : fetchError ? (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Loans</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          ) : loans.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">You have no loan applications yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{formatDateDisplay(loan.applicationDate)}</TableCell>
                    <TableCell>${loan.amount.toLocaleString()}</TableCell>
                    <TableCell>{loan.termMonths} months</TableCell>
                    <TableCell><StatusBadgeLoan status={loan.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" disabled> {/* TODO: Implement view loan */}
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled={loan.status !== 'pending'}> {/* TODO: Implement edit loan */}
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
