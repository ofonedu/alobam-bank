
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
import type { TransactionReceiptModalProps, InfoPillProps } from "@/types";
import { CheckCircle, DollarSign, CalendarDays, User, Hash, Landmark, Globe, FileText, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const InfoPill = ({ label, value, icon, valueClassName }: InfoPillProps) => (
  <div className="py-2">
    <dt className="text-xs font-semibold text-muted-foreground flex items-center">
      {icon}
      {label}
    </dt>
    <dd className={cn("text-sm break-words mt-0.5", valueClassName)}>{value === undefined || value === null || value === '' ? "N/A" : String(value)}</dd>
  </div>
);

export function TransactionReceiptModal({
  isOpen,
  onOpenChange,
  receiptDetails,
}: TransactionReceiptModalProps) {
  if (!receiptDetails) return null;

  const {
    transactionId,
    date,
    amount,
    currency,
    recipientName,
    recipientAccountNumber,
    recipientAccountNumberIBAN,
    bankName,
    swiftBic,
    country,
    transferType,
    newBalance,
    userPrimaryCurrency,
    remarks,
  } = receiptDetails;

  const formattedAmount = formatCurrency(amount, currency);
  const formattedNewBalance = newBalance !== undefined ? formatCurrency(newBalance, userPrimaryCurrency) : "N/A";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
            Transaction Successful
          </DialogTitle>
          <DialogDescription>
            Your {transferType.toLowerCase()} transfer has been processed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          <dl className="grid grid-cols-1 gap-y-2 text-sm">
            <InfoPill icon={<Hash className="mr-2 h-4 w-4" />} label="Transaction ID" value={transactionId} />
            <InfoPill icon={<CalendarDays className="mr-2 h-4 w-4" />} label="Date & Time" value={new Date(date).toLocaleString()} />
            <InfoPill icon={<DollarSign className="mr-2 h-4 w-4" />} label="Amount Sent" value={formattedAmount} valueClassName="font-semibold text-primary" />
            <InfoPill icon={<User className="mr-2 h-4 w-4" />} label="Recipient Name" value={recipientName} />
            
            {transferType === "Local" && recipientAccountNumber && (
              <InfoPill icon={<Hash className="mr-2 h-4 w-4" />} label="Recipient Account Number" value={recipientAccountNumber} />
            )}
            {transferType === "International" && recipientAccountNumberIBAN && (
              <InfoPill icon={<Hash className="mr-2 h-4 w-4" />} label="Recipient IBAN/Account" value={recipientAccountNumberIBAN} />
            )}
            
            {bankName && <InfoPill icon={<Landmark className="mr-2 h-4 w-4" />} label="Bank Name" value={bankName} />}
            
            {transferType === "International" && swiftBic && (
              <InfoPill icon={<Globe className="mr-2 h-4 w-4" />} label="SWIFT/BIC Code" value={swiftBic} />
            )}
            {transferType === "International" && country && (
              <InfoPill icon={<Globe className="mr-2 h-4 w-4" />} label="Recipient Country" value={country} />
            )}

            {remarks && <InfoPill icon={<FileText className="mr-2 h-4 w-4" />} label="Remarks" value={remarks} />}
            
            <InfoPill icon={<Wallet className="mr-2 h-4 w-4" />} label="Approx. New Balance" value={formattedNewBalance} valueClassName="font-semibold"/>
          </dl>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="default">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
