
// src/app/admin/transactions/components/ViewTransactionDetailModal.tsx
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
import type { AdminTransactionView, Transaction, ViewTransactionDetailModalProps, InfoPillProps } from "@/types";
import { DollarSign, CalendarDays, Hash, UserCircle, FileText, Info, Flag, ShieldCheck, Type, Briefcase, KeyRound, Globe, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Timestamp } from "firebase/firestore";


const InfoPill = ({ label, value, icon, valueClassName }: InfoPillProps) => (
    <div className="py-2">
      <Label className="text-xs font-semibold text-muted-foreground flex items-center">
        {icon}
        {label}
      </Label>
      <div className={cn("text-sm break-words", valueClassName)}>{value === undefined || value === null || value === '' ? "N/A" : value}</div>
    </div>
  );

const TransactionStatusBadge = ({ status }: { status: Transaction["status"] }) => {
  switch (status) {
    case 'completed': return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Completed</Badge>;
    case 'pending': return <Badge variant="secondary">Pending</Badge>;
    case 'failed': return <Badge variant="destructive">Failed</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const TransactionTypeBadge = ({ type }: { type: Transaction["type"] }) => {
  let typeName = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  if (type === 'manual_credit' || type === 'credit') typeName = 'Credit';
  else if (type === 'manual_debit' || type === 'debit') typeName = 'Debit';
  
  let className = "capitalize";
  if (['debit', 'manual_debit', 'withdrawal', 'fee', 'loan_repayment', 'transfer'].includes(type)) {
    className += " text-red-600";
  } else if (['credit', 'manual_credit', 'deposit', 'loan_disbursement'].includes(type)) {
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

export function ViewTransactionDetailModal({
  isOpen,
  onOpenChange,
  transaction,
}: ViewTransactionDetailModalProps) {
  if (!transaction) return null;

  const formatAmount = (amount: number, currency?: string) => {
    const prefix = amount < 0 ? "-" : "+";
    const value = Math.abs(amount).toFixed(2);
    return `${prefix} ${currency || '$'}${value}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transaction Details: {transaction.id}</DialogTitle>
          <DialogDescription>
            Viewing details for transaction ID: {transaction.id}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <InfoPill icon={<Hash className="mr-2 h-4 w-4" />} label="Transaction ID" value={transaction.id} />
          <InfoPill icon={<UserCircle className="mr-2 h-4 w-4" />} label="User Name" value={transaction.userName} />
          <InfoPill icon={<UserCircle className="mr-2 h-4 w-4" />} label="User ID" value={transaction.userId} />
          <InfoPill icon={<UserCircle className="mr-2 h-4 w-4" />} label="User Email" value={transaction.userEmail} />
          <InfoPill icon={<CalendarDays className="mr-2 h-4 w-4" />} label="Date" value={formatDateDisplay(transaction.date)} />
          <InfoPill 
            icon={<DollarSign className="mr-2 h-4 w-4" />}
            label="Amount" 
            value={formatAmount(transaction.amount, transaction.currency)}
            valueClassName={transaction.amount < 0 ? 'text-red-600' : 'text-green-600 font-medium'}
          />
           <div className="py-2 md:col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center">
                <Type className="mr-2 h-4 w-4" />
                Type
            </Label>
            <TransactionTypeBadge type={transaction.type} />
          </div>
          <div className="py-2">
             <Label className="text-xs font-semibold text-muted-foreground flex items-center">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Status
            </Label>
            <TransactionStatusBadge status={transaction.status} />
          </div>
          <InfoPill icon={<Flag className="mr-2 h-4 w-4" />} label="Flagged" value={transaction.isFlagged ? "Yes" : "No"} valueClassName={transaction.isFlagged ? "text-destructive font-semibold" : ""} />
          
          <div className="md:col-span-2">
            <InfoPill icon={<FileText className="mr-2 h-4 w-4" />} label="Description" value={transaction.description} />
          </div>
          {transaction.notes && (
            <div className="md:col-span-2">
                <InfoPill icon={<Info className="mr-2 h-4 w-4" />} label="Admin Notes" value={transaction.notes} />
            </div>
          )}

          {transaction.recipientDetails && (
            <>
              <h4 className="md:col-span-2 text-sm font-semibold text-muted-foreground mt-2 pt-2 border-t">Recipient Details</h4>
              <InfoPill icon={<UserCircle className="mr-2 h-4 w-4" />} label="Recipient Name" value={transaction.recipientDetails.name} />
              <InfoPill icon={<Hash className="mr-2 h-4 w-4" />} label="Recipient Account" value={transaction.recipientDetails.accountNumber} />
              <InfoPill icon={<Landmark className="mr-2 h-4 w-4" />} label="Recipient Bank" value={transaction.recipientDetails.bankName} />
              {transaction.recipientDetails.swiftBic && <InfoPill icon={<Briefcase className="mr-2 h-4 w-4" />} label="SWIFT/BIC" value={transaction.recipientDetails.swiftBic} />}
              {transaction.recipientDetails.country && <InfoPill icon={<Globe className="mr-2 h-4 w-4" />} label="Country" value={transaction.recipientDetails.country} />}
            </>
          )}
          
          {transaction.authorizationDetails && (
             <>
              <h4 className="md:col-span-2 text-sm font-semibold text-muted-foreground mt-2 pt-2 border-t">Authorization Details</h4>
              {transaction.authorizationDetails.cot !== undefined && <InfoPill icon={<DollarSign className="mr-2 h-4 w-4" />} label="Cost of Transfer (COT)" value={`$${transaction.authorizationDetails.cot.toFixed(2)}`} />}
              <InfoPill icon={<KeyRound className="mr-2 h-4 w-4" />} label="IMF Code Provided" value={transaction.authorizationDetails.imfCodeProvided ? "Yes" : "No"} />
              {transaction.authorizationDetails.taxDocumentName && <InfoPill icon={<FileText className="mr-2 h-4 w-4" />} label="Tax Document" value={transaction.authorizationDetails.taxDocumentName} />}
            </>
          )}

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
