
// src/app/dashboard/transfer/components/tax-clearance-dialog.tsx
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
import { Loader2, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import type { TaxClearanceDialogProps } from "@/types";

export function TaxClearanceDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
}: TaxClearanceDialogProps) {
  const [taxCode, setTaxCode] = useState(""); 
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        setTaxCode("");
        setError(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!taxCode.trim()) { 
      setError("Please enter your Tax Clearance code.");
      return;
    }
    setError(null);
    setIsConfirming(true);
    // Simulate API call or validation
    await new Promise(resolve => setTimeout(resolve, 500)); 
    onConfirm(taxCode); 
    setIsConfirming(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" /> 
            Tax Clearance Required
          </DialogTitle>
          <DialogDescription>
            Please enter your Tax Clearance code for this transaction. If you don't have a code, please contact support.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="taxClearanceCode">Tax Clearance Code</Label>
            <Input
              id="taxClearanceCode"
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value)}
              placeholder="Enter Tax Clearance Code"
              disabled={isConfirming}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
           <p className="text-xs text-muted-foreground">
            This is a regulatory requirement for certain transactions.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
            Cancel Transfer
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirming || !taxCode.trim()}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit & Finalize Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    