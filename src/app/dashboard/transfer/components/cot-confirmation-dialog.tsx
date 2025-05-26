
// src/app/dashboard/transfer/components/cot-confirmation-dialog.tsx
"use client";

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
import { Loader2, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import type { LocalTransferData, InternationalTransferData } from "@/lib/schemas";
import type { COTConfirmationDialogProps } from "@/types";

export function COTConfirmationDialog({
  isOpen,
  onOpenChange,
  transferData,
  onConfirm,
  onCancel,
}: COTConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [displayData, setDisplayData] = useState({
    transferAmount: 0,
    currency: "$",
    cot: "0.00",
    totalDeduction: "0.00",
  });

  useEffect(() => {
    if (transferData) {
      const MOCK_COT_PERCENTAGE = 0.01; // 1%
      const amount = transferData.amount || 0;
      const currencySymbol = 'currency' in transferData && transferData.currency ? transferData.currency : "$"; // Handle optional currency
      const cotAmount = amount * MOCK_COT_PERCENTAGE;
      const totalDeductionAmount = amount + cotAmount;

      setDisplayData({
        transferAmount: amount,
        currency: currencySymbol,
        cot: cotAmount.toFixed(2),
        totalDeduction: totalDeductionAmount.toFixed(2),
      });
    }
  }, [transferData]);


  const handleConfirm = async () => {
    setIsConfirming(true);
    await new Promise(resolve => setTimeout(resolve, 500)); 
    setIsConfirming(false);
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
            Cost of Transfer (COT) Confirmation
          </DialogTitle>
          <DialogDescription>
            Please review and confirm the Cost of Transfer before proceeding.
          </DialogDescription>
        </DialogHeader>
        {transferData && (
          <div className="space-y-3 py-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transfer Amount:</span>
              <span className="font-medium">
                {displayData.currency}{displayData.transferAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost of Transfer (COT):</span>
              <span className="font-medium">
                 {displayData.currency}{displayData.cot}
              </span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold">
              <span>Total Amount to be Deducted:</span>
              <span>
                {displayData.currency}{displayData.totalDeduction}
              </span>
            </div>
             <p className="text-xs text-muted-foreground pt-2">
              Note: COT is estimated at 1% for this transaction. This amount will be deducted from your account upon successful completion of all authorization steps.
            </p>
          </div>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
              Cancel Transfer
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
