
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
            requireTaxClearance: false,
            cotPercentage: 0.01, // Default if not set
        });
        console.error("Failed to load platform settings for transfer form:", result.error);
        toast({
            title: "Warning",
            description: "Could not load transfer settings. Some authorization steps may behave unexpectedly.",
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

  const decideAndExecuteNextStep = (
    dataForTransfer: LocalTransferData, 
    authsSoFar: typeof collectedAuthCodes
  ) => {
    setIsSubmittingInitialForm(false); // Allow UI to respond before next dialog
    if (!platformSettings) {
      toast({ title: "Error", description: "Platform settings not loaded. Cannot proceed.", variant: "destructive" });
      resetTransferFlow();
      return;
    }
    
    if (platformSettings.requireCOTConfirmation && !authsSoFar.cotCode) {
      setCurrentTransferData(dataForTransfer); 
      setShowCOTDialog(true);
      return;
    }
    if (platformSettings.requireIMFAuthorization && !authsSoFar.imfCode) {
      setCurrentTransferData(dataForTransfer);
      setShowIMFDialog(true);
      return;
    }
    if (platformSettings.requireTaxClearance && !authsSoFar.taxCode) {
      setCurrentTransferData(dataForTransfer);
      setShowTaxDialog(true);
      return;
    }
    finalizeTransfer(dataForTransfer, authsSoFar);
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
    setCurrentTransferData(values);

    const cotPercentage = platformSettings.cotPercentage || 0.01;
    const cotAmount = values.amount * cotPercentage;
    const totalDeduction = values.amount + cotAmount;

    if (userProfile.balance < totalDeduction) {
      toast({
        title: "Insufficient Funds",
        description: `You do not have enough balance to cover the transfer amount ($${values.amount.toFixed(2)}) and estimated fees ($${cotAmount.toFixed(2)}). Required: $${totalDeduction.toFixed(2)}, Available: $${userProfile.balance.toFixed(2)}.`,
        variant: "destructive",
      });
      setIsSubmittingInitialForm(false);
      return;
    }
    
    decideAndExecuteNextStep(values, {});
  };

  const handleCOTEConfirmed = (cotCode: string) => {
    setShowCOTDialog(false);
    if(currentTransferData) {
      const updatedAuths = { ...collectedAuthCodes, cotCode };
      setCollectedAuthCodes(updatedAuths);
      decideAndExecuteNextStep(currentTransferData, updatedAuths);
    } else {
       toast({ title: "Error", description: "Transfer details lost. Please start over.", variant: "destructive" });
       resetTransferFlow();
    }
  };

  const handleIMFAuthorized = (imfCode: string) => {
    setShowIMFDialog(false);
     if(currentTransferData) {
      const updatedAuths = { ...collectedAuthCodes, imfCode };
      setCollectedAuthCodes(updatedAuths);
      decideAndExecuteNextStep(currentTransferData, updatedAuths);
    } else {
       toast({ title: "Error", description: "Transfer details lost. Please start over.", variant: "destructive" });
       resetTransferFlow();
    }
  };

  const handleTaxCodeEntered = async (taxCode: string) => {
    setShowTaxDialog(false); 
     if(currentTransferData) {
      const updatedAuths = { ...collectedAuthCodes, taxCode };
      setCollectedAuthCodes(updatedAuths);
      decideAndExecuteNextStep(currentTransferData, updatedAuths);
    } else {
       toast({ title: "Error", description: "Transfer details lost. Please start over.", variant: "destructive" });
       resetTransferFlow();
    }
  };
  
  const finalizeTransfer = async (
    dataToFinalize: LocalTransferData, 
    authCodesToFinalize: typeof collectedAuthCodes
  ) => {
    if (!user) {
      toast({ title: "Error", description: "User session lost. Please log in and try again.", variant: "destructive" });
      resetTransferFlow();
      return;
    }
    setIsSubmittingInitialForm(true);

    const result = await recordTransferAction(user.uid, dataToFinalize, authCodesToFinalize, platformSettings?.cotPercentage);

    if (result.success) {
      toast({
        title: "Transfer Successful",
        description: `Local transfer of $${dataToFinalize.amount.toFixed(2)} to ${dataToFinalize.recipientName} processed. New balance: $${result.newBalance?.toFixed(2)}`,
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

  const handleDialogCancel = () => {
    toast({
      title: "Transfer Cancelled",
      description: "The fund transfer process was cancelled by the user.",
      variant: "default",
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

  const anyDialogOpen = showCOTDialog || showIMFDialog || showTaxDialog;

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
                  <Input placeholder="John Doe" {...field} disabled={isSubmittingInitialForm || anyDialogOpen} />
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
                  <Input placeholder="Enter account number" {...field} disabled={isSubmittingInitialForm || anyDialogOpen} />
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
                  <Input placeholder="e.g., City Bank" {...field} disabled={isSubmittingInitialForm || anyDialogOpen} />
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
                  <Input placeholder="Enter 9-digit routing number" {...field} disabled={isSubmittingInitialForm || anyDialogOpen} />
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
                  <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={isSubmittingInitialForm || anyDialogOpen} />
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
                  <Textarea placeholder="e.g., Payment for services" {...field} disabled={isSubmittingInitialForm || anyDialogOpen} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmittingInitialForm || anyDialogOpen || isLoadingSettings} className="w-full sm:w-auto">
            {isSubmittingInitialForm && !anyDialogOpen ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSubmittingInitialForm && anyDialogOpen ? "Processing..." : "Initiate Transfer"}
          </Button>
        </form>
      </Form>

      {currentTransferData && platformSettings && (
        <>
          <COTConfirmationDialog
            isOpen={showCOTDialog}
            onOpenChange={(open) => {
                if (!open) { handleDialogCancel(); } // If closed by user, cancel flow
                setShowCOTDialog(open);
            }}
            transferData={currentTransferData}
            cotPercentage={platformSettings.cotPercentage ?? 0.01}
            onConfirm={handleCOTEConfirmed}
            onCancel={handleDialogCancel}
          />
          <IMFAuthorizationDialog
            isOpen={showIMFDialog}
            onOpenChange={(open) => {
                if (!open) { handleDialogCancel(); }
                setShowIMFDialog(open);
            }}
            onConfirm={handleIMFAuthorized}
            onCancel={handleDialogCancel}
          />
          <TaxClearanceDialog
            isOpen={showTaxDialog}
            onOpenChange={(open) => {
                if (!open) { handleDialogCancel(); }
                setShowTaxDialog(open);
            }}
            onConfirm={handleTaxCodeEntered}
            onCancel={handleDialogCancel}
          />
        </>
      )}
    </>
  );
}
