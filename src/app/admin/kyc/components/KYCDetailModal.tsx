
"use client";

import { useState, useEffect, type ReactNode } from "react";
import Image from "next/image";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { AdminKYCView, KYCData, KYCDetailModalProps, InfoPillProps } from "@/types";
import { Loader2, CheckCircle, XCircle, AlertTriangle, UserCircle, CalendarDays, MapPin, FileText, BarChart3, AlertOctagon, CheckSquare, FileWarning } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { approveKycAction, rejectKycAction } from "@/lib/actions/admin-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const InfoPill = ({ label, value, icon, valueClassName }: InfoPillProps) => (
    <div className="py-2">
      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
        {icon}{label}
      </Label>
      <p className={cn("text-sm break-words", valueClassName)}>{typeof value === 'boolean' ? (value ? "Yes" : "No") : (value || "N/A")}</p>
    </div>
  );

export function KYCDetailModal({
  isOpen,
  onOpenChange,
  kycItem,
  onActionComplete,
}: KYCDetailModalProps) {
  const { toast } = useToast();
  const [rejectionReason, setRejectionReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (kycItem?.status === "rejected" && kycItem.rejectionReason) {
      setRejectionReason(kycItem.rejectionReason);
    } else {
      setRejectionReason("");
    }
  }, [kycItem]);

  const handleApprove = async () => {
    if (!kycItem) return;
    setIsApproving(true);
    const result = await approveKycAction(kycItem.id, kycItem.userId);
    if (result.success) {
      toast({ title: "KYC Approved", description: result.message });
      onActionComplete();
      onOpenChange(false);
    } else {
      toast({ title: "Approval Failed", description: result.error || "An unexpected error occurred.", variant: "destructive" });
    }
    setIsApproving(false);
  };

  const handleReject = async () => {
    if (!kycItem) return;
    if (!rejectionReason.trim()) {
      toast({ title: "Validation Error", description: "Rejection reason is required.", variant: "destructive" });
      return;
    }
    setIsRejecting(true);
    const result = await rejectKycAction(kycItem.id, kycItem.userId, rejectionReason);
    if (result.success) {
      toast({ title: "KYC Rejected", description: result.message });
      onActionComplete();
      onOpenChange(false);
    } else {
      toast({ title: "Rejection Failed", description: result.error || "An unexpected error occurred.", variant: "destructive" });
    }
    setIsRejecting(false);
  };

  if (!kycItem) return null;
  
  const getStatusBadgeVariant = (status?: KYCData["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "verified": return "default"; 
      case "pending_review": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const isValidPhotoUrl = typeof kycItem.photoUrl === 'string' &&
                          kycItem.photoUrl && 
                          kycItem.photoUrl !== "placeholder_for_actual_storage_url" && 
                          (kycItem.photoUrl.startsWith('http') || kycItem.photoUrl.startsWith('/') || kycItem.photoUrl.startsWith('data:'));


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>KYC Review: {kycItem.fullName}</DialogTitle>
          <DialogDescription>
            Review the user's KYC submission details and take action. User ID: {kycItem.userId}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 py-4">
          {/* Left Column: User Info & ID Photo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-2 border-b pb-1">Submitted Information</h3>
            <InfoPill icon={<UserCircle className="h-4 w-4"/>} label="Full Name" value={kycItem.fullName} />
            <InfoPill icon={<CalendarDays className="h-4 w-4"/>} label="Date of Birth" value={kycItem.dateOfBirth} />
            <InfoPill icon={<MapPin className="h-4 w-4"/>} label="Address" value={kycItem.address} />
            <InfoPill icon={<FileText className="h-4 w-4"/>} label="Government ID No." value={kycItem.governmentId} />
            <InfoPill icon={<CalendarDays className="h-4 w-4"/>} label="Submitted At" value={kycItem.submittedAt ? new Date(kycItem.submittedAt).toLocaleString() : "N/A"} />
             <div>
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                <FileWarning className="h-4 w-4"/>Government ID Photo
              </Label>
              {isValidPhotoUrl ? (
                 <div className="relative aspect-video w-full rounded-md border border-dashed overflow-hidden">
                    <Image src={kycItem.photoUrl!} alt={`ID Photo for ${kycItem.fullName}`} fill className="object-contain" data-ai-hint="document identification" />
                </div>
              ) : (
                <div className="aspect-video w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
                  <p className="text-muted-foreground text-sm">Photo not available or not uploaded.</p>
                </div>
              )}
               {kycItem.photoFileName && <p className="text-xs text-muted-foreground mt-1">Filename: {kycItem.photoFileName}</p>}
            </div>
          </div>

          {/* Right Column: Actions & Status */}
          <div className="space-y-4">
             <h3 className="font-semibold text-lg mb-2 border-b pb-1">KYC Status & Actions</h3>
             <div className="pt-4">
                <Label htmlFor="currentStatus" className="text-xs font-semibold text-muted-foreground">Current KYC Status</Label>
                <Badge id="currentStatus" variant={getStatusBadgeVariant(kycItem.status)} className="text-base mt-1 block w-fit">
                    {kycItem.status.replace("_", " ").toUpperCase()}
                </Badge>
            </div>

            <Alert className="mt-4">
                <AlertOctagon className="h-4 w-4" />
                <AlertTitle>Manual Review Required</AlertTitle>
                <AlertDescription>
                    AI-powered risk assessment is not currently active. Please review the submitted details carefully.
                </AlertDescription>
            </Alert>

            {(kycItem.status === "pending_review" || kycItem.status === "rejected") && (
              <div className="space-y-2 pt-4">
                <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason if rejecting KYC..."
                  rows={3}
                  disabled={isApproving || isRejecting}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline" disabled={isApproving || isRejecting}>Cancel</Button>
          </DialogClose>
          {(kycItem.status === "pending_review" || kycItem.status === "rejected") && (
            <>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isApproving || isRejecting || !rejectionReason.trim()}
              >
                {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Reject KYC
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Approve KYC
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

