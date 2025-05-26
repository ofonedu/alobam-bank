
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Flag, Eye, ShieldCheck, Loader2, AlertTriangle, Globe } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AdminTransactionView } from "@/types";
import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ViewTransactionDetailModal } from "./components/ViewTransactionDetailModal";
import { cn } from "@/lib/utils";

const TransactionStatusBadge = ({ status }: { status: AdminTransactionView["status"] }) => {
  switch (status) {
    case 'completed': return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Completed</Badge>;
    case 'pending': return <Badge variant="secondary">Pending</Badge>;
    case 'failed': return <Badge variant="destructive">Failed</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const TransactionTypeBadge = ({ type }: { type: AdminTransactionView["type"] }) => {
  let typeName = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  if (type === 'credit') typeName = 'Credit';
  else if (type === 'debit') typeName = 'Debit';
  
  let className = "capitalize";
  if (['debit', 'withdrawal', 'fee', 'loan_repayment', 'transfer'].includes(type)) {
    className += " text-red-600";
  } else if (['credit', 'deposit', 'loan_disbursement'].includes(type)) {
    className += " text-green-600";
  }
  return <span className={className}>{typeName}</span>;
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
    return date.toLocaleString();
  };

const americanFirstNames = ["John", "Jane", "Michael", "Emily", "David", "Sarah", "Chris", "Jessica", "James", "Linda", "Robert", "Patricia"];
const americanLastNames = ["Smith", "Doe", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Garcia", "Rodriguez"];
const asianFirstNames = ["Kenji", "Sakura", "Wei", "Mei", "Hiroshi", "Yuki", "Jin", "Lien", "Raj", "Priya"];
const asianLastNames = ["Tanaka", "Kim", "Lee", "Chen", "Watanabe", "Park", "Nguyen", "Singh", "Gupta", "Khan"];
const europeanFirstNames = ["Hans", "Sophie", "Luca", "Isabelle", "Miguel", "Clara", "Pierre", "Anna", "Viktor", "Elena"];
const europeanLastNames = ["Müller", "Dubois", "Rossi", "García", "Silva", "Jansen", "Novak", "Ivanov", "Kowalski", "Andersson"];

const getRandomName = () => {
    const regionChoice = Math.random();
    let firstNames, lastNames;
    if (regionChoice < 0.33) { // American
        firstNames = americanFirstNames;
        lastNames = americanLastNames;
    } else if (regionChoice < 0.66) { // Asian
        firstNames = asianFirstNames;
        lastNames = asianLastNames;
    } else { // European
        firstNames = europeanFirstNames;
        lastNames = europeanLastNames;
    }
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${randomFirstName} ${randomLastName}`;
};


export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransactionView[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<AdminTransactionView | null>(null);

  const displayedUserNames = useMemo(() => new Map<string, string>(), []);


  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      displayedUserNames.clear(); // Clear map on new fetch
      try {
        const transactionsCollectionRef = collection(db, "transactions");
        const q = query(transactionsCollectionRef, orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedTransactions: AdminTransactionView[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          let transactionDate: Date;
            if (data.date && (data.date as Timestamp).toDate) {
                transactionDate = (data.date as Timestamp).toDate();
            } else if (data.date instanceof Date) {
                transactionDate = data.date;
            } else {
                transactionDate = new Date(data.date); // Fallback attempt
            }
          
          let userNameToDisplay = data.userName;
          if (!userNameToDisplay) {
            if (!displayedUserNames.has(data.userId)) {
                displayedUserNames.set(data.userId, getRandomName());
            }
            userNameToDisplay = displayedUserNames.get(data.userId);
          }

          return {
            id: doc.id,
            ...data,
            date: transactionDate,
            userName: userNameToDisplay, // Use the potentially generated name
          } as AdminTransactionView;
        });
        setTransactions(fetchedTransactions);
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        setError("Failed to fetch transactions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [displayedUserNames]); // Add displayedUserNames to dependencies if you want it to re-trigger (though clearing it inside is usually enough for refetch)

  const handleViewDetails = (transaction: AdminTransactionView) => {
    setSelectedTransactionForDetail(transaction);
    setIsDetailModalOpen(true);
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = (
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (txn.userName && txn.userName.toLowerCase().includes(searchTerm.toLowerCase())) || // Use txn.userName which might be the generated one
      txn.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesFlag = filterFlagged ? txn.isFlagged : true;
    return matchesSearch && matchesFlag;
  });
  
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-3xl font-bold">Manage Transactions</h1>
            <p className="text-muted-foreground">Oversee all platform transactions and review potentially fraudulent activity.</p>
        </div>
         <Button variant="outline" onClick={() => setFilterFlagged(!filterFlagged)} className={cn("w-full sm:w-auto", filterFlagged && "border-destructive text-destructive hover:bg-destructive/10")}>
            <Flag className="mr-2 h-4 w-4" />
            {filterFlagged ? "Showing Flagged Only" : "Filter Flagged"}
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Transactions ({isLoading ? "Loading..." : filteredTransactions.length})</CardTitle>
          <CardDescription>View, filter, and manage all transactions. Review actions are placeholders.</CardDescription>
           <div className="pt-4">
             <div className="relative w-full max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by Txn ID, User, Description..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading transactions...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Transactions</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredTransactions.length === 0 && !searchTerm && !filterFlagged ? (
            <p className="text-muted-foreground text-center py-8">No transactions found.</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions match your current filters.</p>
          ): (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Txn ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Flagged</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((txn) => (
                    <TableRow key={txn.id} className={txn.isFlagged ? "bg-destructive/10 hover:bg-destructive/20" : ""}>
                      <TableCell className="font-mono text-xs">{txn.id}</TableCell>
                      <TableCell>
                        <div>{txn.userName}</div> {/* userName is now pre-filled with random if original was missing */}
                        <div className="text-xs text-muted-foreground">{txn.userId}</div>
                      </TableCell>
                      <TableCell>{formatDateDisplay(txn.date)}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={txn.description}>{txn.description}</TableCell>
                      <TableCell className={cn("text-right font-medium", txn.amount < 0 ? 'text-red-600' : 'text-green-600')}>
                        {txn.amount < 0 ? "-" : "+"} ${Math.abs(txn.amount).toFixed(2)} {txn.currency}
                      </TableCell>
                      <TableCell><TransactionTypeBadge type={txn.type} /></TableCell>
                      <TableCell><TransactionStatusBadge status={txn.status} /></TableCell>
                      <TableCell className="text-center">{txn.isFlagged ? <Flag className="h-5 w-5 text-destructive mx-auto" /> : '-'}</TableCell>
                      <TableCell className="text-center space-x-1">
                          <Button variant="ghost" size="icon" title="View Details" onClick={() => handleViewDetails(txn)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {txn.isFlagged && <Button variant="ghost" size="icon" title="Mark as Reviewed" disabled><ShieldCheck className="h-4 w-4" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTransactionForDetail && (
        <ViewTransactionDetailModal
          isOpen={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          transaction={selectedTransactionForDetail}
        />
      )}
    </div>
  );
}

