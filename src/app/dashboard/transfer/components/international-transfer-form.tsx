
// src/app/dashboard/transfer/components/international-transfer-form.tsx
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
import { InternationalTransferSchema, type InternationalTransferData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Globe } from "lucide-react";
import { COTConfirmationDialog } from "./cot-confirmation-dialog";
import { IMFAuthorizationDialog } from "./imf-authorization-dialog";
import { TaxClearanceDialog } from "./tax-clearance-dialog";
import { useAuth } from "@/hooks/use-auth";
import { recordTransferAction } from "@/lib/actions";
import { getPlatformSettingsAction } from "@/lib/actions/admin-settings-actions";
import type { PlatformSettings } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export function InternationalTransferForm() {
  const { toast } = useToast();
  const { user, userProfile, fetchUserProfile } = useAuth();
  const [isSubmittingInitialForm, setIsSubmittingInitialForm] = useState(false);

  const [currentTransferData, setCurrentTransferData] = useState<InternationalTransferData | null>(null);
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

  const form = useForm<InternationalTransferData>({
    resolver: zodResolver(InternationalTransferSchema),
    defaultValues: {
      recipientName: "",
      recipientAccountNumberIBAN: "",
      bankName: "",
      swiftBic: "",
      recipientBankAddress: "",
      country: "",
      amount: 0,
      currency: "USD",
      remarks: "",
    },
  });

  const resetTransferFlow = () => {
    setCurrentTransferData(null);
    setShowCOTDialog(false);
    setShowIMFDialog(false);
    setShowTaxDialog(false);
    form.reset();
    setIsSubmittingInitialForm(false);
  };

  const proceedToNextStep = (currentStep: 'initial' | 'cot' | 'imf' | 'tax') => {
    if (!platformSettings) {
        toast({ title: "Error", description: "Transfer settings not loaded.", variant: "destructive" });
        resetTransferFlow();
        return;
    }

    if (currentStep === 'initial' && platformSettings.requireCOTConfirmation) {
        setShowCOTDialog(true);
    } else if ((currentStep === 'initial' && !platformSettings.requireCOTConfirmation) || currentStep === 'cot') {
        if (platformSettings.requireIMFAuthorization) {
            setShowIMFDialog(true);
        } else {
            proceedToNextStep('imf'); 
        }
    } else if (currentStep === 'imf') {
        if (platformSettings.requireTaxClearance) {
            setShowTaxDialog(true);
        } else {
            handleTaxCleared(); 
        }
    }
  };

  const onSubmitHandler = async (values: InternationalTransferData) => {
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
        description: `You do not have enough balance to cover the transfer amount (${values.currency} ${values.amount.toFixed(2)}) and fees. Required: ${values.currency} ${totalDeduction.toFixed(2)}, Available: ${values.currency} ${userProfile.balance.toFixed(2)}. (Note: Currency conversion not yet implemented, assuming same currency for balance check)`,
        variant: "destructive",
      });
      setIsSubmittingInitialForm(false);
      return;
    }

    setCurrentTransferData(values);
    proceedToNextStep('initial');
  };

  const handleCOTEConfirmed = () => {
    setShowCOTDialog(false);
    proceedToNextStep('cot');
  };

  const handleIMFAuthorized = (imfCode: string) => {
    console.log("IMF Code:", imfCode, "For Transfer:", currentTransferData);
    setShowIMFDialog(false);
    proceedToNextStep('imf');
  };

  const handleTaxCleared = async (taxFile?: File) => {
    setShowTaxDialog(false);
    if (!user || !currentTransferData) {
      toast({ title: "Error", description: "Transfer details missing. Please start over.", variant: "destructive" });
      resetTransferFlow();
      return;
    }
    setIsSubmittingInitialForm(true); 

    const result = await recordTransferAction(user.uid, currentTransferData, {
      imfCode: "mock_imf_code_provided", 
      taxDocumentName: taxFile?.name,
    });

    if (result.success) {
      toast({
        title: "Transfer Successful",
        description: `International transfer of ${currentTransferData.currency} ${currentTransferData.amount.toFixed(2)} to ${currentTransferData.recipientName} processed. New balance (approx.): $${result.newBalance?.toFixed(2)} (Note: Currency conversion not yet implemented)`,
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
            name="recipientAccountNumberIBAN"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient's Account Number / IBAN</FormLabel>
                <FormControl>
                  <Input placeholder="Enter IBAN or Account Number" {...field} />
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
                <FormLabel>Recipient's Bank Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Global Financial Services" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="swiftBic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SWIFT/BIC Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., CITIUS33XXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient's Country</FormLabel>
                <FormControl>
                  {/* TODO: Replace with a Select component for better UX */}
                  <Input placeholder="e.g., United States" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recipientBankAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient's Bank Address (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Full address of the recipient's bank" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Amount to Transfer</FormLabel>
                  <FormControl>
                      <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormDescription>Available balance: {userProfile ? `$${userProfile.balance.toFixed(2)}` : 'Loading...'}</FormDescription>
                  <FormMessage />
                  </FormItem>
              )}
              />
              <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                      <Input placeholder="e.g., USD" {...field} />
                  </FormControl>
                   <FormDescription>Specify transfer currency.</FormDescription>
                  <FormMessage />
                  </FormItem>
              )}
              />
          </div>
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Invoice payment" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmittingInitialForm || showCOTDialog || showIMFDialog || showTaxDialog || isLoadingSettings} className="w-full sm:w-auto">
            {isSubmittingInitialForm && !(showCOTDialog || showIMFDialog || showTaxDialog) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Globe className="mr-2 h-4 w-4" />
            )}
            Initiate Transfer
          </Button>
        </form>
      </Form>

      {currentTransferData && (
        <>
          <COTConfirmationDialog
            isOpen={showCOTDialog}
            onOpenChange={(isOpen) => { if (!isOpen && !showIMFDialog && !showTaxDialog) resetTransferFlow(); else setShowCOTDialog(isOpen); }}
            transferData={currentTransferData}
            onConfirm={handleCOTEConfirmed}
            onCancel={handleAuthorizationCancel}
          />
          <IMFAuthorizationDialog
            isOpen={showIMFDialog}
            onOpenChange={(isOpen) => { if (!isOpen && !showTaxDialog) resetTransferFlow(); else setShowIMFDialog(isOpen); }}
            onConfirm={handleIMFAuthorized}
            onCancel={handleAuthorizationCancel}
          />
          <TaxClearanceDialog
            isOpen={showTaxDialog}
            onOpenChange={(isOpen) => { if (!isOpen) resetTransferFlow(); else setShowTaxDialog(isOpen); }}
            onConfirm={handleTaxCleared}
            onCancel={handleAuthorizationCancel}
          />
        </>
      )}
    </>
  );
}
