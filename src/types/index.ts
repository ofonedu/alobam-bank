
// src/types/index.ts
import type { User as FirebaseUser } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";
import type { z } from "zod";
import type { LocalTransferData, InternationalTransferData, KYCFormData } from "@/lib/schemas"; 
import type React from 'react';
import type { ReactNode } from 'react'; 

export interface UserProfile {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string;
  accountType?: string;
  balance: number; 
  primaryCurrency?: string; 
  kycStatus?: "not_started" | "pending_review" | "verified" | "rejected";
  role?: "user" | "admin";
  accountNumber?: string;
  isFlagged?: boolean;
  accountHealthScore?: number;
  profileCompletionPercentage?: number;
  isSuspended?: boolean;
}

export interface AuthorizationDetails {
  cot?: number;
  cotCode?: string;
  imfCode?: string;
  taxCode?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  date: Date | Timestamp;
  description: string;
  amount: number;
  type: "deposit" | "withdrawal" | "transfer" | "fee" | "credit" | "debit" | "loan_disbursement" | "loan_repayment" | "manual_credit" | "manual_debit";
  status: "pending" | "completed" | "failed";
  currency?: string;
  recipientDetails?: {
    name?: string;
    accountNumber?: string;
    bankName?: string;
    swiftBic?: string;
    country?: string;
  };
  authorizationDetails?: AuthorizationDetails;
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
  currency?: string;
}

export interface KYCData {
  userId: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  governmentId: string;
  photoUrl?: string;
  photoFileName?: string;
  status: "not_started" | "pending_review" | "verified" | "rejected";
  submittedAt?: Date | Timestamp; 
  reviewedAt?: Date | Timestamp;  
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface ClientKYCData extends Omit<KYCData, 'submittedAt' | 'reviewedAt'> {
  submittedAt?: string; 
  reviewedAt?: string;  
}

export interface KYCSubmissionResult {
  success: boolean;
  message: string;
  kycData?: ClientKYCData; 
  error?: string | Record<string, string[]>;
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
  createdAt: Date | Timestamp;
}

export interface AdminKYCView extends Omit<KYCData, 'submittedAt' | 'reviewedAt'> {
  id: string;
  userEmail?: string;
  submittedAt: Date; 
  reviewedAt?: Date;  
}


export interface PlatformSettings {
  platformName?: string;
  supportEmail?: string;
  maintenanceMode?: boolean;
  cotPercentage?: number;
  autoApproveKycRiskLevel?: 'low' | 'medium' | 'high' | 'none';
  aiKycEnabled?: boolean;
  maxLoanAmount?: number;
  defaultInterestRate?: number;
  requireCOTConfirmation?: boolean;
  requireIMFAuthorization?: boolean;
  requireTaxClearance?: boolean;
  platformLogoText?: string;
  platformLogoIcon?: string;
  resendApiKey?: string;
  resendFromEmail?: string;
}

// Landing Page Content Types
export interface NavLinkItem {
  id?: string;
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
  id?: string;
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
  id?: string;
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
  id?: string;
  title: string;
  links: NavLinkItem[];
}

export interface SocialMediaLink {
  id?: string;
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
    subItems?: DashboardNavItem[];
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
  cotPercentage: number;
  onConfirm: (cotCode: string) => void;
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
  onConfirm: (taxCode: string) => void;
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

export interface AuthorizationCode {
  id: string;
  value: string;
  type: 'COT' | 'IMF' | 'TAX';
  userId?: string | null; 
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  isUsed: boolean;
  generatedBy: string; 
}

// Email Service Types
export enum EmailType {
  WELCOME = "WELCOME",
  PASSWORD_RESET = "PASSWORD_RESET",
  KYC_SUBMITTED = "KYC_SUBMITTED",
  KYC_APPROVED = "KYC_APPROVED",
  KYC_REJECTED = "KYC_REJECTED",
  TRANSFER_CONFIRMATION = "TRANSFER_CONFIRMATION",
  TRANSFER_FAILED = "TRANSFER_FAILED",
  DEPOSIT_CONFIRMATION = "DEPOSIT_CONFIRMATION",
  LOAN_APPLICATION_RECEIVED = "LOAN_APPLICATION_RECEIVED",
  LOAN_STATUS_UPDATE = "LOAN_STATUS_UPDATE", // Generic for approved/rejected
  ADMIN_NOTIFICATION = "ADMIN_NOTIFICATION",
}

export interface EmailServiceDataPayload {
  userName?: string;
  loginLink?: string; // For WelcomeEmail
  resetLink?: string; // For PasswordResetEmail
  kycSubmissionDate?: string; // For KYC_SUBMITTED
  kycRejectionReason?: string; // For KYC_REJECTED
  transferAmount?: string; // For TRANSFER_CONFIRMATION, DEPOSIT_CONFIRMATION
  transferRecipient?: string; // For TRANSFER_CONFIRMATION
  transactionId?: string; // For TRANSFER_CONFIRMATION, DEPOSIT_CONFIRMATION
  failureReason?: string; // For TRANSFER_FAILED
  loanApplicationId?: string; // For LOAN_APPLICATION_RECEIVED, LOAN_STATUS_UPDATE
  loanStatus?: string; // For LOAN_STATUS_UPDATE (e.g., "Approved", "Rejected")
  adminNotificationMessage?: string; // For ADMIN_NOTIFICATION
  adminNotificationSubject?: string; // For ADMIN_NOTIFICATION
  // Add more fields as needed for different email types
}

export interface EmailServiceResult {
  success: boolean;
  message: string;
  error?: string;
}

// Notification Data - Placeholder for Cloud Function trigger
// This structure would be written to Firestore to trigger the email sending Cloud Function
export interface NotificationData {
  id?: string; // Firestore document ID
  type: EmailType;
  toEmail: string;
  fullName?: string;
  firstName?: string;
  accountNumber?: string | null;
  status: "pending" | "sent" | "failed";
  createdAt: Timestamp;
  processedAt?: Timestamp;
  errorMessage?: string;
  bankName?: string; // For template consistency
  logoUrl?: string; // For template consistency
  // Dynamic data based on EmailType
  userName?: string;
  loginLink?: string;
  resetLink?: string;
  kycSubmissionDate?: string;
  kycRejectionReason?: string;
  amount?: number;
  currency?: string;
  description?: string;
  location?: string;
  valueDate?: string;
  remarks?: string;
  time?: string;
  currentBalance?: number;
  availableBalance?: number;
  docNumber?: string;
  transactionId?: string;
  recipientName?: string;
  reason?: string;
  loanId?: string;
  loanAmount?: number;
  approvalDate?: string;
  rejectionDate?: string;
  adminNotificationMessage?: string;
  adminNotificationSubject?: string;
}
