
// src/app/admin/settings/account-types/page.tsx
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Edit, Loader2, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addAccountTypeAction, getAccountTypesAction, editAccountTypeAction, deleteAccountTypeAction } from "@/lib/actions/admin-settings-actions";
import type { AccountType } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
import type { Timestamp } from "firebase/firestore";

const formatDateDisplay = (dateInput: Date | Timestamp | undefined): string => {
    if (!dateInput) return "N/A";
    let date: Date;
    if ((dateInput as Timestamp)?.toDate && typeof (dateInput as Timestamp).toDate === 'function') {
      date = (dateInput as Timestamp).toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      try {
        const parsed = new Date((dateInput as Timestamp).toDate());
        if (!isNaN(parsed.getTime())) {
          date = parsed;
        } else {
          return "Invalid Date";
        }
      } catch {
        return "Invalid Date";
      }
    }
    return date.toLocaleDateString();
  };

export default function AccountTypesPage() {
  const { toast } = useToast();
  
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [formErrorNew, setFormErrorNew] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAccountType, setEditingAccountType] = useState<AccountType | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [formErrorEdit, setFormErrorEdit] = useState<string | null>(null);

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingAccountTypeId, setDeletingAccountTypeId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function fetchTypes() {
    setIsLoadingTypes(true);
    setFetchError(null);
    try {
      const result = await getAccountTypesAction();
      if (result.success && result.accountTypes) {
        setAccountTypes(result.accountTypes.map(type => ({
            ...type,
            // Ensure createdAt is a JS Date for client-side AdminAccountType
            createdAt: (type.createdAt as Timestamp)?.toDate ? (type.createdAt as Timestamp).toDate() : new Date(type.createdAt as Date | string | number)
        })));
      } else {
        setFetchError(result.error || "Failed to load account types.");
      }
    } catch (error: any) {
      setFetchError(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoadingTypes(false);
    }
  }

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleAddNewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingNew(true);
    setFormErrorNew(null);

    const formData = new FormData(event.currentTarget);
    const result = await addAccountTypeAction(formData);

    if (result.success) {
      toast({ title: "Success", description: result.message });
      setNewName("");
      setNewDescription("");
      await fetchTypes();
    } else {
      if (typeof result.error === 'string') {
        setFormErrorNew(result.error);
      } else if (result.error && typeof result.error === 'object') {
        const fieldErrors = Object.values(result.error).flat().join(", ");
        setFormErrorNew(fieldErrors || "An unknown validation error occurred.");
      } else {
        setFormErrorNew("An unknown error occurred.");
      }
      toast({ title: "Error", description: result.message || "Failed to add account type.", variant: "destructive" });
    }
    setIsSubmittingNew(false);
  };

  const handleEditClick = (type: AccountType) => {
    setEditingAccountType(type);
    setEditName(type.name);
    setEditDescription(type.description || "");
    setFormErrorEdit(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAccountType) return;

    setIsSubmittingEdit(true);
    setFormErrorEdit(null);
    
    const formData = new FormData(event.currentTarget);
    
    const result = await editAccountTypeAction(editingAccountType.id, formData);

    if (result.success) {
      toast({ title: "Success", description: result.message });
      setIsEditModalOpen(false);
      setEditingAccountType(null);
      await fetchTypes();
    } else {
      if (typeof result.error === 'string') {
        setFormErrorEdit(result.error);
      } else if (result.error && typeof result.error === 'object') {
        const fieldErrors = Object.values(result.error).flat().join(", ");
        setFormErrorEdit(fieldErrors || "An unknown validation error occurred.");
      } else {
        setFormErrorEdit("An unknown error occurred.");
      }
      toast({ title: "Error", description: result.message || "Failed to update account type.", variant: "destructive" });
    }
    setIsSubmittingEdit(false);
  };

  const handleDeleteClick = (typeId: string) => {
    setDeletingAccountTypeId(typeId);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAccountTypeId) return;
    setIsDeleting(true);
    const result = await deleteAccountTypeAction(deletingAccountTypeId);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      await fetchTypes();
    } else {
      toast({ title: "Error", description: result.message || "Failed to delete account type.", variant: "destructive" });
    }
    setIsDeleting(false);
    setIsDeleteAlertOpen(false);
    setDeletingAccountTypeId(null);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Account Types</h1>
        <p className="text-muted-foreground">Add, view, edit, and delete different types of user accounts.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Add New Account Type</CardTitle>
          <CardDescription>Create a new type of account that users can select during registration.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNewSubmit} className="space-y-4">
            {formErrorNew && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Submission Error</AlertTitle>
                <AlertDescription>{formErrorNew}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="newName">Account Type Name</Label>
              <Input
                id="newName"
                name="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Premium Savings, Student Checking"
                required
              />
            </div>
            <div>
              <Label htmlFor="newDescription">Description (Optional)</Label>
              <Textarea
                id="newDescription"
                name="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Briefly describe this account type"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isSubmittingNew}>
              {isSubmittingNew ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Add Account Type
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Existing Account Types</CardTitle>
          <CardDescription>List of currently available account types.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTypes && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading account types...</p>
            </div>
          )}
          {fetchError && !isLoadingTypes && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Types</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}
          {!isLoadingTypes && !fetchError && accountTypes.length === 0 && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Account Types Found</AlertTitle>
                <AlertDescription>There are no account types configured yet. Add one using the form above.</AlertDescription>
            </Alert>
          )}
          {!isLoadingTypes && !fetchError && accountTypes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={type.description || undefined}>{type.description || "N/A"}</TableCell>
                    <TableCell>{formatDateDisplay(type.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Edit Account Type" onClick={() => handleEditClick(type)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Delete Account Type" onClick={() => handleDeleteClick(type.id)} className="text-destructive hover:text-destructive/90">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account Type: {editingAccountType?.name}</DialogTitle>
            <DialogDescription>Update the details for this account type.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            {formErrorEdit && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Update Error</AlertTitle>
                    <AlertDescription>{formErrorEdit}</AlertDescription>
                </Alert>
            )}
            <div>
              <Label htmlFor="editName">Account Type Name</Label>
              <Input
                id="editName"
                name="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description (Optional)</Label>
              <Textarea
                id="editDescription"
                name="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmittingEdit}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmittingEdit}>
                {isSubmittingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account type:
              <span className="font-semibold"> {accountTypes.find(at => at.id === deletingAccountTypeId)?.name || ""}</span>.
              Users currently assigned this account type might need manual updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingAccountTypeId(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
