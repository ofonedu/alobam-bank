
// src/app/admin/users/components/ViewUserDetailModal.tsx
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { AdminUserView, ViewUserDetailModalProps, InfoPillProps } from "@/types";
import { Mail, Phone, UserCircle, ShieldCheck, Wallet, Landmark, CalendarDays, MapPin, Shapes, Globe } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const InfoPill = ({ icon, label, value }: InfoPillProps) => (
  <div className="py-2">
    <Label className="text-xs font-semibold text-muted-foreground flex items-center">
      {icon}
      {label}
    </Label>
    <p className="text-sm break-words">{value || "N/A"}</p>
  </div>
);

export function ViewUserDetailModal({
  isOpen,
  onOpenChange,
  user,
}: ViewUserDetailModalProps) {
  if (!user) return null;
  
  const kycStatusDisplay = {
    not_started: "Not Started",
    pending_review: "Pending Review",
    verified: "Verified",
    rejected: "Rejected",
  };
  
  const getKycStatusVariant = (status?: AdminUserView['kycStatus']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "verified": return "default"; 
      case "pending_review": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>User Details: {user.displayName || user.email}</DialogTitle>
          <DialogDescription>
            Viewing comprehensive details for user ID: {user.uid}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <InfoPill icon={<UserCircle className="mr-2 h-4 w-4" />} label="Full Name" value={user.displayName} />
          <InfoPill icon={<Mail className="mr-2 h-4 w-4" />} label="Email" value={user.email} />
          <InfoPill icon={<Phone className="mr-2 h-4 w-4" />} label="Phone Number" value={user.phoneNumber} />
          <InfoPill icon={<Wallet className="mr-2 h-4 w-4" />} label="Balance" value={formatCurrency(user.balance, user.primaryCurrency)} />
          <InfoPill icon={<Landmark className="mr-2 h-4 w-4" />} label="Account Number" value={user.accountNumber} />
          <InfoPill icon={<UserCircle className="mr-2 h-4 w-4" />} label="Role" value={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "N/A"} />
          <InfoPill icon={<Shapes className="mr-2 h-4 w-4" />} label="Account Type" value={user.accountType} />
          <InfoPill icon={<Globe className="mr-2 h-4 w-4" />} label="Primary Currency" value={user.primaryCurrency} />
          
          <div className="py-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center">
                <ShieldCheck className="mr-2 h-4 w-4" />
                KYC Status
            </Label>
            <Badge variant={getKycStatusVariant(user.kycStatus)} className="mt-1">
                {user.kycStatus ? kycStatusDisplay[user.kycStatus] : "N/A"}
            </Badge>
          </div>
          
           <div className="py-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center">
                <ShieldCheck className="mr-2 h-4 w-4" /> 
                Account Status
            </Label>
             <Badge variant={user.isSuspended ? "destructive" : "default"} className={user.isSuspended ? "" : "bg-green-500 hover:bg-green-600 text-white mt-1"}>
                {user.isSuspended ? "Suspended" : "Active"}
            </Badge>
          </div>
          <InfoPill icon={<UserCircle className="mr-2 h-4 w-4" />} label="Flagged" value={user.isFlagged ? "Yes" : "No"} />
          <InfoPill icon={<UserCircle className="mr-2 h-4 w-4" />} label="Account Health Score" value={user.accountHealthScore} />
          <InfoPill icon={<UserCircle className="mr-2 h-4 w-4" />} label="Profile Completion" value={`${user.profileCompletionPercentage}%`} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
