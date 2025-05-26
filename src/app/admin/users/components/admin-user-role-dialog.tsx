
// src/app/admin/users/components/admin-user-role-dialog.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { updateUserRoleAction } from "@/lib/actions/admin-actions";
import type { AdminUserView, AdminUserRoleDialogProps } from "@/types";

const RoleSchema = z.object({
  role: z.enum(["user", "admin"], { required_error: "Role is required." }),
});
type RoleFormData = z.infer<typeof RoleSchema>;

export function AdminUserRoleDialog({
  isOpen,
  onOpenChange,
  user,
  onSuccess,
}: AdminUserRoleDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      role: user?.role || "user",
    },
  });

  useEffect(() => {
    if (user && isOpen) { 
      form.reset({ role: user.role || "user" });
    }
  }, [user, isOpen, form]);

  const onSubmitHandler = async (values: RoleFormData) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateUserRoleAction(user.uid, values.role);
      if (result.success) {
        toast({ title: "Role Updated", description: result.message });
        onSuccess(); 
        onOpenChange(false); 
      } else {
        toast({
          title: "Update Failed",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Role update error", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Role for {user?.displayName || user?.email}</DialogTitle>
          <DialogDescription>Select the new role for this user.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Role
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
