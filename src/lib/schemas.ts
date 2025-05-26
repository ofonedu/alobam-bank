
import { z } from "zod";

export const AuthSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export const RegisterSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phoneNumber: z.string().min(10, "Phone number seems too short.").optional().or(z.literal('')),
  accountType: z.string().min(1, "Account type is required."),
  currency: z.string().min(3, "Currency code is required.").default("USD"),
});
export type RegisterFormData = z.infer<typeof RegisterSchema>;

export const EditProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  phoneNumber: z.string().min(10, "Phone number is invalid.").optional().or(z.literal('')),
});
export type EditProfileFormData = z.infer<typeof EditProfileSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});
export type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const KYCFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  dateOfBirth: z.string().refine((dob) => /^\\d{4}-\\d{2}-\\d{2}$/.test(dob), {
    message: "Date of birth must be in YYYY-MM-DD format.",
  }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  governmentId: z.string().min(5, { message: "Government ID must be at least 5 characters." }),
  governmentIdPhoto: z
    .any()
    .refine((files) => files?.length == 1, "Government ID photo is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

export type KYCFormData = z.infer<typeof KYCFormSchema>;

export const LoanApplicationSchema = z.object({
  amount: z.number().min(100, "Minimum loan amount is $100.").max(100000, "Maximum loan amount is $100,000."),
  termMonths: z.number().min(3, "Minimum term is 3 months.").max(60, "Maximum term is 60 months."),
  purpose: z.string().min(10, "Please provide a brief purpose for the loan (min 10 characters)."),
});

export type LoanApplicationData = z.infer<typeof LoanApplicationSchema>;

export const TransactionSchema = z.object({
  description: z.string().min(3, "Description is too short."),
  amount: z.number().positive("Amount must be positive."),
  type: z.enum(["deposit", "withdrawal"]),
  date: z.date(),
});
export type TransactionFormData = z.infer<typeof TransactionSchema>;

// Fund Transfer Schemas
export const LocalTransferSchema = z.object({
  recipientName: z.string().min(2, "Recipient name must be at least 2 characters."),
  recipientAccountNumber: z.string().min(5, "Account number must be at least 5 characters."),
  bankName: z.string().min(3, "Bank name must be at least 3 characters.").optional(),
  routingNumber: z.string().min(8, "Routing number must be at least 8 characters.").max(12, "Routing number is too long."),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
});
export type LocalTransferData = z.infer<typeof LocalTransferSchema>;

export const InternationalTransferSchema = z.object({
  recipientName: z.string().min(2, "Recipient name must be at least 2 characters."),
  recipientAccountNumberIBAN: z.string().min(15, "Account number/IBAN seems too short.").max(34, "Account number/IBAN seems too long."),
  bankName: z.string().min(3, "Bank name must be at least 3 characters."),
  swiftBic: z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Invalid SWIFT/BIC code format."),
  recipientBankAddress: z.string().min(5, "Bank address is too short.").optional(),
  country: z.string().min(2, "Country selection is required."),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  currency: z.string().default("USD"),
  remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
});
export type InternationalTransferData = z.infer<typeof InternationalTransferSchema>;

export const AccountTypeFormSchema = z.object({
  name: z.string().min(2, "Account type name must be at least 2 characters."),
  description: z.string().max(200, "Description cannot exceed 200 characters.").optional(),
});

export const SubmitSupportTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters.").max(100, "Subject cannot exceed 100 characters."),
  message: z.string().min(20, "Message must be at least 20 characters.").max(2000, "Message cannot exceed 2000 characters."),
});
export type SubmitSupportTicketData = z.infer<typeof SubmitSupportTicketSchema>;

// Schema for Admin Platform Settings
export const GeneralSettingsSchema = z.object({
  platformName: z.string().min(1, "Platform name is required.").optional(),
  supportEmail: z.string().email("Invalid email address.").optional(),
  maintenanceMode: z.boolean().optional(),
  cotPercentage: z.coerce.number().min(0, "COT percentage cannot be negative.").max(100, "COT percentage cannot exceed 100.").optional(),
  requireCOTConfirmation: z.boolean().optional(),
  requireIMFAuthorization: z.boolean().optional(),
  requireTaxClearance: z.boolean().optional(),
  platformLogoText: z.string().min(1, "Logo text cannot be empty if provided.").max(30, "Logo text too long.").optional().or(z.literal('')),
  platformLogoIcon: z.string().min(1, "Icon name cannot be empty if provided.").max(50, "Icon name too long.").optional().or(z.literal('')),
});
export type GeneralSettingsFormData = z.infer<typeof GeneralSettingsSchema>;

