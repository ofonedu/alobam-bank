
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
import type { COTConfirmationDialogProps } from "@/types";

export function COTConfirmationDialog({
  isOpen,
  onOpenChange,
  transferData,
  cotPercentage,
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
    if (transferData && isOpen) {
      const amount = transferData.amount || 0;
      const currencySymbol = 'currency' in transferData && transferData.currency ? transferData.currency : "$";
      const effectiveCotPercentage = cotPercentage === undefined ? 0.01 : cotPercentage; // Use default if undefined
      const cotAmount = amount * effectiveCotPercentage;
      const totalDeductionAmount = amount + cotAmount;

      setDisplayData({
        transferAmount: amount,
        currency: currencySymbol,
        cot: cotAmount.toFixed(2),
        totalDeduction: totalDeductionAmount.toFixed(2),
      });
      setCotCode(""); 
      setError(null);
    }
  }, [transferData, isOpen, cotPercentage]);


  const handleConfirm = async () => {
    if (!cotCode.trim()) {
        setError("COT Approval Code is required to proceed.");
        return;
    }
    setError(null);
    setIsConfirming(true);
    await new Promise(resolve => setTimeout(resolve, 500)); 
    onConfirm(cotCode); 
    setIsConfirming(false); 
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !isConfirming) { // Only call onCancel if dialog is closed by user, not programmatically
        onCancel();
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
              <span className="text-muted-foreground">Cost of Transfer (COT @ {(cotPercentage * 100).toFixed(2)}%):</span>
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
