
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
import { Loader2, Shield } from "lucide-react"; // Changed ShieldLock to Shield
import { useState, useEffect } from "react";
import type { OtpVerificationDialogProps } from "@/types";
import { verifyOtpAction } from "@/lib/actions/otp-actions"; // Import verifyOtpAction
import { useToast } from "@/hooks/use-toast";

export function OtpVerificationDialog({
  isOpen,
  onOpenChange,
  userId,
  purpose,
  emailHint,
  onOtpVerifiedSuccessfully,
  onCancel,
}: OtpVerificationDialogProps) {
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setError(null);
      setIsConfirming(false); // Reset confirming state when dialog opens
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!otp.trim() || otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    setError(null);
    setIsConfirming(true);

    try {
      const result = await verifyOtpAction(userId, purpose, otp.trim());
      if (result.success) {
        toast({ title: "OTP Verified", description: result.message });
        onOtpVerifiedSuccessfully(otp.trim()); // Call the success callback
        onOpenChange(false); // Close the dialog on success
      } else {
        setError(result.message || "OTP verification failed.");
        toast({ title: "OTP Verification Failed", description: result.message, variant: "destructive" });
      }
    } catch (e: any) {
      setError("An unexpected error occurred during OTP verification.");
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !isConfirming) {
      onCancel(); // Call onCancel if dialog is closed by user interaction (not programmatically after success)
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary" /> {/* Changed ShieldLock to Shield */}
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
              autoComplete="one-time-code"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            The OTP is valid for 10 minutes. If you didn't receive it, please check your spam folder or try initiating the transfer again to resend.
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
    
