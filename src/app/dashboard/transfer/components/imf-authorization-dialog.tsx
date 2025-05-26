
// src/app/dashboard/transfer/components/imf-authorization-dialog.tsx
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound } from "lucide-react";
import { useState } from "react";
import type { IMFAuthorizationDialogProps } from "@/types";

export function IMFAuthorizationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
}: IMFAuthorizationDialogProps) {
  const [imfCode, setImfCode] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (imfCode.length < 5) { 
      setError("IMF code must be at least 5 characters long.");
      return;
    }
    setError(null);
    setIsConfirming(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsConfirming(false);
    onConfirm(imfCode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setImfCode("");
        setError(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <KeyRound className="mr-2 h-5 w-5 text-primary" />
            IMF Authorization Required
          </DialogTitle>
          <DialogDescription>
            Please enter your International Monetary Fund (IMF) authorization code to proceed with this transfer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="imfCode">IMF Authorization Code</Label>
            <Input
              id="imfCode"
              value={imfCode}
              onChange={(e) => setImfCode(e.target.value)}
              placeholder="Enter your IMF code"
              disabled={isConfirming}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            This is a security measure to authorize large or international transactions. If you don't have this code, please contact support. (This is a mock step).
          </p>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
              Cancel Transfer
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Authorization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
