
// src/app/admin/loans/components/ViewLoanDetailModal.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { AdminLoanApplicationView, ViewLoanDetailModalProps, InfoPillProps } from "@/types";
import { DollarSign, CalendarDays, Hash, UserCircle, FileText, Percent, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

const LoanStatusBadge = ({ status }: { status: AdminLoanApplicationView["status"] }) => {
  switch (status) {
    case "pending": return <Badge variant="secondary" className="bg-yellow-500 text-black">Pending</Badge>;
    case "approved": return <Badge className="bg-blue-500 text-white">Approved</Badge>;
    case "rejected": return <Badge variant="destructive">Rejected</Badge>;
    case "active": return <Badge className="bg-green-500 text-white">Active</Badge>;
    case "paid": return <Badge variant="outline">Paid</Badge>;
    case "defaulted": return <Badge variant="destructive" className="bg-red-700 text-white">Defaulted</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const InfoPill = ({ label, value, icon }: InfoPillProps) => (
    <div className="py-2">
      <Label className="text-xs font-semibold text-muted-foreground flex items-center">
        {icon}
        {label}
      </Label>
      <p className="text-sm break-words">{value === undefined || value === null || value === '' ? "N/A" : String(value)}</p>
    </div>
  );

  const formatDateDisplay = (dateInput: Date | Timestamp | null | undefined): string => {
    if (!dateInput) return "N/A";
  
    let date: Date;
  
    if (typeof dateInput === "object" && "toDate" in dateInput && typeof dateInput.toDate === "function") {
      date = dateInput.toDate(); // Firestore Timestamp
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return "Invalid Date";
    }
  
    return date.toLocaleDateString();
  };  


export function ViewLoanDetailModal({
  isOpen,
  onOpenChange,
  loan,
}: ViewLoanDetailModalProps) {
  if (!loan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Loan Application Details: {loan.id}</DialogTitle>
          <DialogDescription>
            Viewing details for loan application by {loan.applicantName || loan.userId}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <InfoPill icon={<Hash className="mr-2 h-4 w-4" />} label="Loan ID" value={loan.id} />
          <InfoPill icon={<UserCircle className="mr-2 h-4 w-4" />} label="Applicant Name" value={loan.applicantName} />
          <InfoPill icon={<UserCircle className="mr-2 h-4 w-4" />} label="User ID" value={loan.userId} />
          <InfoPill icon={<DollarSign className="mr-2 h-4 w-4" />} label="Loan Amount" value={`$${loan.amount.toLocaleString()}`} />
          <InfoPill icon={<Clock className="mr-2 h-4 w-4" />} label="Term" value={`${loan.termMonths} months`} />
          <InfoPill icon={<Percent className="mr-2 h-4 w-4" />} label="Interest Rate" value={`${(loan.interestRate * 100).toFixed(2)}%`} />
          <div className="py-2">
             <Label className="text-xs font-semibold text-muted-foreground flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Status
            </Label>
            <LoanStatusBadge status={loan.status} />
          </div>
          <InfoPill icon={<CalendarDays className="mr-2 h-4 w-4" />} label="Application Date" value={formatDateDisplay(loan.applicationDate)} />
          {loan.approvalDate && (
            <InfoPill icon={<CalendarDays className="mr-2 h-4 w-4" />} label="Approval Date" value={formatDateDisplay(loan.approvalDate)} />
          )}
          <div className="md:col-span-2">
             <InfoPill icon={<FileText className="mr-2 h-4 w-4" />} label="Purpose" value={loan.purpose} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
