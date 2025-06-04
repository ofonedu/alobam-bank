
// src/app/dashboard/transfer/components/otp-verification-dialog.tsx
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
import { Loader2, ShieldLock } from "lucide-react";
import { useState, useEffect } from "react";

interface OtpVerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (otp: string) => Promise<void>; // Make onConfirm async
  onCancel: () => void;
  emailHint?: string; // e.g., "ema***@example.com"
}

export function OtpVerificationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  emailHint,
}: OtpVerificationDialogProps) {
  const [otp, setOtp] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setError(null);
      setIsConfirming(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!otp.trim() || otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    setError(null);
    setIsConfirming(true);
    await onConfirm(otp.trim()); // Await the confirmation
    // setIsConfirming will be reset by parent or if an error occurs in onConfirm
    // or parent can close dialog on success
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isConfirming) { // Prevent closing while confirming
        onOpenChange(open);
        if (!open) onCancel(); // Call cancel if dialog is closed by user
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShieldLock className="mr-2 h-5 w-5 text-primary" />
            OTP Verification
          </DialogTitle>
          <DialogDescription>
            A One-Time Password (OTP) has been sent to your registered email address
            {emailHint && ` (ending in ${emailHint})`}.
            Please enter it below to complete your transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="otpCode">One-Time Password (OTP)</Label>
            <Input
              id="otpCode"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              disabled={isConfirming}
              className="text-center tracking-[0.3em] text-lg font-mono"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            The OTP is valid for 10 minutes. If you didn't receive it, please check your spam folder or try resending (resend functionality not yet implemented).
          </p>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
            Cancel Transfer
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirming || otp.trim().length !== 6}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
