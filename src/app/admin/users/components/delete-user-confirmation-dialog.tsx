
// src/app/admin/users/components/delete-user-confirmation-dialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DeleteUserDialogProps } from "@/types";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

export function DeleteUserConfirmationDialog({
  isOpen,
  onOpenChange,
  user,
  onConfirmDelete,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirmDelete();
    setIsDeleting(false);
    // Dialog will be closed by parent component upon successful deletion and re-fetch
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will delete the Firestore profile for user:
            <span className="font-semibold"> {user?.displayName || user?.email} (ID: {user?.uid})</span>.
            <br />
            Their KYC data will also be removed.
            <br />
            <strong className="text-destructive">
              This action does NOT delete the user from Firebase Authentication. That must be done separately (e.g., via Firebase Console or Admin SDK).
            </strong>
            <br />
            This operation cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete User Profile
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    