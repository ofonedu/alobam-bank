
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, XCircle, Eye, Loader2, AlertTriangle } from "lucide-react";
import type { AdminLoanApplicationView } from "@/types";
import { useState, useEffect } from 'react';
import { collection, getDocs, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { updateLoanStatusAction } from "@/lib/actions/admin-actions";
import { useToast } from "@/hooks/use-toast";
import { ViewLoanDetailModal } from "./components/ViewLoanDetailModal";

const LoanStatusBadge = ({ status }: { status: AdminLoanApplicationView["status"] }) => {
  switch (status) {
    case "pending": return <Badge variant="secondary" className="bg-yellow-500 text-black">Pending</Badge>;
    case "approved": return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Approved</Badge>;
    case "rejected": return <Badge variant="destructive">Rejected</Badge>;
    case "active": return <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>;
    case "paid": return <Badge variant="outline">Paid</Badge>;
    case "defaulted": return <Badge variant="destructive" className="bg-red-700 hover:bg-red-800">Defaulted</Badge>;
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
        const parsed = new Date((dateInput as Timestamp).toDate());
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

export default function AdminLoansPage() {
  const { toast } = useToast();
  const [loanApplications, setLoanApplications] = useState<AdminLoanApplicationView[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState<AdminLoanApplicationView | null>(null);


  const fetchLoans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loansCollectionRef = collection(db, "loans");
      const q = query(loansCollectionRef, orderBy("applicationDate", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedLoans: AdminLoanApplicationView[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Ensure dates are JS Date objects
        let appDate: Date;
        if (data.applicationDate && (data.applicationDate as Timestamp).toDate) {
          appDate = (data.applicationDate as Timestamp).toDate();
        } else if (data.applicationDate instanceof Date) {
          appDate = data.applicationDate;
        } else {
          appDate = new Date(data.applicationDate); // Fallback attempt
        }

        let approvalDt: Date | undefined = undefined;
        if (data.approvalDate) {
          if ((data.approvalDate as Timestamp).toDate) {
            approvalDt = (data.approvalDate as Timestamp).toDate();
          } else if (data.approvalDate instanceof Date) {
            approvalDt = data.approvalDate;
          } else {
            approvalDt = new Date(data.approvalDate); // Fallback attempt
          }
        }
        
        fetchedLoans.push({
          id: doc.id,
          ...data,
          applicationDate: appDate,
          approvalDate: approvalDt,
        } as AdminLoanApplicationView);
      });
      setLoanApplications(fetchedLoans);
    } catch (err: any) {
      console.error("Error fetching loans:", err);
      setError("Failed to fetch loan applications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLoans();
  }, []);

  const handleOpenDetailModal = (loan: AdminLoanApplicationView) => {
    setSelectedLoanForDetail(loan);
    setIsDetailModalOpen(true);
  };

  const handleUpdateLoanStatus = async (loanId: string, userId: string, newStatus: "approved" | "rejected") => {
    setProcessingLoanId(loanId);
    const result = await updateLoanStatusAction(loanId, userId, newStatus);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      fetchLoans(); 
    } else {
      toast({ title: "Error", description: result.message || "Failed to update loan status.", variant: "destructive" });
    }
    setProcessingLoanId(null);
  };


  const filteredLoans = loanApplications.filter(loan =>
    loan.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Loan Applications</h1>
          <p className="text-muted-foreground">Review, approve, or reject loan applications.</p>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Loan Applications ({isLoading ? "Loading..." : filteredLoans.length})</CardTitle>
          <CardDescription>Review and process loan applications.</CardDescription>
           <div className="pt-4 flex gap-2 items-center">
             <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by applicant, loan ID, user ID..." 
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
              <p className="ml-2">Loading loan applications...</p>
            </div>
          ) : error ? (
             <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Loans</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredLoans.length === 0 && !searchTerm ? (
            <p className="text-muted-foreground text-center py-8">No loan applications found.</p>
          ) : filteredLoans.length === 0 && searchTerm ? (
            <p className="text-muted-foreground text-center py-8">No loans match your search for "{searchTerm}".</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-mono text-xs">{loan.id}</TableCell>
                      <TableCell>
                          <div>{loan.applicantName || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{loan.userId}</div>
                      </TableCell>
                      <TableCell>${loan.amount.toLocaleString()}</TableCell>
                      <TableCell>{loan.termMonths} months</TableCell>
                      <TableCell>{formatDateDisplay(loan.applicationDate)}</TableCell>
                      <TableCell><LoanStatusBadge status={loan.status} /></TableCell>
                      <TableCell className="text-center space-x-1">
                        <Button variant="ghost" size="icon" title="View Details" onClick={() => handleOpenDetailModal(loan)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        {loan.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-600 hover:text-green-700" 
                              title="Approve Loan" 
                              onClick={() => handleUpdateLoanStatus(loan.id, loan.userId, 'approved')}
                              disabled={processingLoanId === loan.id}
                            >
                              {processingLoanId === loan.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-600 hover:text-red-700" 
                              title="Reject Loan" 
                              onClick={() => handleUpdateLoanStatus(loan.id, loan.userId, 'rejected')}
                              disabled={processingLoanId === loan.id}
                            >
                            {processingLoanId === loan.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4" />}
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
       {selectedLoanForDetail && (
        <ViewLoanDetailModal
            isOpen={isDetailModalOpen}
            onOpenChange={setIsDetailModalOpen}
            loan={selectedLoanForDetail}
        />
      )}
    </div>
  );
}
