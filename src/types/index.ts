
// src/types/index.ts
import type { User as FirebaseUser } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";
import type { z } from "zod";
import type { LocalTransferData, InternationalTransferData, KYCFormData } from "@/lib/schemas"; // KYCFormData added
import type { KYCSubmissionResult } from "@/lib/actions"; // KYCSubmissionResult added
import type React from 'react';
import type { ReactNode } from 'react'; // Added ReactNode import

export interface UserProfile {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string;
  accountType?: string; // Will store ID of account type
  currency?: string;
  kycStatus?: "not_started" | "pending_review" | "verified" | "rejected";
  role?: "user" | "admin";
  balance: number;
  accountNumber?: string;
  isFlagged?: boolean;
  accountHealthScore?: number;
  profileCompletionPercentage?: number;
  isSuspended?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  date: Date | Timestamp; 
  description: string;
  amount: number;
  type: "deposit" | "withdrawal" | "transfer" | "fee" | "credit" | "debit" | "loan_disbursement" | "loan_repayment"; // Changed manual_credit/debit to credit/debit
  status: "pending" | "completed" | "failed";
  currency?: string;
  recipientDetails?: {
    name?: string;
    accountNumber?: string;
    bankName?: string;
    swiftBic?: string;
    country?: string;
  };
  authorizationDetails?: {
    cot?: number;
    cotCode?: string; // Added
    imfCodeProvided?: boolean; // Kept, could be derived from imfCode existence
    imfCode?: string; // Added
    taxCode?: string; // Added, replaces taxDocumentName
  };
  relatedTransferId?: string;
  isFlagged?: boolean;
  notes?: string;
}

export interface Loan {
  id: string;
  userId: string;
  applicantName?: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  status: "pending" | "approved" | "rejected" | "active" | "paid" | "defaulted";
  applicationDate: Date | Timestamp;
  approvalDate?: Date | Timestamp;
  purpose?: string;
}

export interface KYCData {
  userId: string;
  fullName: string;
  dateOfBirth: string; // Stored as YYYY-MM-DD string
  address: string;
  governmentId: string;
  photoUrl?: string;
  photoFileName?: string;
  status: "not_started" | "pending_review" | "verified" | "rejected";
  submittedAt?: Date | Timestamp;
  reviewedAt?: Date | Timestamp;
  reviewedBy?: string;
  rejectionReason?: string;
  riskAssessment?: {
    riskLevel: string;
    fraudScore: number;
    identityVerified: boolean;
    flags: string[];
  };
}

export type AuthUser = FirebaseUser & { customData?: UserProfile };

// Admin View Specific Types
export interface AdminUserView extends UserProfile {
  // uid is already in UserProfile
}

export interface AdminLoanApplicationView extends Loan {
  // id is already in Loan
}

export interface AdminTransactionView extends Transaction {
  // id is already in Transaction
  userName?: string; 
  userEmail?: string;
}

export interface AdminSupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: "open" | "pending_admin_reply" | "pending_user_reply" | "closed";
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  priority?: "low" | "medium" | "high";
  assignedTo?: string;
  replies?: Array<{
    authorId: string;
    authorName: string;
    message: string;
    timestamp: Date | Timestamp;
  }>;
}

export interface AccountType {
  id: string;
  name: string;
  description?: string;
  createdAt: Date | Timestamp; // Firestore Timestamp when read, Date after processing
}

export interface AdminKYCView extends Omit<KYCData, 'submittedAt' | 'reviewedAt'> {
  id: string; 
  userEmail?: string;
  submittedAt: Date; // Ensure this is Date for client
  reviewedAt?: Date;  // Ensure this is Date for client
}


export interface PlatformSettings {
  platformName?: string;
  supportEmail?: string;
  maintenanceMode?: boolean;
  autoApproveKycRiskLevel?: 'low' | 'medium' | 'high' | 'none';
  aiKycEnabled?: boolean;
  maxLoanAmount?: number;
  defaultInterestRate?: number;
  requireCOTConfirmation?: boolean;
  requireIMFAuthorization?: boolean;
  requireTaxClearance?: boolean;
  platformLogoText?: string;
  platformLogoIcon?: string;
}

// Landing Page Content Types
export interface NavLinkItem {
  id?: string; // For useFieldArray key
  label: string;
  href: string;
}

