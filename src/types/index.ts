
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

export interface TransferAuthorizations extends AuthorizationDetails {
  otpCode?: string; // OTP code itself, or a flag indicating verification
  otpVerified?: boolean; // Explicit flag if OTP was verified
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
  authorizationDetails?: TransferAuthorizations; // Updated to use TransferAuthorizations
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
  disbursedDate?: Date | Timestamp;
  paidDate?: Date | Timestamp;
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

export interface SupportTicketReply {
  id: string; // Unique ID for the reply itself
  authorId: string; // UID of the admin or user who wrote the reply
  authorName: string; // Display name of the author
  message: string;
  timestamp: Date | Timestamp;
  authorRole?: "admin" | "user"; // To distinguish between admin and user replies
}

export interface AdminSupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string; // Initial message from the user
  status: "open" | "pending_admin_reply" | "pending_user_reply" | "closed";
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  priority?: "low" | "medium" | "high";
  assignedTo?: string; // Admin ID
  replies: SupportTicketReply[]; 
}

export interface UserSupportTicket {
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
  replies: SupportTicketReply[]; 
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
  enableOtpForTransfers?: boolean;
  platformLogoText?: string;
  platformLogoIcon?: string;
  emailLogoImageUrl?: string;
  resendApiKey?: string;
  resendFromEmail?: string;
}

export interface OtpRecord {
  id?: string;
  userId: string;
  otp: string;
  purpose: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp; // Added to track usage/verification time
  isUsed?: boolean;
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

export interface OtpVerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
  purpose: string;
  emailHint?: string;
  onOtpVerifiedSuccessfully: (otp: string) => void; // Callback on successful OTP verification
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

export interface ViewLoanDetailModalProps { // Admin version
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  loan: AdminLoanApplicationView | null;
}

export interface UserViewLoanDetailModalProps { // User version
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  loan: Loan | null;
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

export interface EmailServiceDataPayload {
  userName?: string;
  loginUrl?: string;
  resetLink?: string;
  // KYC Specific
  kycSubmissionDate?: string;
  kycRejectionReason?: string;
  // Transfer & Transaction Specific
  transactionAmount?: string; 
  transactionType?: string; 
  transactionDate?: string;
  transactionTime?: string;
  transactionId?: string;
  transactionDescription?: string;
  recipientName?: string; 
  currentBalance?: string; 
  accountNumber?: string; 
  transactionLocation?: string;
  transactionValueDate?: string;
  transactionRemarks?: string;
  availableBalance?: string;
  // Generic Notification
  failureReason?: string;
  loanApplicationId?: string;
  loanStatus?: string;
  adminNotificationMessage?: string;
  adminNotificationSubject?: string;
  // For Welcome Email & general branding
  fullName?: string;
  bankName?: string;
  emailLogoImageUrl?: string;
  // For Admin KYC Notification
  adminReviewUrl?: string;
  userId?: string; 
  // Password Changed Notification
  passwordChangedDate?: string;
  supportEmail?: string; 
  // OTP Email
  otp?: string;
  // Account Suspension
  suspensionReason?: string; // Added for future use, currently not passed
}

export interface EmailServiceResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface DeleteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: AdminUserView | null;
  onConfirmDelete: () => void;
}

export interface ReceiptDetails {
  transactionId?: string;
  date: Date;
  amount: number;
  currency: string;
  recipientName: string;
  recipientAccountNumber?: string; // For local
  recipientAccountNumberIBAN?: string; // For international
  bankName?: string;
  swiftBic?: string; // For international
  country?: string; // For international
  transferType: "Local" | "International";
  newBalance?: number;
  userPrimaryCurrency?: string;
  remarks?: string;
}

export interface TransactionReceiptModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  receiptDetails: ReceiptDetails | null;
}

export interface AdminSupportTicketDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ticket: AdminSupportTicket | null;
  onActionComplete: () => void; // To refresh the list after an action
  adminUserId?: string; // Optional adminId if you want to record who replied
  adminName?: string; // Optional adminName
}

export interface UserSupportTicketDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ticket: UserSupportTicket | null;
}

    