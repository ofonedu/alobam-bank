
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Flag, Eye, ShieldCheck, Loader2, AlertTriangle, CheckSquare } from "lucide-react"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AdminTransactionView, UserProfile } from "@/types"; 
import { useState, useEffect, useMemo, Suspense } from 'react'; 
import { collection, getDocs, Timestamp, query, orderBy, where, doc, getDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ViewTransactionDetailModal } from "./components/ViewTransactionDetailModal";
import { cn } from "@/lib/utils";
import { markTransactionAsCompletedAction } from "@/lib/actions/admin-actions";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from 'next/navigation'; 
import { getRandomName } from "@/lib/utils"; 


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

function TransactionsContent() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<AdminTransactionView[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("All Transactions");

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<AdminTransactionView | null>(null);
  const [completingTransactionId, setCompletingTransactionId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const filterByUserId = searchParams.get('userId');

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const transactionsCollectionRef = collection(db, "transactions");
      const queryConstraints = [orderBy("date", "desc")];

      let userDisplayNameMap = new Map<string, string>();
      let userEmailMap = new Map<string, string>();


      if (filterByUserId) {
        queryConstraints.unshift(where("userId", "==", filterByUserId));
        try {
            const userDocRef = doc(db, "users", filterByUserId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as UserProfile;
                const nameToDisplay = userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || getRandomName();
                setPageTitle(`Transactions for ${nameToDisplay}`);
                userDisplayNameMap.set(filterByUserId, nameToDisplay);
                if(userData.email) userEmailMap.set(filterByUserId, userData.email);
            } else {
                setPageTitle(`Transactions for User ID: ${filterByUserId}`);
                 userDisplayNameMap.set(filterByUserId, getRandomName()); // Assign random if user not found
            }
        } catch (e) {
            console.error("Failed to fetch user details for page title:", e);
            setPageTitle(`Transactions for User ID: ${filterByUserId}`);
            userDisplayNameMap.set(filterByUserId, getRandomName());
        }
      } else {
        setPageTitle("All Transactions");
        // Fetch all users to build a map if not filtering by a single user
        const usersCollectionRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollectionRef);
        usersSnapshot.forEach(userDoc => {
            const userData = userDoc.data() as UserProfile;
            userDisplayNameMap.set(userDoc.id, userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || getRandomName());
            if(userData.email) userEmailMap.set(userDoc.id, userData.email);
        });
      }
      
      const q = query(transactionsCollectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const fetchedTransactions: AdminTransactionView[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        let transactionDate: Date;
          if (data.date && (data.date as Timestamp).toDate) {
              transactionDate = (data.date as Timestamp).toDate();
          } else if (data.date instanceof Date) {
              transactionDate = data.date;
          } else {
              transactionDate = new Date(data.date as string | number); 
          }
        
        const userName = userDisplayNameMap.get(data.userId) || getRandomName();
        const userEmail = userEmailMap.get(data.userId) || undefined;

        return {
          id: docSnap.id,
          ...data,
          date: transactionDate,
          userName: userName, 
          userEmail: userEmail,
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

  useEffect(() => {
    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterByUserId]); 

  const handleViewDetails = (transaction: AdminTransactionView) => {
    setSelectedTransactionForDetail(transaction);
    setIsDetailModalOpen(true);
  };

  const handleMarkAsCompleted = async (transaction: AdminTransactionView) => {
    if (transaction.status !== 'pending') return;
    setCompletingTransactionId(transaction.id);
    const result = await markTransactionAsCompletedAction(transaction.id, transaction.userId, transaction.amount);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      await fetchTransactions(); 
    } else {
      toast({ title: "Error", description: result.message || "Failed to mark as completed.", variant: "destructive" });
    }
    setCompletingTransactionId(null);
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = (
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (txn.userName && txn.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (txn.userEmail && txn.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
          <CardTitle>{pageTitle} ({isLoading ? "Loading..." : filteredTransactions.length})</CardTitle>
          <CardDescription>View, filter, and manage transactions.</CardDescription>
           <div className="pt-4">
             <div className="relative w-full max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by Txn ID, User, Email, Description..." 
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
          ) : filteredTransactions.length === 0 && !searchTerm && !filterFlagged && !filterByUserId ? (
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
                        <div>{txn.userName || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{txn.userEmail || txn.userId}</div>
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
                          {txn.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Mark as Completed" 
                              onClick={() => handleMarkAsCompleted(txn)}
                              disabled={completingTransactionId === txn.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              {completingTransactionId === txn.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
                            </Button>
                          )}
                          {txn.isFlagged && <Button variant="ghost" size="icon" title="Mark as Reviewed (Action Placeholder)" disabled><ShieldCheck className="h-4 w-4" /></Button>}
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

export default function AdminTransactionsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading transactions page...</div>}>
            <TransactionsContent />
        </Suspense>
    )
}
