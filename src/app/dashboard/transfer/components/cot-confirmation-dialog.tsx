
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [cotCode, setCotCode] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      const currencySymbol = 'currency' in transferData && transferData.currency ? transferData.currency : "$";
      const cotAmount = amount * MOCK_COT_PERCENTAGE;
      const totalDeductionAmount = amount + cotAmount;

      setDisplayData({
        transferAmount: amount,
        currency: currencySymbol,
        cot: cotAmount.toFixed(2),
        totalDeduction: totalDeductionAmount.toFixed(2),
      });
    }
    if (!isOpen) {
        setCotCode("");
        setError(null);
    }
  }, [transferData, isOpen]);


  const handleConfirm = async () => {
    if (!cotCode.trim()) {
        setError("COT Approval Code is required to proceed.");
        return;
    }
    setError(null);
    setIsConfirming(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500)); 
    setIsConfirming(false);
    onConfirm(cotCode); // Pass the code
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // If dialog is closed by user (e.g. Esc or X button), trigger cancel
      if (!isConfirming) { // Avoid triggering cancel if it's closing due to confirmation
        onCancel();
      }
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
            Cost of Transfer (COT) Confirmation
          </DialogTitle>
          <DialogDescription>
            Review the Cost of Transfer and enter your COT Approval Code. If you don't have a code, please contact support.
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
            <div className="space-y-2 pt-2">
                <Label htmlFor="cotCode">COT Approval Code</Label>
                <Input
                id="cotCode"
                value={cotCode}
                onChange={(e) => setCotCode(e.target.value)}
                placeholder="Enter COT code"
                disabled={isConfirming}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
             <p className="text-xs text-muted-foreground pt-2">
              Note: COT is estimated at 1% for this transaction. This amount, along with the transfer principal, will be deducted from your account upon successful completion of all authorization steps.
            </p>
          </div>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
            Cancel Transfer
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirming || !cotCode.trim()}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