export const KycSettingsSchema = z.object({
  autoApproveKycRiskLevel: z.enum(["low", "medium", "high", "none"]).optional(),
  aiKycEnabled: z.boolean().optional(),
});
export type KycSettingsFormData = z.infer<typeof KycSettingsSchema>;

export const LoanSettingsSchema = z.object({
  maxLoanAmount: z.coerce.number().positive("Max loan amount must be positive.").optional(),
  defaultInterestRate: z.coerce.number().min(0).max(1, "Interest rate must be between 0 and 1 (e.g., 0.05 for 5%)").optional(),
});
export type LoanSettingsFormData = z.infer<typeof LoanSettingsSchema>;

// Landing Page Schemas
export const HeroSectionSchema = z.object({
  headline: z.string().min(5, "Headline is too short.").max(100, "Headline is too long."),
  subheading: z.string().min(10, "Subheading is too short.").max(200, "Subheading is too long."),
  ctaButtonText: z.string().min(3, "Button text is too short.").max(30, "Button text is too long."),
  learnMoreLink: z.string().url({ message: "Invalid URL for learn more link." }).or(z.string().startsWith("#")).optional().or(z.literal('')),
  imageUrl: z.string().url({ message: "Invalid image URL." }).or(z.string().startsWith("/images/")).optional().or(z.literal('')),
  imageAlt: z.string().min(3, "Image alt text is too short.").max(100, "Image alt text is too long.").optional().or(z.literal('')),
});
export type HeroSectionFormData = z.infer<typeof HeroSectionSchema>;

export const FeatureItemSchema = z.object({
  icon: z.string().min(1, "Icon name is required.").max(50, "Icon name too long."),
  title: z.string().min(3, "Feature title is too short.").max(50, "Feature title is too long."),
  description: z.string().min(10, "Feature description is too short.").max(150, "Feature description is too long."),
});
export type FeatureItemFormData = z.infer<typeof FeatureItemSchema>;

export const FeaturesOverviewSectionSchema = z.object({
  headline: z.string().min(5, "Headline is too short.").max(100, "Headline is too long.").optional().or(z.literal('')),
  subheading: z.string().min(10, "Subheading is too short.").max(200, "Subheading is too long.").optional().or(z.literal('')),
  features: z.array(FeatureItemSchema).optional(),
});
export type FeaturesOverviewFormData = z.infer<typeof FeaturesOverviewSectionSchema>;

export const AccountOfferingItemSchema = z.object({
  icon: z.string().min(1, "Icon name is required.").max(50, "Icon name too long."),
  name: z.string().min(3, "Account name is too short.").max(50, "Account name is too long."),
  description: z.string().min(10, "Account description is too short.").max(150, "Account description is too long."),
  features: z.array(z.string().min(3, "Feature text is too short.").max(100, "Feature text is too long.")).optional(),
  learnMoreLink: z.string().url({ message: "Invalid URL." }).or(z.string().startsWith("#")).optional().or(z.literal('')),
});
export type AccountOfferingItemFormData = z.infer<typeof AccountOfferingItemSchema>;

export const AccountOfferingsSectionSchema = z.object({
  headline: z.string().min(5, "Headline is too short.").max(100, "Headline is too long.").optional().or(z.literal('')),
  subheading: z.string().min(10, "Subheading is too short.").max(200, "Subheading is too long.").optional().or(z.literal('')),
  accounts: z.array(AccountOfferingItemSchema).optional(),
});
export type AccountOfferingsFormData = z.infer<typeof AccountOfferingsSectionSchema>;

export const DebitCardPromotionSchema = z.object({
  headline: z.string().min(5, "Headline is too short.").max(100, "Headline is too long."),
  description: z.string().min(10, "Description is too short.").max(250, "Description is too long."),
  imageUrl: z.string().url({ message: "Invalid image URL." }).or(z.string().startsWith("/images/")).optional().or(z.literal('')),
  imageAlt: z.string().min(3, "Image alt text is too short.").max(100, "Image alt text is too long.").optional().or(z.literal('')),
  ctaButtonText: z.string().min(3, "Button text is too short.").max(30, "Button text is too long."),
  ctaButtonLink: z.string().url({ message: "Invalid URL for button link." }).or(z.string().startsWith("#")).optional().or(z.literal('')),
});
export type DebitCardPromotionFormData = z.infer<typeof DebitCardPromotionSchema>;

