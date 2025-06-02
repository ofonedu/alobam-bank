
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, AlertTriangle, ListPlus, ShieldCheck, KeyRound, FileUp, LayoutTemplate, Shapes, DraftingCompass, Mail, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPlatformSettingsAction, updatePlatformSettingsAction } from "@/lib/actions/admin-settings-actions";
import type { PlatformSettings } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeneralSettingsSchema, KycSettingsSchema, LoanSettingsSchema, type GeneralSettingsFormData, type KycSettingsFormData, type LoanSettingsFormData } from "@/lib/schemas";
import { Form, FormField, FormItem, FormControl, FormMessage, FormDescription } from "@/components/ui/form"; 

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingKyc, setIsSavingKyc] = useState(false);
  const [isSavingLoan, setIsSavingLoan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generalForm = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(GeneralSettingsSchema),
    defaultValues: {
      platformName: "Wohana Funds",
      supportEmail: "support@wohanafunds.com",
      maintenanceMode: false,
      cotPercentage: 0.01, // Default 1%
      requireCOTConfirmation: false,
      requireIMFAuthorization: false,
      requireTaxClearance: false,
      platformLogoText: "Wohana Funds",
      platformLogoIcon: "ShieldCheck",
      resendApiKey: "",
      resendFromEmail: "",
    },
  });
  const kycForm = useForm<KycSettingsFormData>({
    resolver: zodResolver(KycSettingsSchema),
    defaultValues: { autoApproveKycRiskLevel: "none", aiKycEnabled: true },
  });
  const loanForm = useForm<LoanSettingsFormData>({
    resolver: zodResolver(LoanSettingsSchema),
    defaultValues: { maxLoanAmount: 100000, defaultInterestRate: 0.05 },
  });

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      setError(null);
      const result = await getPlatformSettingsAction();
      if (result.success && result.settings) {
        generalForm.reset({
          platformName: result.settings.platformName || "Wohana Funds",
          supportEmail: result.settings.supportEmail || "support@wohanafunds.com",
          maintenanceMode: result.settings.maintenanceMode || false,
          cotPercentage: result.settings.cotPercentage === undefined ? 0.01 : result.settings.cotPercentage,
          requireCOTConfirmation: result.settings.requireCOTConfirmation || false,
          requireIMFAuthorization: result.settings.requireIMFAuthorization || false,
          requireTaxClearance: result.settings.requireTaxClearance || false,
          platformLogoText: result.settings.platformLogoText || "Wohana Funds",
          platformLogoIcon: result.settings.platformLogoIcon || "ShieldCheck",
          resendApiKey: result.settings.resendApiKey || "",
          resendFromEmail: result.settings.resendFromEmail || "",
        });
        kycForm.reset({
          autoApproveKycRiskLevel: result.settings.autoApproveKycRiskLevel || "none",
          aiKycEnabled: result.settings.aiKycEnabled === undefined ? true : result.settings.aiKycEnabled,
        });
        loanForm.reset({
          maxLoanAmount: result.settings.maxLoanAmount || 100000,
          defaultInterestRate: result.settings.defaultInterestRate || 0.05,
        });
      } else {
        setError(result.error || "Failed to load settings.");
        toast({ title: "Error", description: result.error || "Failed to load settings.", variant: "destructive" });
      }
      setIsLoading(false);
    }
    loadSettings();
  }, [generalForm, kycForm, loanForm, toast]);

  const handleSave = async (data: Partial<PlatformSettings>, savingSetter: React.Dispatch<React.SetStateAction<boolean>>, section: string) => {
    savingSetter(true);
    const result = await updatePlatformSettingsAction(data);
    if (result.success) {
      toast({ title: "Success", description: `${section} settings saved.` });
      if (section === "General & Platform" || section === "Transfer Authorization" || section === "Email (Resend)") { // Reload if logo or core platform settings change
        // Consider more granular updates or context instead of full reload for better UX
        // For now, reload is simple and ensures all parts of the app get the new settings.
        window.location.reload(); 
      }
    } else {
      toast({ title: "Error", description: result.message || `Failed to save ${section.toLowerCase()} settings.`, variant: "destructive" });
    }
    savingSetter(false);
  };

  const onGeneralSubmit = (data: GeneralSettingsFormData) => handleSave(data, setIsSavingGeneral, "General, Transfer & Email");
  const onKycSubmit = (data: KycSettingsFormData) => handleSave(data, setIsSavingKyc, "KYC");
  const onLoanSubmit = (data: LoanSettingsFormData) => handleSave(data, setIsSavingLoan, "Loan");

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Loading settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Settings</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure platform-wide settings and parameters.</p>
      </div>
      
      <Form {...generalForm}>
        <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-0">
          <Card>
            <CardHeader>
              <CardTitle>General & Platform Settings</CardTitle>
              <CardDescription>Basic platform information, branding, fees and maintenance mode.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={generalForm.control}
                  name="platformName"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="platformName">Platform Name</Label>
                      <FormControl><Input id="platformName" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={generalForm.control}
                  name="supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <FormControl><Input id="supportEmail" type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={generalForm.control}
                  name="platformLogoText"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="platformLogoText">Platform Logo Text</Label>
                      <FormControl><Input id="platformLogoText" placeholder="e.g., Wohana Funds" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={generalForm.control}
                  name="platformLogoIcon"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="platformLogoIcon">Platform Logo Icon Name (Lucide)</Label>
                      <FormControl><Input id="platformLogoIcon" placeholder="e.g., ShieldCheck, Banknote" {...field} /></FormControl>
                      <p className="text-xs text-muted-foreground pt-1">
                        Enter a valid Lucide icon name from <a href="https://lucide.dev/" target="_blank" rel="noopener noreferrer" className="underline text-primary">lucide.dev</a>. Default: ShieldCheck.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                 <FormField
                  control={generalForm.control}
                  name="cotPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="cotPercentage" className="flex items-center gap-1">
                        <Percent className="h-4 w-4 text-muted-foreground" />Cost of Transfer (COT) Percentage
                      </Label>
                      <FormControl>
                        <Input
                          id="cotPercentage"
                          type="number"
                          step="0.01"
                          placeholder="e.g., 0.5 for 0.5%"
                          {...field}
                          value={field.value !== undefined ? (field.value * 100).toString() : ''} // Display as %
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            field.onChange(isNaN(val) ? undefined : val / 100); // Store as decimal
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Enter percentage (e.g., for 1%, enter 1).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={generalForm.control}
                    name="maintenanceMode"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-2 md:mt-0">
                        <div className="space-y-0.5">
                            <Label htmlFor="maintenance-mode" className="text-base">Maintenance Mode</Label>
                            <FormDescription className="text-xs">Temporarily disable user access.</FormDescription>
                        </div>
                        <FormControl><Switch id="maintenance-mode" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                    )}
                />
              </div>

              <p className="text-xs text-muted-foreground pt-2">Note: To change the main browser tab icon (favicon), replace the `favicon.ico` file in the `public` directory of your project and redeploy the application.</p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
                <CardTitle>Transfer Authorization Settings</CardTitle>
                <CardDescription>Control which authorization steps are required for fund transfers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    <FormField
                        control={generalForm.control}
                        name="requireCOTConfirmation"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm col-span-1">
                            <div className="space-y-0.5">
                            <Label htmlFor="requireCOTConfirmation" className="flex items-center gap-1 text-base"><ShieldCheck className="h-4 w-4 text-muted-foreground"/>Require COT Confirmation</Label>
                            <FormDescription className="text-xs">If enabled, users must confirm Cost of Transfer.</FormDescription>
                            </div>
                            <FormControl><Switch id="requireCOTConfirmation" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={generalForm.control}
                        name="requireIMFAuthorization"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm col-span-1">
                            <div className="space-y-0.5">
                            <Label htmlFor="requireIMFAuthorization" className="flex items-center gap-1 text-base"><KeyRound className="h-4 w-4 text-muted-foreground"/>Require IMF Authorization</Label>
                            <FormDescription className="text-xs">If enabled, users must provide an IMF code.</FormDescription>
                            </div>
                            <FormControl><Switch id="requireIMFAuthorization" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={generalForm.control}
                        name="requireTaxClearance"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm col-span-1">
                            <div className="space-y-0.5">
                            <Label htmlFor="requireTaxClearance" className="flex items-center gap-1 text-base"><FileUp className="h-4 w-4 text-muted-foreground"/>Require Tax Clearance</Label>
                             <FormDescription className="text-xs">If enabled, users must provide a Tax code.</FormDescription>
                            </div>
                            <FormControl><Switch id="requireTaxClearance" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                        )}
                    />
                </div>
            </CardContent>
          </Card>

           <Card className="mt-6">
            <CardHeader>
              <CardTitle>Email (Resend) Settings</CardTitle>
              <CardDescription>Configure Resend API for sending transactional emails. Remember to verify your sending domain in Resend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={generalForm.control}
                name="resendApiKey"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="resendApiKey">Resend API Key</Label>
                    <FormControl><Input id="resendApiKey" type="password" placeholder="re_xxxxxxxxxxxxxxx" {...field} /></FormControl>
                    <FormDescription>Your API key from Resend dashboard.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={generalForm.control}
                name="resendFromEmail"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="resendFromEmail">"From" Email Address</Label>
                    <FormControl><Input id="resendFromEmail" type="email" placeholder="noreply@yourdomain.com" {...field} /></FormControl>
                    <FormDescription>The email address emails will be sent from (must be verified in Resend).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
             <CardContent> 
                <Button type="submit" disabled={isSavingGeneral}>
                    {isSavingGeneral ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save General, Transfer & Email Settings
                </Button>
            </CardContent>
          </Card>
        </form>
      </Form>

      <Card>
        <CardHeader>
            <CardTitle>Site Content Management</CardTitle>
            <CardDescription>Manage content for public facing pages and user options.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 flex flex-wrap gap-2">
            <Button asChild variant="outline">
                <Link href="/admin/settings/landing-page" className="flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4" /> Manage Landing Page Content
                </Link>
            </Button>
             <Button asChild variant="outline">
                <Link href="/admin/settings/account-types" className="flex items-center gap-2">
                    <ListPlus className="h-4 w-4" /> Manage Account Types
                </Link>
            </Button>
             <Button asChild variant="outline">
                <Link href="/admin/settings/email-templates" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email Templates (Placeholder)
                </Link>
            </Button>
        </CardContent>
      </Card>

      <Form {...kycForm}>
        <form onSubmit={kycForm.handleSubmit(onKycSubmit)} className="space-y-0">
          <Card>
            <CardHeader>
              <CardTitle>KYC Settings</CardTitle>
              <CardDescription>Configure KYC automation and AI features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6 items-start">
                  <FormField
                    control={kycForm.control}
                    name="autoApproveKycRiskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="autoApproveKycRiskLevel">Auto-Approve Risk Level</Label>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger id="autoApproveKycRiskLevel">
                              <SelectValue placeholder="Select risk level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Manual Approval)</SelectItem>
                            <SelectItem value="low">Low Risk</SelectItem>
                            <SelectItem value="medium">Medium Risk</SelectItem>
                            <SelectItem value="high">High Risk (Not Recommended)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs pt-1">Set risk level for automatic KYC approval.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                        control={kycForm.control}
                        name="aiKycEnabled"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-2 md:mt-0">
                            <div className="space-y-0.5">
                                <Label htmlFor="ai-kyc-enabled" className="text-base">AI-Enhanced KYC</Label>
                                <FormDescription className="text-xs">Enable AI for risk assessment during KYC.</FormDescription>
                            </div>
                            <FormControl><Switch id="ai-kyc-enabled" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                        )}
                    />
              </div>
              <Button type="submit" disabled={isSavingKyc}>
                {isSavingKyc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save KYC Settings
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>
      
      <Form {...loanForm}>
        <form onSubmit={loanForm.handleSubmit(onLoanSubmit)} className="space-y-0">
          <Card>
            <CardHeader>
              <CardTitle>Loan Settings</CardTitle>
              <CardDescription>Set default parameters for loan applications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={loanForm.control}
                    name="maxLoanAmount"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="maxLoanAmount">Max Loan Amount ($)</Label>
                        <FormControl><Input id="maxLoanAmount" type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loanForm.control}
                    name="defaultInterestRate"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="defaultInterestRate">Default Interest Rate (e.g., 0.05 for 5%)</Label>
                        <FormControl><Input id="defaultInterestRate" type="number" step="0.001" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              <Button type="submit" disabled={isSavingLoan}>
                {isSavingLoan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Loan Settings
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