export interface HeroSectionContent {
  headline: string;
  subheading: string;
  ctaButtonText: string;
  ctaButtonLink?: string;
  learnMoreLink?: string;
  imageUrl: string;
  imageAlt: string;
}

export interface FeatureItem {
  id?: string; // For useFieldArray key
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesOverviewContent {
  headline?: string;
  subheading?: string;
  features?: FeatureItem[];
}

export interface AccountOfferingItem {
  id?: string; // For useFieldArray key
  icon: string;
  name: string;
  description: string;
  features: string[];
  learnMoreLink: string;
}

export interface AccountOfferingsContent {
  headline?: string;
  subheading?: string;
  accounts?: AccountOfferingItem[];
}

export interface DebitCardPromotionContent {
  headline: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  ctaButtonText: string;
  ctaButtonLink: string;
}

export interface InvestmentOpportunitiesContent {
  headline: string;
  description: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  imageUrl: string;
  imageAlt: string;
}

export interface LoanMortgageServicesContent {
  headline: string;
  description: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  imageUrl: string;
  imageAlt: string;
}

export interface CustomerFeedbackContent {
  headline: string;
  ctaButtonText: string;
  ctaButtonLink: string;
}

export interface FinalCTAContent {
  headline: string;
  subheading: string;
  ctaButtonText: string;
  ctaButtonLink: string;
}


export interface FooterLinkColumn {
  id?: string; // For useFieldArray key
  title: string;
  links: NavLinkItem[];
}

export interface SocialMediaLink {
  id?: string; // For useFieldArray key
  platform: string;
  href: string;
  iconName?: string;
}

export interface FooterContent {
  footerDescription?: string;
  footerCopyright?: string;
  footerQuickLinkColumns?: FooterLinkColumn[];
  footerSocialMediaLinks?: SocialMediaLink[];
  contactInfo?: { 
    address?: string;
    phone?: string;
    email?: string;
  };
}

export interface LandingPageContent {
  heroSection?: HeroSectionContent;
  featuresOverview?: FeaturesOverviewContent;
  accountOfferings?: AccountOfferingsContent;
  debitCardPromotion?: DebitCardPromotionContent;
  investmentOpportunities?: InvestmentOpportunitiesContent;
  loanMortgageServices?: LoanMortgageServicesContent;
  customerFeedback?: CustomerFeedbackContent;
  finalCTA?: FinalCTAContent;
  headerNavLinks?: NavLinkItem[];
  footerContent?: FooterContent;
}


// Component Prop Types
export interface DashboardNavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    subMenuPrefix?: string;
    subItems?: DashboardNavItem[]; // For nested menus
}

export interface DashboardNavProps {
  isAdmin?: boolean;
}

export interface MainHeaderProps {
  navLinks?: NavLinkItem[];
}

export interface SignOutButtonProps {
  className?: string;
}

export interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userProfile: UserProfile | null;
  onSuccess: () => void;
}

export interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

export interface KYCFormProps {
  onSuccess?: (data: KYCSubmissionResult) => void;
}

export interface COTConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transferData: LocalTransferData | InternationalTransferData | null;
  onConfirm: (cotCode: string) => void; // cotCode added
  onCancel: () => void;
}

export interface IMFAuthorizationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (imfCode: string) => void;
  onCancel: () => void;
}

export interface TaxClearanceDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (taxCode: string) => void; // Changed from file to taxCode string
  onCancel: () => void;
}

export interface AdminUserRoleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: AdminUserView | null;
  onSuccess: () => void;
}

export interface AdjustBalanceDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: AdminUserView | null;
  onSuccess: () => void;
}

export interface ViewUserDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: AdminUserView | null;
}

export interface KYCDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  kycItem: AdminKYCView | null;
  onActionComplete: () => void;
}

export interface ViewLoanDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  loan: AdminLoanApplicationView | null;
}

export interface ViewTransactionDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: AdminTransactionView | null;
}

export interface InfoPillProps {
  label: string;
  value?: string | number | boolean | null | React.ReactNode;
  icon?: React.ReactNode; 
  valueClassName?: string;
}

export interface ProfileInfoItemProps {
  icon: ReactNode;
  label: string;
  value: string | number | null | undefined;
}