export const InvestmentOpportunitiesSchema = z.object({
  headline: z.string().min(5, "Headline is too short.").max(100, "Headline is too long."),
  description: z.string().min(10, "Description is too short.").max(250, "Description is too long."),
  ctaButtonText: z.string().min(3, "Button text is too short.").max(30, "Button text is too long."),
  ctaButtonLink: z.string().url({ message: "Invalid URL for button link." }).or(z.string().startsWith("#")).optional().or(z.literal('')),
  imageUrl: z.string().url({ message: "Invalid image URL." }).or(z.string().startsWith("/images/")).optional().or(z.literal('')),
  imageAlt: z.string().min(3, "Image alt text is too short.").max(100, "Image alt text is too long.").optional().or(z.literal('')),
});
export type InvestmentOpportunitiesFormData = z.infer<typeof InvestmentOpportunitiesSchema>;

export const LoanMortgageServicesSchema = z.object({
  headline: z.string().min(5, "Headline is too short.").max(100, "Headline is too long."),
  description: z.string().min(10, "Description is too short.").max(250, "Description is too long."),
  ctaButtonText: z.string().min(3, "Button text is too short.").max(30, "Button text is too long."),
  ctaButtonLink: z.string().url({ message: "Invalid URL for button link." }).or(z.string().startsWith("#")).optional().or(z.literal('')),
  imageUrl: z.string().url({ message: "Invalid image URL." }).or(z.string().startsWith("/images/")).optional().or(z.literal('')),
  imageAlt: z.string().min(3, "Image alt text is too short.").max(100, "Image alt text is too long.").optional().or(z.literal('')),
});
export type LoanMortgageServicesFormData = z.infer<typeof LoanMortgageServicesSchema>;

export const CustomerFeedbackSchema = z.object({
  headline: z.string().min(5, "Headline is too short.").max(100, "Headline is too long."),
  ctaButtonText: z.string().min(3, "Button text is too short.").max(30, "Button text is too long."),
  ctaButtonLink: z.string().url({ message: "Invalid URL for button link." }).or(z.string().startsWith("#")).optional().or(z.literal('')),
});
export type CustomerFeedbackFormData = z.infer<typeof CustomerFeedbackSchema>;

export const FinalCTASchema = z.object({
  headline: z.string().min(5, "Headline is too short.").max(100, "Headline is too long."),
  subheading: z.string().min(10, "Subheading is too short.").max(200, "Subheading is too long."),
  ctaButtonText: z.string().min(3, "Button text is too short.").max(30, "Button text is too long."),
  ctaButtonLink: z.string().url({ message: "Invalid URL for button link." }).or(z.string().startsWith("#")).optional().or(z.literal('')),
});
export type FinalCTAFormData = z.infer<typeof FinalCTASchema>;

export const NavLinkItemSchema = z.object({
  label: z.string().min(1, "Link label is required.").max(30, "Link label is too long."),
  href: z.string().min(1, "Link URL/path is required.").max(200, "Link URL is too long."),
});
export type NavLinkItemFormData = z.infer<typeof NavLinkItemSchema>;

export const HeaderNavLinksSchema = z.object({
  navLinks: z.array(NavLinkItemSchema).optional(),
});
export type HeaderNavLinksFormData = z.infer<typeof HeaderNavLinksSchema>;


export const FooterLinkColumnSchema = z.object({
  title: z.string().min(1, "Column title is required.").max(50, "Column title is too long."),
  links: z.array(NavLinkItemSchema).optional(),
});
export type FooterLinkColumnFormData = z.infer<typeof FooterLinkColumnSchema>;

export const SocialMediaLinkSchema = z.object({
  platform: z.string().min(1, "Platform name is required.").max(50, "Platform name too long."),
  href: z.string().url({ message: "Invalid URL for social media link." }),
  iconName: z.string().min(1, "Icon name is required.").max(50, "Icon name too long.").optional().or(z.literal('')),
});
export type SocialMediaLinkFormData = z.infer<typeof SocialMediaLinkSchema>;

export const FooterContentSchema = z.object({
  footerDescription: z.string().max(300, "Description is too long.").optional().or(z.literal('')),
  footerCopyright: z.string().max(150, "Copyright text is too long.").optional().or(z.literal('')),
  footerQuickLinkColumns: z.array(FooterLinkColumnSchema).optional(),
  footerSocialMediaLinks: z.array(SocialMediaLinkSchema).optional(),
});
export type FooterContentFormData = z.infer<typeof FooterContentSchema>;
