
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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileUp, CheckCircle } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import type { TaxClearanceDialogProps } from "@/types";

export function TaxClearanceDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
}: TaxClearanceDialogProps) {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { 
        setError("File is too large. Max 5MB allowed.");
        setFile(undefined);
        return;
      }
      setError(null);
      setFile(selectedFile);
    } else {
      setFile(undefined);
    }
  };

  const handleConfirm = async () => {
    if (!file) {
      setError("Please upload your Tax Clearance certificate.");
      return;
    }
    setError(null);
    setIsConfirming(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConfirming(false);
    onConfirm(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setFile(undefined);
        setError(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileUp className="mr-2 h-5 w-5 text-primary" />
            Tax Clearance Certificate
          </DialogTitle>
          <DialogDescription>
            Please upload your Tax Clearance certificate for this transaction. (This is a mock step).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="taxCertificate">Upload Certificate (PDF, PNG, JPG - Max 5MB)</Label>
            <Input
              id="taxCertificate"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              disabled={isConfirming}
            />
            {file && <p className="text-xs text-green-600 flex items-center"><CheckCircle className="h-4 w-4 mr-1"/>{file.name} selected.</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
              Cancel Transfer
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isConfirming || !file}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload & Finalize Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
