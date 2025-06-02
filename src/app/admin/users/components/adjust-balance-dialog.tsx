
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { issueManualAdjustmentAction } from "@/lib/actions/admin-actions";
import type { AdminUserView, AdjustBalanceDialogProps } from "@/types";
import { formatCurrency } from "@/lib/utils";

const AdjustBalanceSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  type: z.enum(["credit", "debit"], { required_error: "Adjustment type is required." }),
  description: z.string().min(5, "Description must be at least 5 characters.").max(100, "Description too long."),
});
type AdjustBalanceFormData = z.infer<typeof AdjustBalanceSchema>;


export function AdjustBalanceDialog({
  isOpen,
  onOpenChange,
  user,
  onSuccess,
}: AdjustBalanceDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdjustBalanceFormData>({
    resolver: zodResolver(AdjustBalanceSchema),
    defaultValues: {
      amount: 0,
      type: "credit",
      description: "",
    },
  });
  
  useEffect(() => {
    if (!isOpen) {
      form.reset({ amount: 0, type: "credit", description: "" });
    }
  }, [isOpen, form]);


  const onSubmitHandler = async (values: AdjustBalanceFormData) => {
    if (!user?.uid) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // Pass user's primary currency to the action
      const result = await issueManualAdjustmentAction(
        user.uid,
        values.amount,
        values.type,
        values.description,
        user.primaryCurrency || "USD" // Pass user's primary currency
      );

      if (result.success) {
        toast({ title: "Balance Adjusted", description: result.message });
        onSuccess();
        onOpenChange(false); 
      } else {
        toast({
          title: "Adjustment Failed",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Balance adjustment error", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Balance for {user?.displayName || user?.email}</DialogTitle>
          <DialogDescription>
            Manually credit or debit the user's account. Current Balance: {formatCurrency(user?.balance, user?.primaryCurrency)}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ({user?.primaryCurrency || 'USD'})</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="credit">Credit (Add to balance)</SelectItem>
                      <SelectItem value="debit">Debit (Subtract from balance)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason / Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Bonus credit, Service fee adjustment" {...field} />
                  </FormControl>
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
                Apply Adjustment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
