
// src/app/dashboard/transfer/components/local-transfer-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocalTransferSchema, type LocalTransferData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Send } from "lucide-react";
import { COTConfirmationDialog } from "./cot-confirmation-dialog";
import { IMFAuthorizationDialog } from "./imf-authorization-dialog";
import { TaxClearanceDialog } from "./tax-clearance-dialog";
import { useAuth } from "@/hooks/use-auth";
import { recordTransferAction } from "@/lib/actions";
import { getPlatformSettingsAction } from "@/lib/actions/admin-settings-actions";
import type { PlatformSettings } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export function LocalTransferForm() {
  const { toast } = useToast();
  const { user, userProfile, fetchUserProfile } = useAuth();
  const [isSubmittingInitialForm, setIsSubmittingInitialForm] = useState(false);
  
  const [currentTransferData, setCurrentTransferData] = useState<LocalTransferData | null>(null);
  const [collectedAuthCodes, setCollectedAuthCodes] = useState<{cotCode?: string; imfCode?: string; taxCode?: string}>({});

  const [showCOTDialog, setShowCOTDialog] = useState(false);
  const [showIMFDialog, setShowIMFDialog] = useState(false);
  const [showTaxDialog, setShowTaxDialog] = useState(false);

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadPlatformSettings() {
      setIsLoadingSettings(true);
      const result = await getPlatformSettingsAction();
      if (result.success && result.settings) {
        setPlatformSettings(result.settings);
      } else {
        setPlatformSettings({ 
            requireCOTConfirmation: false, 
            requireIMFAuthorization: false, 
            requireTaxClearance: false 
        });
        console.error("Failed to load platform settings for transfer form:", result.error);
        toast({
            title: "Warning",
            description: "Could not load transfer settings. Some authorization steps may be skipped.",
            variant: "destructive"
        })
      }
      setIsLoadingSettings(false);
    }
    loadPlatformSettings();
  }, [toast]);


  const form = useForm<LocalTransferData>({
    resolver: zodResolver(LocalTransferSchema),
    defaultValues: {
      recipientName: "",
      recipientAccountNumber: "",
      bankName: "",
      routingNumber: "",
      amount: 0,
      remarks: "",
    },
  });

  const resetTransferFlow = () => {
    setCurrentTransferData(null);
    setCollectedAuthCodes({});
    setShowCOTDialog(false);
    setShowIMFDialog(false);
    setShowTaxDialog(false);
    form.reset();
    setIsSubmittingInitialForm(false);
  };

  const proceedToNextStep = () => {
    if (!currentTransferData || !platformSettings) {
      // This case should ideally not be hit if currentTransferData is set before calling this
      resetTransferFlow();
      return;
    }

    // Check COT
    if (platformSettings.requireCOTConfirmation && !showCOTDialog && !collectedAuthCodes.cotCode) {
      setShowCOTDialog(true);
      return;
    }
    // Check IMF (after COT or if COT not required/done)
    if (platformSettings.requireIMFAuthorization && !showIMFDialog && !collectedAuthCodes.imfCode) {
      setShowCOTDialog(false); // Ensure previous dialog is closed
      setShowIMFDialog(true);
      return;
    }
    // Check Tax (after IMF or if IMF not required/done)
    if (platformSettings.requireTaxClearance && !showTaxDialog && !collectedAuthCodes.taxCode) {
      setShowCOTDialog(false);
      setShowIMFDialog(false);
      setShowTaxDialog(true);
      return;
    }

    // All required steps are done (or not required), finalize
    setShowCOTDialog(false);
    setShowIMFDialog(false);
    setShowTaxDialog(false);
    finalizeTransfer();
  };


  const onSubmitHandler = async (values: LocalTransferData) => {
    if (!user || userProfile === null) {
      toast({ title: "Error", description: "User not loaded. Please try again.", variant: "destructive" });
      return;
    }
    if (isLoadingSettings || !platformSettings) {
      toast({ title: "Please wait", description: "Transfer settings are still loading.", variant: "default" });
      return;
    }
    setIsSubmittingInitialForm(true); 

    const MOCK_COT_PERCENTAGE = 0.01; 
    const cotAmount = values.amount * MOCK_COT_PERCENTAGE;
    const totalDeduction = values.amount + cotAmount;

    if (userProfile.balance < totalDeduction) {
      toast({
        title: "Insufficient Funds",
        description: `You do not have enough balance to cover the transfer amount and fees. Required: $${totalDeduction.toFixed(2)}, Available: $${userProfile.balance.toFixed(2)}.`,
        variant: "destructive",
      });
      setIsSubmittingInitialForm(false);
      return;
    }
    
    setCurrentTransferData(values); // Set data here, then proceed
    // Delay slightly to ensure state update before proceedToNextStep reads it
    setTimeout(() => proceedToNextStep(), 0);
  };

  const handleCOTEConfirmed = (cotCode: string) => {
    setCollectedAuthCodes(prev => ({ ...prev, cotCode }));
    setShowCOTDialog(false);
    proceedToNextStep();
  };

  const handleIMFAuthorized = (imfCode: string) => {
    setCollectedAuthCodes(prev => ({ ...prev, imfCode }));
    setShowIMFDialog(false);
    proceedToNextStep();
  };

  const handleTaxCodeEntered = async (taxCode: string) => {
    setCollectedAuthCodes(prev => ({ ...prev, taxCode }));
    setShowTaxDialog(false); 
    proceedToNextStep(); // This will now lead to finalizeTransfer
  };
  
  const finalizeTransfer = async () => {
    if (!user || !currentTransferData) {
      toast({ title: "Error", description: "Transfer details missing. Please start over.", variant: "destructive" });
      resetTransferFlow();
      return;
    }
    setIsSubmittingInitialForm(true); // Keep true or set again if it was reset by dialogs closing

    const result = await recordTransferAction(user.uid, currentTransferData, collectedAuthCodes);

    if (result.success) {
      toast({
        title: "Transfer Successful",
        description: `Local transfer of $${currentTransferData.amount.toFixed(2)} to ${currentTransferData.recipientName} processed. New balance: $${result.newBalance?.toFixed(2)}`,
        variant: "default",
      });
      await fetchUserProfile(user.uid); 
    } else {
      toast({
        title: "Transfer Failed",
        description: result.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    resetTransferFlow();
  };

  const handleAuthorizationCancel = () => {
    toast({
      title: "Transfer Cancelled",
      description: "The fund transfer process was cancelled.",
      variant: "destructive",
    });
    resetTransferFlow();
  };


  if (isLoadingSettings) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/3" />
        </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-6">
          <FormField
            control={form.control}
            name="recipientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient's Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recipientAccountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient's Account Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter account number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient's Bank Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., City Bank" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="routingNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Routing Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter 9-digit routing number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount to Transfer ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl>
                <FormDescription>
                  Available balance: {userProfile ? `$${userProfile.balance.toFixed(2)}` : 'Loading...'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Payment for services" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmittingInitialForm || showCOTDialog || showIMFDialog || showTaxDialog || isLoadingSettings} className="w-full sm:w-auto">
            {isSubmittingInitialForm && !(showCOTDialog || showIMFDialog || showTaxDialog) ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Initiate Transfer
          </Button>
        </form>
      </Form>

      {currentTransferData && (
        <>
          <COTConfirmationDialog
            isOpen={showCOTDialog}
            onOpenChange={(open) => { if (!open) handleAuthorizationCancel(); else setShowCOTDialog(open); }}
            transferData={currentTransferData}
            onConfirm={handleCOTEConfirmed}
            onCancel={handleAuthorizationCancel}
          />
          <IMFAuthorizationDialog
            isOpen={showIMFDialog}
            onOpenChange={(open) => { if (!open) handleAuthorizationCancel(); else setShowIMFDialog(open);}}
            onConfirm={handleIMFAuthorized}
            onCancel={handleAuthorizationCancel}
          />
          <TaxClearanceDialog
            isOpen={showTaxDialog}
            onOpenChange={(open) => { if (!open) handleAuthorizationCancel(); else setShowTaxDialog(open);}}
            onConfirm={handleTaxCodeEntered} // Changed from handleTaxCleared
            onCancel={handleAuthorizationCancel}
          />
        </>
      )}
    </>
  );
}
