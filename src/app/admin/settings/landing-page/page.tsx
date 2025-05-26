
// src/app/admin/settings/landing-page/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm, type SubmitHandler, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, AlertTriangle, Image as ImageIcon, PlusCircle, Trash2, Link2, Columns, MessageSquareIcon, ExternalLink, Copyright } from "lucide-react";
import {
  HeroSectionSchema, type HeroSectionFormData,
  FeaturesOverviewSectionSchema, type FeaturesOverviewFormData,
  AccountOfferingsSectionSchema, type AccountOfferingsFormData,
  DebitCardPromotionSchema, type DebitCardPromotionFormData,
  InvestmentOpportunitiesSchema, type InvestmentOpportunitiesFormData,
  LoanMortgageServicesSchema, type LoanMortgageServicesFormData,
  CustomerFeedbackSchema, type CustomerFeedbackFormData,
  FinalCTASchema, type FinalCTAFormData,
  HeaderNavLinksSchema, type HeaderNavLinksFormData,
  FooterContentSchema, type FooterContentFormData,
  type FeatureItemFormData, type AccountOfferingItemFormData, type NavLinkItemFormData, type FooterLinkColumnFormData, type SocialMediaLinkFormData
} from "@/lib/schemas";
import { getLandingPageContentAction, updateLandingPageSectionAction } from "@/lib/actions/admin-settings-actions";
import type { LandingPageContent } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function LandingPageEditor() {
  const { toast } = useToast();
  const [landingPageContent, setLandingPageContent] = useState<LandingPageContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);
  const [isSavingAccounts, setIsSavingAccounts] = useState(false);
  const [isSavingDebitCard, setIsSavingDebitCard] = useState(false);
  const [isSavingInvestments, setIsSavingInvestments] = useState(false);
  const [isSavingLoanMortgage, setIsSavingLoanMortgage] = useState(false);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [isSavingFinalCTA, setIsSavingFinalCTA] = useState(false);
  const [isSavingHeaderNav, setIsSavingHeaderNav] = useState(false);
  const [isSavingFooter, setIsSavingFooter] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const heroForm = useForm<HeroSectionFormData>({
    resolver: zodResolver(HeroSectionSchema),
    defaultValues: { headline: "", subheading: "", ctaButtonText: "", learnMoreLink: "#", imageUrl: "", imageAlt: "" },
  });

  const featuresForm = useForm<FeaturesOverviewFormData>({
    resolver: zodResolver(FeaturesOverviewSectionSchema),
    defaultValues: { headline: "", subheading: "", features: [] },
  });
  const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({
    control: featuresForm.control,
    name: "features",
  });

  const accountsForm = useForm<AccountOfferingsFormData>({
    resolver: zodResolver(AccountOfferingsSectionSchema),
    defaultValues: { headline: "", subheading: "", accounts: [] },
  });
  const { fields: accountFields, append: appendAccount, remove: removeAccount } = useFieldArray({
    control: accountsForm.control,
    name: "accounts",
  });

  const debitCardForm = useForm<DebitCardPromotionFormData>({ 
    resolver: zodResolver(DebitCardPromotionSchema),
    defaultValues: { headline: "", description: "", imageUrl: "", imageAlt: "", ctaButtonText: "", ctaButtonLink: "#"},
  });

  const investmentForm = useForm<InvestmentOpportunitiesFormData>({ 
    resolver: zodResolver(InvestmentOpportunitiesSchema),
    defaultValues: { headline: "", description: "", imageUrl: "", imageAlt: "", ctaButtonText: "", ctaButtonLink: "#"},
  });

  const loanMortgageForm = useForm<LoanMortgageServicesFormData>({
    resolver: zodResolver(LoanMortgageServicesSchema),
    defaultValues: { headline: "", description: "", ctaButtonText: "", ctaButtonLink: "#", imageUrl: "", imageAlt: "" },
  });

  const feedbackForm = useForm<CustomerFeedbackFormData>({
    resolver: zodResolver(CustomerFeedbackSchema),
    defaultValues: { headline: "", ctaButtonText: "", ctaButtonLink: "#" },
  });

  const finalCtaForm = useForm<FinalCTAFormData>({
    resolver: zodResolver(FinalCTASchema),
    defaultValues: { headline: "", subheading: "", ctaButtonText: "", ctaButtonLink: "#" },
  });

  const headerNavForm = useForm<HeaderNavLinksFormData>({
    resolver: zodResolver(HeaderNavLinksSchema),
    defaultValues: { navLinks: [] },
  });
  const { fields: headerLinkFields, append: appendHeaderLink, remove: removeHeaderLink } = useFieldArray({
    control: headerNavForm.control,
    name: "navLinks",
  });

  const footerForm = useForm<FooterContentFormData>({
    resolver: zodResolver(FooterContentSchema),
    defaultValues: { footerDescription: "", footerCopyright: "", footerQuickLinkColumns: [], footerSocialMediaLinks: [] },
  });
  const { fields: quickLinkColumnFields, append: appendQuickLinkColumn, remove: removeQuickLinkColumn } = useFieldArray({
    control: footerForm.control,
    name: "footerQuickLinkColumns",
  });
  const { fields: socialMediaLinkFields, append: appendSocialMediaLink, remove: removeSocialMediaLink } = useFieldArray({
    control: footerForm.control,
    name: "footerSocialMediaLinks",
  });


  useEffect(() => {
    async function loadContent() {
      setIsLoadingContent(true);
      setLoadError(null);
      const result = await getLandingPageContentAction();
      if (result.success && result.content) {
        setLandingPageContent(result.content);
        heroForm.reset(result.content.heroSection || heroForm.formState.defaultValues);
        featuresForm.reset(result.content.featuresOverview || featuresForm.formState.defaultValues);
        accountsForm.reset(result.content.accountOfferings || accountsForm.formState.defaultValues);
        debitCardForm.reset(result.content.debitCardPromotion || debitCardForm.formState.defaultValues);
        investmentForm.reset(result.content.investmentOpportunities || investmentForm.formState.defaultValues);
        loanMortgageForm.reset(result.content.loanMortgageServices || loanMortgageForm.formState.defaultValues);
        feedbackForm.reset(result.content.customerFeedback || feedbackForm.formState.defaultValues);
        finalCtaForm.reset(result.content.finalCTA || finalCtaForm.formState.defaultValues);
        headerNavForm.reset({ navLinks: result.content.headerNavLinks || [] });
        footerForm.reset(result.content.footerContent || footerForm.formState.defaultValues);

      } else if (!result.success) {
        setLoadError(result.error || "Failed to load landing page content.");
      }
      setIsLoadingContent(false);
    }
    loadContent();
  }, [heroForm, featuresForm, accountsForm, debitCardForm, investmentForm, loanMortgageForm, feedbackForm, finalCtaForm, headerNavForm, footerForm]);

  const handleSectionSave = async (
    sectionKey: keyof LandingPageContent | "headerNavLinks" | "footerContent", // Special handling for header/footer
    data: any,
    setSavingState: React.Dispatch<React.SetStateAction<boolean>>,
    formInstance: any 
  ) => {
    setSavingState(true);
    let dataToSave = data;
    if (sectionKey === "headerNavLinks" && data.navLinks !== undefined) {
      dataToSave = data.navLinks; // Pass the array directly for headerNavLinks
    } else if (sectionKey === "footerContent") {
      dataToSave = data; // Pass the whole object for footerContent
    }


    const result = await updateLandingPageSectionAction(sectionKey as keyof LandingPageContent, dataToSave);
    if (result.success) {
      toast({ title: `${String(sectionKey).charAt(0).toUpperCase() + String(sectionKey).slice(1).replace(/([A-Z])/g, ' $1')} Saved`, description: result.message });
      const updatedContent = await getLandingPageContentAction();
      if (updatedContent.success && updatedContent.content) {
        setLandingPageContent(updatedContent.content);
         // Re-reset forms to ensure they reflect the latest state if any defaults were applied server-side
        if (sectionKey === "heroSection") heroForm.reset(updatedContent.content.heroSection || heroForm.formState.defaultValues);
        if (sectionKey === "featuresOverview") featuresForm.reset(updatedContent.content.featuresOverview || featuresForm.formState.defaultValues);
        if (sectionKey === "accountOfferings") accountsForm.reset(updatedContent.content.accountOfferings || accountsForm.formState.defaultValues);
        if (sectionKey === "debitCardPromotion") debitCardForm.reset(updatedContent.content.debitCardPromotion || debitCardForm.formState.defaultValues);
        if (sectionKey === "investmentOpportunities") investmentForm.reset(updatedContent.content.investmentOpportunities || investmentForm.formState.defaultValues);
        if (sectionKey === "loanMortgageServices") loanMortgageForm.reset(updatedContent.content.loanMortgageServices || loanMortgageForm.formState.defaultValues);
        if (sectionKey === "customerFeedback") feedbackForm.reset(updatedContent.content.customerFeedback || feedbackForm.formState.defaultValues);
        if (sectionKey === "finalCTA") finalCtaForm.reset(updatedContent.content.finalCTA || finalCtaForm.formState.defaultValues);
        if (sectionKey === "headerNavLinks") headerNavForm.reset({ navLinks: updatedContent.content.headerNavLinks || [] });
        if (sectionKey === "footerContent") footerForm.reset(updatedContent.content.footerContent || footerForm.formState.defaultValues);
      }
    } else {
      toast({
        title: "Save Failed",
        description: result.message || `Could not save ${String(sectionKey)}.`,
        variant: "destructive",
      });
      if (typeof result.error === 'string' && result.error.includes("{")) {
        try {
          const fieldErrors = JSON.parse(result.error);
          Object.entries(fieldErrors).forEach(([fieldName, errors]) => {
            if (formInstance && formInstance.setError && Array.isArray(errors)) {
              formInstance.setError(fieldName as any, { type: "server", message: errors.join(", ") });
            }
          });
        } catch (e) { console.error("Failed to parse field errors", e); }
      }
    }
    setSavingState(false);
  };

  const onHeroSubmit: SubmitHandler<HeroSectionFormData> = (data) => handleSectionSave("heroSection", data, setIsSavingHero, heroForm);
  const onFeaturesSubmit: SubmitHandler<FeaturesOverviewFormData> = (data) => handleSectionSave("featuresOverview", data, setIsSavingFeatures, featuresForm);
  const onAccountsSubmit: SubmitHandler<AccountOfferingsFormData> = (data) => handleSectionSave("accountOfferings", data, setIsSavingAccounts, accountsForm);
  const onDebitCardSubmit: SubmitHandler<DebitCardPromotionFormData> = (data) => handleSectionSave("debitCardPromotion", data, setIsSavingDebitCard, debitCardForm);
  const onInvestmentSubmit: SubmitHandler<InvestmentOpportunitiesFormData> = (data) => handleSectionSave("investmentOpportunities", data, setIsSavingInvestments, investmentForm);
  const onLoanMortgageSubmit: SubmitHandler<LoanMortgageServicesFormData> = (data) => handleSectionSave("loanMortgageServices", data, setIsSavingLoanMortgage, loanMortgageForm);
  const onFeedbackSubmit: SubmitHandler<CustomerFeedbackFormData> = (data) => handleSectionSave("customerFeedback", data, setIsSavingFeedback, feedbackForm);
  const onFinalCtaSubmit: SubmitHandler<FinalCTAFormData> = (data) => handleSectionSave("finalCTA", data, setIsSavingFinalCTA, finalCtaForm);
  const onHeaderNavSubmit: SubmitHandler<HeaderNavLinksFormData> = (data) => handleSectionSave("headerNavLinks", data, setIsSavingHeaderNav, headerNavForm);
  const onFooterSubmit: SubmitHandler<FooterContentFormData> = (data) => handleSectionSave("footerContent", data, setIsSavingFooter, footerForm);


  if (isLoadingContent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
        {[1,2,3,4,5,6,7,8,9,10].map(i => ( 
        <Card key={i}>
          <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Content</AlertTitle>
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Landing Page Content Editor</h1>
        <p className="text-muted-foreground">
          Manage the content displayed on your public landing page.
        </p>
      </div>

       {/* Header Navigation Links Card */}
      <Card>
        <CardHeader>
          <CardTitle>Header Navigation Links</CardTitle>
          <CardDescription>Manage the links in the main site header.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={headerNavForm.handleSubmit(onHeaderNavSubmit)} className="space-y-6">
            {headerLinkFields.map((item, index) => (
              <Card key={item.id} className="p-4 space-y-3 bg-muted/50">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Link #{index + 1}</h4>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeHeaderLink(index)} className="text-destructive hover:text-destructive/90">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor={`navLinks.${index}.label`}>Label</Label>
                    <Input id={`navLinks.${index}.label`} {...headerNavForm.register(`navLinks.${index}.label`)} />
                    {headerNavForm.formState.errors.navLinks?.[index]?.label && <p className="text-sm text-destructive">{headerNavForm.formState.errors.navLinks?.[index]?.label?.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`navLinks.${index}.href`}>URL (or #anchor)</Label>
                    <Input id={`navLinks.${index}.href`} {...headerNavForm.register(`navLinks.${index}.href`)} placeholder="#features or /about"/>
                    {headerNavForm.formState.errors.navLinks?.[index]?.href && <p className="text-sm text-destructive">{headerNavForm.formState.errors.navLinks?.[index]?.href?.message}</p>}
                  </div>
                </div>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => appendHeaderLink({ label: "", href: "#" })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Header Link
            </Button>
            <Button type="submit" disabled={isSavingHeaderNav}>
              {isSavingHeaderNav ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Header Navigation
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Hero Section Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>Edit the main banner content.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={heroForm.handleSubmit(onHeroSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="heroHeadline">Headline</Label>
                <Input id="heroHeadline" {...heroForm.register("headline")} />
                {heroForm.formState.errors.headline && <p className="text-sm text-destructive">{heroForm.formState.errors.headline.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="heroCtaButtonText">CTA Button Text</Label>
                <Input id="heroCtaButtonText" {...heroForm.register("ctaButtonText")} />
                {heroForm.formState.errors.ctaButtonText && <p className="text-sm text-destructive">{heroForm.formState.errors.ctaButtonText.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubheading">Subheading</Label>
              <Textarea id="heroSubheading" {...heroForm.register("subheading")} rows={3} />
              {heroForm.formState.errors.subheading && <p className="text-sm text-destructive">{heroForm.formState.errors.subheading.message}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="heroLearnMoreLink">"Learn More" Link URL (or #anchor)</Label>
                    <Input id="heroLearnMoreLink" {...heroForm.register("learnMoreLink")} placeholder="#features"/>
                    {heroForm.formState.errors.learnMoreLink && <p className="text-sm text-destructive">{heroForm.formState.errors.learnMoreLink.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="heroImageUrl">Image URL</Label>
                    <Input id="heroImageUrl" {...heroForm.register("imageUrl")} placeholder="https://example.com/image.jpg or /images/hero.jpg"/>
                    {heroForm.formState.errors.imageUrl && <p className="text-sm text-destructive">{heroForm.formState.errors.imageUrl.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="heroImageAlt">Image Alt Text</Label>
                <Input id="heroImageAlt" {...heroForm.register("imageAlt")} placeholder="Description of hero image"/>
                {heroForm.formState.errors.imageAlt && <p className="text-sm text-destructive">{heroForm.formState.errors.imageAlt.message}</p>}
            </div>
            <Button type="submit" disabled={isSavingHero}>
              {isSavingHero ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Hero Section
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Features Overview Section Card */}
      <Card>
        <CardHeader>
          <CardTitle>Features Overview Section</CardTitle>
          <CardDescription>Edit the headline, subheading, and list of features.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={featuresForm.handleSubmit(onFeaturesSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="featuresHeadline">Section Headline (Optional)</Label>
              <Input id="featuresHeadline" {...featuresForm.register("headline")} placeholder="e.g., Banking at Your Fingertips"/>
              {featuresForm.formState.errors.headline && <p className="text-sm text-destructive">{featuresForm.formState.errors.headline.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="featuresSubheading">Section Subheading (Optional)</Label>
              <Textarea id="featuresSubheading" {...featuresForm.register("subheading")} rows={2} placeholder="e.g., Enjoy seamless and secure banking..."/>
              {featuresForm.formState.errors.subheading && <p className="text-sm text-destructive">{featuresForm.formState.errors.subheading.message}</p>}
            </div>
            
            <div className="space-y-4">
              <Label>Feature Items</Label>
              {featureFields.map((item, index) => (
                <Card key={item.id} className="p-4 space-y-3 bg-muted/50">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Feature #{index + 1}</h4>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)} className="text-destructive hover:text-destructive/90">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor={`features.${index}.icon`}>Icon Name (Lucide)</Label>
                      <Input id={`features.${index}.icon`} {...featuresForm.register(`features.${index}.icon`)} placeholder="e.g., Send, Activity"/>
                      {featuresForm.formState.errors.features?.[index]?.icon && <p className="text-sm text-destructive">{featuresForm.formState.errors.features?.[index]?.icon?.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`features.${index}.title`}>Title</Label>
                      <Input id={`features.${index}.title`} {...featuresForm.register(`features.${index}.title`)} />
                      {featuresForm.formState.errors.features?.[index]?.title && <p className="text-sm text-destructive">{featuresForm.formState.errors.features?.[index]?.title?.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`features.${index}.description`}>Description</Label>
                    <Textarea id={`features.${index}.description`} {...featuresForm.register(`features.${index}.description`)} rows={2}/>
                    {featuresForm.formState.errors.features?.[index]?.description && <p className="text-sm text-destructive">{featuresForm.formState.errors.features?.[index]?.description?.message}</p>}
                  </div>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={() => appendFeature({ icon: "Smile", title: "", description: "" })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Feature
              </Button>
            </div>
            
            <Button type="submit" disabled={isSavingFeatures}>
              {isSavingFeatures ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Features Overview
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Offerings Section Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Offerings Section</CardTitle>
          <CardDescription>Edit the headline, subheading, and list of account types.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={accountsForm.handleSubmit(onAccountsSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accountsHeadline">Section Headline (Optional)</Label>
              <Input id="accountsHeadline" {...accountsForm.register("headline")} placeholder="e.g., Accounts Designed for Your Needs"/>
              {accountsForm.formState.errors.headline && <p className="text-sm text-destructive">{accountsForm.formState.errors.headline.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountsSubheading">Section Subheading (Optional)</Label>
              <Textarea id="accountsSubheading" {...accountsForm.register("subheading")} rows={2} placeholder="e.g., Choose the perfect account type..."/>
              {accountsForm.formState.errors.subheading && <p className="text-sm text-destructive">{accountsForm.formState.errors.subheading.message}</p>}
            </div>

            <div className="space-y-4">
              <Label>Account Offerings</Label>
              {accountFields.map((item, index) => (
                <Card key={item.id} className="p-4 space-y-3 bg-muted/50">
                   <div className="flex justify-between items-center">
                    <h4 className="font-medium">Account Offering #{index + 1}</h4>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAccount(index)} className="text-destructive hover:text-destructive/90">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor={`accounts.${index}.icon`}>Icon Name (Lucide)</Label>
                      <Input id={`accounts.${index}.icon`} {...accountsForm.register(`accounts.${index}.icon`)} placeholder="e.g., PiggyBank"/>
                       {accountsForm.formState.errors.accounts?.[index]?.icon && <p className="text-sm text-destructive">{accountsForm.formState.errors.accounts?.[index]?.icon?.message}</p>}
                    </div>
                     <div className="space-y-1">
                      <Label htmlFor={`accounts.${index}.name`}>Account Name</Label>
                      <Input id={`accounts.${index}.name`} {...accountsForm.register(`accounts.${index}.name`)} />
                       {accountsForm.formState.errors.accounts?.[index]?.name && <p className="text-sm text-destructive">{accountsForm.formState.errors.accounts?.[index]?.name?.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor={`accounts.${index}.description`}>Description</Label>
                      <Textarea id={`accounts.${index}.description`} {...accountsForm.register(`accounts.${index}.description`)} rows={2}/>
                       {accountsForm.formState.errors.accounts?.[index]?.description && <p className="text-sm text-destructive">{accountsForm.formState.errors.accounts?.[index]?.description?.message}</p>}
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor={`accounts.${index}.features`}>Features (one per line)</Label>
                      <Controller
                        name={`accounts.${index}.features`}
                        control={accountsForm.control}
                        render={({ field }) => (
                          <Textarea
                            id={`accounts.${index}.features`}
                            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                            rows={3}
                            value={Array.isArray(field.value) ? field.value.join('\n') : ''}
                            onChange={(e) => {
                              const featuresArray = e.target.value.split('\n').map(f => f.trim()).filter(f => f);
                              field.onChange(featuresArray);
                            }}
                          />
                        )}
                      />
                       {accountsForm.formState.errors.accounts?.[index]?.features && <p className="text-sm text-destructive">{(accountsForm.formState.errors.accounts?.[index]?.features as any)?.message || "Error in features list"}</p>}
                  </div>
                   <div className="space-y-1">
                      <Label htmlFor={`accounts.${index}.learnMoreLink`}>Learn More Link (URL or #anchor)</Label>
                      <Input id={`accounts.${index}.learnMoreLink`} {...accountsForm.register(`accounts.${index}.learnMoreLink`)} placeholder="#savings"/>
                       {accountsForm.formState.errors.accounts?.[index]?.learnMoreLink && <p className="text-sm text-destructive">{accountsForm.formState.errors.accounts?.[index]?.learnMoreLink?.message}</p>}
                  </div>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={() => appendAccount({ icon: "CreditCard", name: "", description: "", features: [], learnMoreLink: "#" })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Account Offering
              </Button>
            </div>
            <Button type="submit" disabled={isSavingAccounts}>
              {isSavingAccounts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Account Offerings
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Debit Card Promotion Section Card */}
      <Card>
        <CardHeader>
          <CardTitle>Debit Card Promotion Section</CardTitle>
          <CardDescription>Edit the content for the debit card promotion.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={debitCardForm.handleSubmit(onDebitCardSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="debitCardHeadline">Headline</Label>
              <Input id="debitCardHeadline" {...debitCardForm.register("headline")} />
              {debitCardForm.formState.errors.headline && <p className="text-sm text-destructive">{debitCardForm.formState.errors.headline.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="debitCardDescription">Description</Label>
              <Textarea id="debitCardDescription" {...debitCardForm.register("description")} rows={3} />
              {debitCardForm.formState.errors.description && <p className="text-sm text-destructive">{debitCardForm.formState.errors.description.message}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="debitCardImageUrl">Image URL</Label>
                <Input id="debitCardImageUrl" {...debitCardForm.register("imageUrl")} placeholder="https://example.com/card.jpg or /images/card.jpg"/>
                {debitCardForm.formState.errors.imageUrl && <p className="text-sm text-destructive">{debitCardForm.formState.errors.imageUrl.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="debitCardImageAlt">Image Alt Text</Label>
                <Input id="debitCardImageAlt" {...debitCardForm.register("imageAlt")} placeholder="Description of debit card image"/>
                {debitCardForm.formState.errors.imageAlt && <p className="text-sm text-destructive">{debitCardForm.formState.errors.imageAlt.message}</p>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="debitCardCtaButtonText">CTA Button Text</Label>
                    <Input id="debitCardCtaButtonText" {...debitCardForm.register("ctaButtonText")} />
                    {debitCardForm.formState.errors.ctaButtonText && <p className="text-sm text-destructive">{debitCardForm.formState.errors.ctaButtonText.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="debitCardCtaButtonLink">CTA Button Link (URL or #anchor)</Label>
                    <Input id="debitCardCtaButtonLink" {...debitCardForm.register("ctaButtonLink")} placeholder="#get-card"/>
                    {debitCardForm.formState.errors.ctaButtonLink && <p className="text-sm text-destructive">{debitCardForm.formState.errors.ctaButtonLink.message}</p>}
                </div>
            </div>
            <Button type="submit" disabled={isSavingDebitCard}>
              {isSavingDebitCard ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Debit Card Promotion
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Investment Opportunities Section Card */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Opportunities Section</CardTitle>
          <CardDescription>Edit the content for the investment promotion.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={investmentForm.handleSubmit(onInvestmentSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="investmentHeadline">Headline</Label>
              <Input id="investmentHeadline" {...investmentForm.register("headline")} />
              {investmentForm.formState.errors.headline && <p className="text-sm text-destructive">{investmentForm.formState.errors.headline.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="investmentDescription">Description</Label>
              <Textarea id="investmentDescription" {...investmentForm.register("description")} rows={3} />
              {investmentForm.formState.errors.description && <p className="text-sm text-destructive">{investmentForm.formState.errors.description.message}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="investmentImageUrl">Image URL</Label>
                <Input id="investmentImageUrl" {...investmentForm.register("imageUrl")} placeholder="https://example.com/investment.jpg or /images/investment.jpg"/>
                {investmentForm.formState.errors.imageUrl && <p className="text-sm text-destructive">{investmentForm.formState.errors.imageUrl.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="investmentImageAlt">Image Alt Text</Label>
                <Input id="investmentImageAlt" {...investmentForm.register("imageAlt")} placeholder="Description of investment image"/>
                {investmentForm.formState.errors.imageAlt && <p className="text-sm text-destructive">{investmentForm.formState.errors.imageAlt.message}</p>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="investmentCtaButtonText">CTA Button Text</Label>
                    <Input id="investmentCtaButtonText" {...investmentForm.register("ctaButtonText")} />
                    {investmentForm.formState.errors.ctaButtonText && <p className="text-sm text-destructive">{investmentForm.formState.errors.ctaButtonText.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="investmentCtaButtonLink">CTA Button Link (URL or #anchor)</Label>
                    <Input id="investmentCtaButtonLink" {...investmentForm.register("ctaButtonLink")} placeholder="#view-investments"/>
                    {investmentForm.formState.errors.ctaButtonLink && <p className="text-sm text-destructive">{investmentForm.formState.errors.ctaButtonLink.message}</p>}
                </div>
            </div>
            <Button type="submit" disabled={isSavingInvestments}>
              {isSavingInvestments ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Investment Opportunities
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loan & Mortgage Services Section Card */}
      <Card>
        <CardHeader>
          <CardTitle>Loan & Mortgage Services Section</CardTitle>
          <CardDescription>Edit the content for the loan and mortgage promotion.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={loanMortgageForm.handleSubmit(onLoanMortgageSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="loanMortgageHeadline">Headline</Label>
              <Input id="loanMortgageHeadline" {...loanMortgageForm.register("headline")} />
              {loanMortgageForm.formState.errors.headline && <p className="text-sm text-destructive">{loanMortgageForm.formState.errors.headline.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="loanMortgageDescription">Description</Label>
              <Textarea id="loanMortgageDescription" {...loanMortgageForm.register("description")} rows={3} />
              {loanMortgageForm.formState.errors.description && <p className="text-sm text-destructive">{loanMortgageForm.formState.errors.description.message}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="loanMortgageImageUrl">Image URL</Label>
                <Input id="loanMortgageImageUrl" {...loanMortgageForm.register("imageUrl")} placeholder="https://example.com/loan.jpg or /images/loan.jpg"/>
                {loanMortgageForm.formState.errors.imageUrl && <p className="text-sm text-destructive">{loanMortgageForm.formState.errors.imageUrl.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanMortgageImageAlt">Image Alt Text</Label>
                <Input id="loanMortgageImageAlt" {...loanMortgageForm.register("imageAlt")} placeholder="Description of loan image"/>
                {loanMortgageForm.formState.errors.imageAlt && <p className="text-sm text-destructive">{loanMortgageForm.formState.errors.imageAlt.message}</p>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="loanMortgageCtaButtonText">CTA Button Text</Label>
                    <Input id="loanMortgageCtaButtonText" {...loanMortgageForm.register("ctaButtonText")} />
                    {loanMortgageForm.formState.errors.ctaButtonText && <p className="text-sm text-destructive">{loanMortgageForm.formState.errors.ctaButtonText.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="loanMortgageCtaButtonLink">CTA Button Link (URL or #anchor)</Label>
                    <Input id="loanMortgageCtaButtonLink" {...loanMortgageForm.register("ctaButtonLink")} placeholder="#learn-loans"/>
                    {loanMortgageForm.formState.errors.ctaButtonLink && <p className="text-sm text-destructive">{loanMortgageForm.formState.errors.ctaButtonLink.message}</p>}
                </div>
            </div>
            <Button type="submit" disabled={isSavingLoanMortgage}>
              {isSavingLoanMortgage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Loan & Mortgage Services
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Customer Feedback Section Card */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Feedback Section</CardTitle>
          <CardDescription>Edit the headline and CTA for the customer feedback area.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={feedbackForm.handleSubmit(onFeedbackSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="feedbackHeadline">Headline</Label>
              <Input id="feedbackHeadline" {...feedbackForm.register("headline")} />
              {feedbackForm.formState.errors.headline && <p className="text-sm text-destructive">{feedbackForm.formState.errors.headline.message}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="feedbackCtaButtonText">CTA Button Text</Label>
                    <Input id="feedbackCtaButtonText" {...feedbackForm.register("ctaButtonText")} />
                    {feedbackForm.formState.errors.ctaButtonText && <p className="text-sm text-destructive">{feedbackForm.formState.errors.ctaButtonText.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="feedbackCtaButtonLink">CTA Button Link (URL or #anchor)</Label>
                    <Input id="feedbackCtaButtonLink" {...feedbackForm.register("ctaButtonLink")} placeholder="#send-feedback"/>
                    {feedbackForm.formState.errors.ctaButtonLink && <p className="text-sm text-destructive">{feedbackForm.formState.errors.ctaButtonLink.message}</p>}
                </div>
            </div>
            <Button type="submit" disabled={isSavingFeedback}>
              {isSavingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Customer Feedback Section
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Final CTA Section Card */}
      <Card>
        <CardHeader>
          <CardTitle>Final Call-to-Action Section</CardTitle>
          <CardDescription>Edit the content for the final CTA block before the footer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={finalCtaForm.handleSubmit(onFinalCtaSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="finalCtaHeadline">Headline</Label>
              <Input id="finalCtaHeadline" {...finalCtaForm.register("headline")} />
              {finalCtaForm.formState.errors.headline && <p className="text-sm text-destructive">{finalCtaForm.formState.errors.headline.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalCtaSubheading">Subheading</Label>
              <Textarea id="finalCtaSubheading" {...finalCtaForm.register("subheading")} rows={2} />
              {finalCtaForm.formState.errors.subheading && <p className="text-sm text-destructive">{finalCtaForm.formState.errors.subheading.message}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="finalCtaButtonText">CTA Button Text</Label>
                    <Input id="finalCtaButtonText" {...finalCtaForm.register("ctaButtonText")} />
                    {finalCtaForm.formState.errors.ctaButtonText && <p className="text-sm text-destructive">{finalCtaForm.formState.errors.ctaButtonText.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="finalCtaButtonLink">CTA Button Link (URL or #anchor)</Label>
                    <Input id="finalCtaButtonLink" {...finalCtaForm.register("ctaButtonLink")} placeholder="/register"/>
                    {finalCtaForm.formState.errors.ctaButtonLink && <p className="text-sm text-destructive">{finalCtaForm.formState.errors.ctaButtonLink.message}</p>}
                </div>
            </div>
            <Button type="submit" disabled={isSavingFinalCTA}>
              {isSavingFinalCTA ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Final CTA Section
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Footer Content</CardTitle>
          <CardDescription>Manage general footer text and links.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={footerForm.handleSubmit(onFooterSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="footerDescription">Footer Description</Label>
              <Textarea id="footerDescription" {...footerForm.register("footerDescription")} rows={3} placeholder="Your trusted partner for modern banking..."/>
              {footerForm.formState.errors.footerDescription && <p className="text-sm text-destructive">{footerForm.formState.errors.footerDescription.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerCopyright">Copyright Text</Label>
              <Input id="footerCopyright" {...footerForm.register("footerCopyright")} placeholder="© 2024 Wohana Funds. All rights reserved."/>
              {footerForm.formState.errors.footerCopyright && <p className="text-sm text-destructive">{footerForm.formState.errors.footerCopyright.message}</p>}
            </div>

            {/* Quick Link Columns */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Quick Link Columns</Label>
              {quickLinkColumnFields.map((columnItem, columnIndex) => (
                <Card key={columnItem.id} className="p-4 bg-muted/50">
                  <div className="flex justify-between items-center mb-3">
                    <Input {...footerForm.register(`footerQuickLinkColumns.${columnIndex}.title`)} placeholder="Column Title (e.g., Company)" className="font-medium text-lg flex-grow mr-2"/>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQuickLinkColumn(columnIndex)} className="text-destructive hover:text-destructive/90">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {footerForm.formState.errors.footerQuickLinkColumns?.[columnIndex]?.title && <p className="text-sm text-destructive mb-2">{footerForm.formState.errors.footerQuickLinkColumns?.[columnIndex]?.title?.message}</p>}
                  
                  <Controller
                    control={footerForm.control}
                    name={`footerQuickLinkColumns.${columnIndex}.links`}
                    render={({ field }) => {
                      const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
                        control: footerForm.control,
                        name: `footerQuickLinkColumns.${columnIndex}.links`
                      });
                      return (
                        <div className="space-y-2">
                          {linkFields.map((linkItem, linkIndex) => (
                            <Card key={linkItem.id} className="p-3 space-y-2 bg-card">
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium">Link #{linkIndex + 1}</h5>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeLink(linkIndex)} className="text-destructive hover:text-destructive/90">
                                  <Trash2 className="h-3 w-3 mr-1"/> Remove
                                </Button>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-3">
                                <Input {...footerForm.register(`footerQuickLinkColumns.${columnIndex}.links.${linkIndex}.label`)} placeholder="Link Label"/>
                                <Input {...footerForm.register(`footerQuickLinkColumns.${columnIndex}.links.${linkIndex}.href`)} placeholder="URL or #anchor"/>
                              </div>
                              {footerForm.formState.errors.footerQuickLinkColumns?.[columnIndex]?.links?.[linkIndex]?.label && <p className="text-sm text-destructive">{footerForm.formState.errors.footerQuickLinkColumns?.[columnIndex]?.links?.[linkIndex]?.label?.message}</p>}
                              {footerForm.formState.errors.footerQuickLinkColumns?.[columnIndex]?.links?.[linkIndex]?.href && <p className="text-sm text-destructive">{footerForm.formState.errors.footerQuickLinkColumns?.[columnIndex]?.links?.[linkIndex]?.href?.message}</p>}
                            </Card>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => appendLink({ label: "", href: "#" })}>
                            <PlusCircle className="h-4 w-4 mr-1"/> Add Link to Column
                          </Button>
                        </div>
                      );
                    }}
                  />
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={() => appendQuickLinkColumn({ title: "", links: [{ label: "", href: "#" }] })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Link Column
              </Button>
            </div>

            {/* Social Media Links */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Social Media Links</Label>
              {socialMediaLinkFields.map((item, index) => (
                <Card key={item.id} className="p-4 space-y-3 bg-muted/50">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Social Link #{index + 1}</h4>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialMediaLink(index)} className="text-destructive hover:text-destructive/90">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                      <Label htmlFor={`footerSocialMediaLinks.${index}.platform`}>Platform Name</Label>
                      <Input id={`footerSocialMediaLinks.${index}.platform`} {...footerForm.register(`footerSocialMediaLinks.${index}.platform`)} placeholder="e.g., Facebook"/>
                      {footerForm.formState.errors.footerSocialMediaLinks?.[index]?.platform && <p className="text-sm text-destructive">{footerForm.formState.errors.footerSocialMediaLinks?.[index]?.platform?.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`footerSocialMediaLinks.${index}.href`}>URL</Label>
                      <Input id={`footerSocialMediaLinks.${index}.href`} {...footerForm.register(`footerSocialMediaLinks.${index}.href`)} placeholder="https://facebook.com/..."/>
                      {footerForm.formState.errors.footerSocialMediaLinks?.[index]?.href && <p className="text-sm text-destructive">{footerForm.formState.errors.footerSocialMediaLinks?.[index]?.href?.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`footerSocialMediaLinks.${index}.iconName`}>Icon Name (Lucide)</Label>
                      <Input id={`footerSocialMediaLinks.${index}.iconName`} {...footerForm.register(`footerSocialMediaLinks.${index}.iconName`)} placeholder="e.g., Facebook, Twitter"/>
                      {footerForm.formState.errors.footerSocialMediaLinks?.[index]?.iconName && <p className="text-sm text-destructive">{footerForm.formState.errors.footerSocialMediaLinks?.[index]?.iconName?.message}</p>}
                    </div>
                  </div>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={() => appendSocialMediaLink({ platform: "", href: "", iconName: "" })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Social Media Link
              </Button>
            </div>
            <Button type="submit" disabled={isSavingFooter}>
              {isSavingFooter ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Footer Content
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
