
// src/lib/actions/admin-actions.ts
"use server";

import { db, auth as firebaseAuth } from "@/lib/firebase"; 
import type { UserProfile, Loan, Transaction as TransactionType, KYCData, AdminAddUserFormData, AdminSupportTicket, SupportTicketReply } from "@/types";
import {
  doc,
  updateDoc,
  collection,
  Timestamp,
  runTransaction,
  addDoc,
  writeBatch,
  getDoc,
  query,
  where,
  getCountFromServer,
  setDoc,
  deleteDoc, 
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { AdminAddUserSchema } from "../schemas";
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser } from "firebase/auth"; 
import { getRandomName, formatCurrency } from "../utils";
import { sendTransactionalEmail, getEmailTemplateAndSubject } from "../email-service";
import { getPlatformSettingsAction } from "./admin-settings-actions";


// --- Dashboard Stats ---
interface AdminDashboardStats {
  totalUsers: number;
  pendingKyc: number;
  activeLoans: number;
}

interface GetAdminDashboardStatsResult {
  success: boolean;
  stats?: AdminDashboardStats;
  error?: string;
}

export async function getAdminDashboardStatsAction(): Promise<GetAdminDashboardStatsResult> {
  try {
    const usersColRef = collection(db, "users");
    const kycColRef = collection(db, "kycData");
    const loansColRef = collection(db, "loans");

    const usersQuery = query(usersColRef);
    const pendingKycQuery = query(kycColRef, where("status", "==", "pending_review"));
    const activeLoansQuery = query(loansColRef, where("status", "==", "active"));
    
    const usersSnapshot = await getCountFromServer(usersQuery);
    const pendingKycSnapshot = await getCountFromServer(pendingKycQuery);
    const activeLoansSnapshot = await getCountFromServer(activeLoansQuery);

    const stats: AdminDashboardStats = {
      totalUsers: usersSnapshot.data().count,
      pendingKyc: pendingKycSnapshot.data().count,
      activeLoans: activeLoansSnapshot.data().count,
    };

    return { success: true, stats };
  } catch (error: any) {
    console.error("Error fetching admin dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard statistics." };
  }
}


// --- Loan Actions ---
interface UpdateLoanStatusResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function updateLoanStatusAction(
  loanId: string,
  userId: string, 
  newStatus: Loan["status"]
): Promise<UpdateLoanStatusResult> {
  try {
    const loanDocRef = doc(db, "loans", loanId);
    const updateData: Partial<Pick<Loan, 'status' | 'approvalDate' | 'paidDate'>> = { status: newStatus };

    if (newStatus === "approved") {
      updateData.approvalDate = Timestamp.now(); 
    } else if (newStatus === "paid") {
      updateData.paidDate = Timestamp.now();
    }

    await updateDoc(loanDocRef, updateData);

    revalidatePath("/admin/loans");
    revalidatePath(`/dashboard/loans`); 
    return { success: true, message: `Loan ${loanId} status updated to ${newStatus}.` };
  } catch (error: any) {
    console.error("Error updating loan status:", error);
    return {
      success: false,
      message: "Failed to update loan status.",
      error: error.message,
    };
  }
}

interface DisburseLoanResult {
    success: boolean;
    message: string;
    transactionId?: string;
    error?: string;
}

export async function disburseLoanAction(
    loanId: string,
    userId: string,
    loanAmount: number,
    loanCurrency?: string
): Promise<DisburseLoanResult> {
    if (!loanId || !userId || loanAmount <= 0) {
        return { success: false, message: "Loan ID, User ID, and a positive loan amount are required." };
    }

    try {
        const transactionResult = await runTransaction(db, async (transaction) => {
            const loanDocRef = doc(db, "loans", loanId);
            const userDocRef = doc(db, "users", userId);

            const loanDoc = await transaction.get(loanDocRef);
            const userDoc = await transaction.get(userDocRef);

            if (!loanDoc.exists()) throw new Error("Loan application not found.");
            if (!userDoc.exists()) throw new Error("User profile not found.");
            
            const loanData = loanDoc.data() as Loan;
            const userProfileData = userDoc.data() as UserProfile;

            if (loanData.status !== "approved") {
                throw new Error("Loan must be in 'approved' status to be disbursed.");
            }

            const currentBalance = userProfileData.balance || 0;
            const userPrimaryCurrency = userProfileData.primaryCurrency || "USD";
            const effectiveLoanCurrency = loanCurrency || userPrimaryCurrency;

            // For simplicity, assume loanCurrency matches user's primaryCurrency or will be handled as such.
            // In a real-world scenario, currency conversion logic might be needed if they differ.
            const newBalance = parseFloat((currentBalance + loanAmount).toFixed(2));
            
            transaction.update(userDocRef, { balance: newBalance });
            transaction.update(loanDocRef, { status: "active", disbursedDate: Timestamp.now() });

            const newTransactionData: Omit<TransactionType, "id" | "date"> & { date: Timestamp } = {
                userId: userId,
                date: Timestamp.now(),
                description: `Loan disbursement (Loan ID: ${loanId})`,
                amount: loanAmount, // Positive amount as it's a credit to user
                type: "loan_disbursement",
                status: "completed",
                currency: effectiveLoanCurrency,
                relatedTransferId: loanId, // Using this field to link to the loan
            };
            const transactionDocRef = doc(collection(db, "transactions"));
            transaction.set(transactionDocRef, newTransactionData);

            return { transactionId: transactionDocRef.id, newBalance: newBalance };
        });

        revalidatePath("/admin/loans");
        revalidatePath("/admin/users");
        revalidatePath("/admin/transactions");
        revalidatePath(`/dashboard/transactions`);
        revalidatePath(`/dashboard`);
        revalidatePath(`/dashboard/profile`);

        return { 
            success: true, 
            message: `Loan ${loanId} disbursed successfully. Amount: ${loanCurrency || '$'}${loanAmount.toFixed(2)}. New balance: ${loanCurrency || '$'}${transactionResult.newBalance.toFixed(2)}.`,
            transactionId: transactionResult.transactionId 
        };

    } catch (error: any) {
        console.error("Error disbursing loan:", error);
        return { success: false, message: error.message || "Failed to disburse loan.", error: error.message };
    }
}


// --- User Role Actions ---
interface UpdateUserRoleResult {
    success: boolean;
    message: string;
    error?: string;
}

export async function updateUserRoleAction(userId: string, newRole: UserProfile['role']): Promise<UpdateUserRoleResult> {
    if (!newRole || (newRole !== 'user' && newRole !== 'admin')) {
        return { success: false, message: "Invalid role specified." };
    }
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { role: newRole });
        revalidatePath("/admin/users");
        return { success: true, message: `User ${userId} role updated to ${newRole}.` };
    } catch (error: any) {
        console.error("Error updating user role:", error);
        return { success: false, message: "Failed to update user role.", error: error.message };
    }
}


// --- Financial Operations Actions ---
interface ManualAdjustmentResult {
  success: boolean;
  message: string;
  transactionId?: string;
  error?: string;
}

export async function issueManualAdjustmentAction(
  targetUserId: string,
  amount: number,
  type: "credit" | "debit",
  description: string,
  currency?: string, 
  adminUserId?: string 
): Promise<ManualAdjustmentResult> {
  if (!targetUserId || !amount || !description ) {
    return { success: false, message: "Missing required fields: User ID, Amount, or Description." };
  }
  if (amount <= 0) {
    return { success: false, message: "Amount must be positive." };
  }

  const adjustmentAmount = type === "credit" ? amount : -amount;
  const transactionTypeForRecord: TransactionType['type'] = type === "credit" ? "manual_credit" : "manual_debit";

  try {
    const transactionResult = await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, "users", targetUserId);
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("Target user profile not found.");
      }
      
      const userProfileData = userDoc.data() as UserProfile;
      const currentBalance = userProfileData.balance || 0;
      const userPrimaryCurrency = userProfileData.primaryCurrency || "USD";
      
      const newBalance = parseFloat((currentBalance + adjustmentAmount).toFixed(2));
      
      transaction.update(userDocRef, { balance: newBalance });

      const newTransactionData: Omit<TransactionType, "id" | "date"> & { date: Timestamp } = {
        userId: targetUserId,
        date: Timestamp.now(),
        description: description, 
        amount: adjustmentAmount,
        type: transactionTypeForRecord,
        status: "completed",
        currency: currency || userPrimaryCurrency, 
        notes: `Manual adjustment by admin: ${adminUserId || 'System Action'}. Original input reason: ${description}`
      };
      const transactionDocRef = doc(collection(db, "transactions")); 
      transaction.set(transactionDocRef, newTransactionData); 

      return { 
        transactionId: transactionDocRef.id, 
        newBalance: newBalance,
        userCurrency: currency || userPrimaryCurrency, 
        userFullName: userProfileData.displayName || `${userProfileData.firstName} ${userProfileData.lastName}`.trim() || targetUserId,
        userEmail: userProfileData.email,
        transactionDate: newTransactionData.date.toDate().toISOString(),
        accountNumber: userProfileData.accountNumber,
        adjustmentType: type,
      }; 
    });
    
    const successMessage = `Manual ${type} of ${transactionResult.userCurrency} ${amount.toFixed(2)} for user ${transactionResult.userFullName} processed. New balance: ${transactionResult.userCurrency} ${transactionResult.newBalance.toFixed(2)}.`;

    if (transactionResult.userEmail) {
        const dateOfTransaction = new Date(transactionResult.transactionDate);
        const emailPayload = {
            fullName: transactionResult.userFullName,
            transactionAmount: formatCurrency(Math.abs(adjustmentAmount), transactionResult.userCurrency),
            transactionType: transactionResult.adjustmentType === "credit" ? "Credit" : "Debit",
            transactionDate: dateOfTransaction.toLocaleDateString(),
            transactionTime: dateOfTransaction.toLocaleTimeString(),
            transactionValueDate: dateOfTransaction.toLocaleDateString(),
            transactionId: transactionResult.transactionId,
            transactionDescription: description,
            accountNumber: transactionResult.accountNumber ? `******${transactionResult.accountNumber.slice(-4)}` : "N/A",
            currentBalance: formatCurrency(transactionResult.newBalance, transactionResult.userCurrency),
            availableBalance: formatCurrency(transactionResult.newBalance, transactionResult.userCurrency), // Assuming same for simplicity
            transactionLocation: "Admin Platform",
            transactionRemarks: description,
            loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard/transactions`,
        };
        const emailNotificationType = transactionResult.adjustmentType === "credit" ? "CREDIT_NOTIFICATION" : "DEBIT_NOTIFICATION";
        try {
            const emailContent = await getEmailTemplateAndSubject(emailNotificationType, emailPayload);
            if (emailContent.html) {
                sendTransactionalEmail({
                    to: transactionResult.userEmail,
                    subject: emailContent.subject,
                    htmlBody: emailContent.html,
                }).then(emailRes => {
                    if (!emailRes.success) console.error(`Failed to send ${type} notification email for manual adjustment:`, emailRes.error);
                });
            }
        } catch (emailError: any) {
            console.error(`Error preparing ${type} notification email for manual adjustment:`, emailError.message);
        }
    }


    revalidatePath("/admin/financial-ops");
    revalidatePath("/admin/transactions"); 
    revalidatePath("/admin/users"); 
    revalidatePath(`/dashboard/transactions`); 
    revalidatePath(`/dashboard`); 
    revalidatePath(`/dashboard/profile`);

    return {
      success: true,
      message: successMessage,
      transactionId: transactionResult.transactionId,
    };

  } catch (error: any)
{
    console.error("Error during manual adjustment:", error);
    return {
      success: false,
      message: error.message || "Failed to issue manual adjustment.",
      error: error.message,
    };
  }
}

const companySuffixes = ["Solutions", "Group", "Enterprises", "Corp", "Ltd.", "Inc.", "Global", "Tech", "Ventures", "Industries", "Systems", "Logistics", "Holdings", "Partners", "Dynamics"];
const companyRegions = ["Global", "Atlantic", "Pacific", "Euro", "Asia", "Ameri", "International", "Continental", "Northern", "Southern", "Western", "Eastern", "Cyber", "Nova", "Quantum"];
const transactionActions = ["Payment to", "Received from", "Invoice for", "Services by", "Consulting for", "Purchase from", "Refund from", "Subscription to", "Transfer to", "Credit from", "Market adjustment by", "Processing fee for", "Logistics for", "Development of", "Marketing for"];
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


interface GenerateRandomTransactionsResult {
  success: boolean;
  message: string;
  count?: number;
  error?: string;
}

export async function generateRandomTransactionsAction(
  targetUserId: string,
  count: number,
  targetNetValue?: number
): Promise<GenerateRandomTransactionsResult> {
  if (!targetUserId || count <= 0) {
    return { success: false, message: "User ID and a positive count are required." };
  }
  if (count > 50) { 
    return { success: false, message: "Cannot generate more than 50 transactions at once." };
  }
  console.log(`generateRandomTransactionsAction: Starting for user ${targetUserId}, count: ${count}, targetNetValue: ${targetNetValue}`);

  try {
    const userDocRef = doc(db, "users", targetUserId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.error(`generateRandomTransactionsAction: User profile not found for ${targetUserId}.`);
      return { success: false, message: "Target user profile not found." };
    }
    const userProfileData = userDocSnap.data() as UserProfile;
    const userPrimaryCurrency = userProfileData.primaryCurrency || "USD";
    const initialBalance = userProfileData.balance || 0;
    console.log(`generateRandomTransactionsAction: User ${targetUserId} initial balance: ${initialBalance} ${userPrimaryCurrency}`);
    
    const batch = writeBatch(db);
    let cumulativeAmountForCompletedTx = 0;
    let generatedTxCount = 0;

    for (let i = 0; i < count; i++) {
      const randomDate = new Date();
      const hoursAgo = Math.floor(Math.random() * 24);
      randomDate.setHours(randomDate.getHours() - hoursAgo);
      randomDate.setMinutes(Math.floor(Math.random() * 60));
      randomDate.setSeconds(Math.floor(Math.random() * 60));


      let amount;
      if (targetNetValue !== undefined && targetNetValue !== null) {
        const remainingTransactions = count - i;
        let idealAmountPerTx = 0;
        if (remainingTransactions > 0) {
            idealAmountPerTx = (targetNetValue - cumulativeAmountForCompletedTx) / remainingTransactions;
        }
        const randomFactor = (Math.random() * 0.6) + 0.7; 
        amount = parseFloat((idealAmountPerTx * randomFactor).toFixed(2));
        if (i === count - 1) { 
            amount = parseFloat((targetNetValue - cumulativeAmountForCompletedTx).toFixed(2));
        }
        const maxReasonableTxAmount = targetNetValue === 0 ? 500 : (Math.abs(targetNetValue) / Math.max(1, count / 4)) * 1.5;
        const minReasonableTxAmount = targetNetValue === 0 ? -500 : (Math.abs(targetNetValue) / Math.max(1, count / 4)) * -1.5;
        amount = Math.max(minReasonableTxAmount, Math.min(maxReasonableTxAmount, amount));
        amount = parseFloat(amount.toFixed(2)); 
        if (amount === 0 && targetNetValue !== 0 && count > 1 && i < count -1 ) { 
            amount = parseFloat(((Math.random() < 0.5 ? 1 : -1) * (Math.random() * 50 + 5)).toFixed(2));
        }
      } else {
        amount = (Math.random() * 495 + 5) * (Math.random() < 0.55 ? 1 : -1); 
        amount = parseFloat(amount.toFixed(2));
      }

      const type: TransactionType['type'] = amount > 0 ? getRandomElement(["deposit", "credit", "manual_credit"]) : getRandomElement(["withdrawal", "fee", "debit", "transfer", "manual_debit"]);
      let counterpartName = Math.random() < 0.4 ? `${getRandomElement(companyRegions)} ${getRandomElement(companySuffixes)}` : getRandomName();
      const description = `${getRandomElement(transactionActions)} ${counterpartName}`;
      
      const statusRoll = Math.random() * 100;
      const status: TransactionType['status'] = statusRoll < 95 ? "completed" : statusRoll < 98 ? "pending" : "failed";

      const transactionData: Omit<TransactionType, "id" | "date"> & { date: Timestamp } = {
        userId: targetUserId, 
        date: Timestamp.fromDate(randomDate),
        description: description,
        amount: amount,
        type: type,
        status: status,
        currency: userPrimaryCurrency,
        isFlagged: Math.random() < 0.05, 
      };
      console.log(`generateRandomTransactionsAction: Generated tx ${i+1}: Amount: ${amount}, Status: ${status}, Type: ${type}`);
      
      const newTransactionRef = doc(collection(db, "transactions")); 
      batch.set(newTransactionRef, transactionData);
      generatedTxCount++;

      if (status === 'completed') { 
        cumulativeAmountForCompletedTx += amount;
        console.log(`generateRandomTransactionsAction: Tx ${i+1} is 'completed'. cumulativeAmountForCompletedTx updated to: ${cumulativeAmountForCompletedTx}`);
      }
    }
    console.log(`generateRandomTransactionsAction: Total amount for 'completed' transactions: ${cumulativeAmountForCompletedTx}`);
    
    const finalBalance = parseFloat((initialBalance + cumulativeAmountForCompletedTx).toFixed(2));
    console.log(`generateRandomTransactionsAction: Calculated new balance for ${userPrimaryCurrency}: ${finalBalance}`);
    
    batch.update(userDocRef, { balance: finalBalance });
    console.log(`generateRandomTransactionsAction: Updating user doc with balance: ${finalBalance}. Added ${generatedTxCount} transaction sets to batch.`);
    
    await batch.commit();
    console.log(`generateRandomTransactionsAction: Batch committed successfully for user ${targetUserId}.`);
    
    revalidatePath("/admin/transactions");
    revalidatePath("/admin/financial-ops");
    revalidatePath("/admin/users");
    revalidatePath(`/dashboard/transactions`); 
    revalidatePath(`/dashboard`); 
    revalidatePath(`/dashboard/profile`);

    return { 
      success: true, 
      message: `${generatedTxCount} random transactions generated for user ${userProfileData.displayName || targetUserId}. Balance updated by ${userPrimaryCurrency} ${cumulativeAmountForCompletedTx.toFixed(2)} to ${userPrimaryCurrency} ${finalBalance.toFixed(2)}.`, 
      count: generatedTxCount 
    };
  } catch (error: any) {
    console.error(`Error generating random transactions for user ${targetUserId}:`, error);
    return {
      success: false,
      message: "Failed to generate random transactions.",
      error: error.message,
    };
  }
}

// --- User Suspension Actions ---
interface UpdateUserSuspensionStatusResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function updateUserSuspensionStatusAction(
  userId: string,
  newSuspensionStatus: boolean
): Promise<UpdateUserSuspensionStatusResult> {
  if (!userId) {
    return { success: false, message: "User ID is required." };
  }
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { isSuspended: newSuspensionStatus });

    revalidatePath("/admin/users");
    return { 
      success: true, 
      message: `User ${userId} suspension status updated to ${newSuspensionStatus ? 'suspended' : 'active'}.` 
    };
  } catch (error: any) {
    console.error("Error updating user suspension status:", error);
    return { 
      success: false, 
      message: "Failed to update user suspension status.", 
      error: error.message 
    };
  }
}

// --- KYC Actions ---
interface KYCActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function approveKycAction(kycId: string, userId: string, adminId?: string): Promise<KYCActionResult> {
  try {
    const kycDocRef = doc(db, "kycData", kycId); 
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { success: false, message: `User profile for ${userId} not found.` };
    }
    const userProfile = userDocSnap.data() as UserProfile;

    const kycUpdate: Partial<KYCData> = {
      status: "verified",
      reviewedAt: Timestamp.now(), 
      reviewedBy: adminId || "system_admin_placeholder", 
      rejectionReason: "" 
    };
    const userProfileUpdate: Partial<UserProfile> = { kycStatus: "verified" };

    const firestoreBatch = writeBatch(db); 
    firestoreBatch.update(kycDocRef, kycUpdate);
    firestoreBatch.update(userDocRef, userProfileUpdate);
    await firestoreBatch.commit();

    // Send KYC Approved Email
    const settingsResult = await getPlatformSettingsAction();
    const emailPayload = {
      fullName: userProfile.displayName || userProfile.firstName || "Customer",
      bankName: settingsResult.settings?.platformName || "Wohana Funds",
      emailLogoImageUrl: settingsResult.settings?.emailLogoImageUrl,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard`,
    };

    if (userProfile.email) {
      try {
        const emailContent = await getEmailTemplateAndSubject("KYC_APPROVED", emailPayload);
        if (emailContent.html) {
          sendTransactionalEmail({
            to: userProfile.email,
            subject: emailContent.subject,
            htmlBody: emailContent.html,
            textBody: `Congratulations ${emailPayload.fullName}, your KYC has been approved. You now have full access. - The ${emailPayload.bankName} Team.`
          }).then(emailResult => {
            if (!emailResult.success) console.error("Failed to send KYC approved email:", emailResult.error);
          });
        }
      } catch (emailError: any) {
        console.error("Error preparing/sending KYC approved email:", emailError.message);
      }
    }
    
    revalidatePath("/admin/kyc");
    revalidatePath(`/dashboard/kyc`);
    revalidatePath("/admin/users"); 
    revalidatePath(`/dashboard`);
    revalidatePath(`/dashboard/profile`);
    return { success: true, message: `KYC for user ${userId} approved.` };
  } catch (error: any) {
    console.error("Error approving KYC:", error);
    return { success: false, message: "Failed to approve KYC.", error: error.message };
  }
}

export async function rejectKycAction(kycId: string, userId: string, rejectionReason: string, adminId?: string): Promise<KYCActionResult> {
  if (!rejectionReason.trim()) {
    return { success: false, message: "Rejection reason is required." };
  }
  try {
    const kycDocRef = doc(db, "kycData", kycId);
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
     if (!userDocSnap.exists()) {
      return { success: false, message: `User profile for ${userId} not found.` };
    }
    const userProfile = userDocSnap.data() as UserProfile;

    const kycUpdate: Partial<KYCData> = {
      status: "rejected",
      rejectionReason,
      reviewedAt: Timestamp.now(), 
      reviewedBy: adminId || "system_admin_placeholder", 
    };
    const userProfileUpdate: Partial<UserProfile> = { kycStatus: "rejected" };

    const firestoreBatch = writeBatch(db); 
    firestoreBatch.update(kycDocRef, kycUpdate);
    firestoreBatch.update(userDocRef, userProfileUpdate);
    await firestoreBatch.commit();

    // Send KYC Rejected Email
    const settingsResult = await getPlatformSettingsAction();
    const emailPayload = {
      fullName: userProfile.displayName || userProfile.firstName || "Customer",
      bankName: settingsResult.settings?.platformName || "Wohana Funds",
      emailLogoImageUrl: settingsResult.settings?.emailLogoImageUrl,
      kycRejectionReason: rejectionReason,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard/kyc`,
    };

    if (userProfile.email) {
       try {
        const emailContent = await getEmailTemplateAndSubject("KYC_REJECTED", emailPayload);
        if (emailContent.html) {
          sendTransactionalEmail({
            to: userProfile.email,
            subject: emailContent.subject,
            htmlBody: emailContent.html,
            textBody: `Dear ${emailPayload.fullName}, your KYC submission was rejected. Reason: ${rejectionReason}. Please resubmit. - The ${emailPayload.bankName} Team.`
          }).then(emailResult => {
            if (!emailResult.success) console.error("Failed to send KYC rejected email:", emailResult.error);
          });
        }
      } catch (emailError: any) {
        console.error("Error preparing/sending KYC rejected email:", emailError.message);
      }
    }

    revalidatePath("/admin/kyc");
    revalidatePath(`/dashboard/kyc`);
    revalidatePath("/admin/users");
    revalidatePath(`/dashboard`);
    revalidatePath(`/dashboard/profile`);
    return { success: true, message: `KYC for user ${userId} rejected.` };
  } catch (error: any) {
    console.error("Error rejecting KYC:", error);
    return { success: false, message: "Failed to reject KYC.", error: error.message };
  }
}

interface TransactionActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function markTransactionAsCompletedAction(
  transactionId: string,
  userId: string,
  transactionAmountForBalanceUpdate: number 
): Promise<TransactionActionResult> {
  if (!transactionId || !userId) {
    return { success: false, message: "Transaction ID and User ID are required." };
  }

  try {
    await runTransaction(db, async (firestoreTransaction) => {
      const transactionDocRef = doc(db, "transactions", transactionId);
      const userDocRef = doc(db, "users", userId);

      const transactionDoc = await firestoreTransaction.get(transactionDocRef);
      const userDoc = await firestoreTransaction.get(userDocRef);

      if (!transactionDoc.exists()) {
        throw new Error("Transaction not found.");
      }
      if (!userDoc.exists()) {
        throw new Error("User profile not found.");
      }

      const transactionData = transactionDoc.data() as TransactionType;
      if (transactionData.status !== "pending") {
        throw new Error("Only pending transactions can be marked as completed.");
      }
      
      const userProfileData = userDoc.data() as UserProfile;
      const currentBalance = userProfileData.balance || 0;
      
      const newBalance = parseFloat((currentBalance + transactionAmountForBalanceUpdate).toFixed(2));
      
      firestoreTransaction.update(userDocRef, { balance: newBalance });
      firestoreTransaction.update(transactionDocRef, { status: "completed", updatedAt: Timestamp.now() });
    });

    revalidatePath("/admin/transactions");
    revalidatePath("/admin/users"); 
    revalidatePath(`/dashboard/transactions`); 
    revalidatePath(`/dashboard`); 
    revalidatePath(`/dashboard/profile`);

    return { success: true, message: `Transaction ${transactionId} marked as completed and balance updated.` };
  } catch (error: any) {
    console.error("Error marking transaction as completed:", error);
    return {
      success: false,
      message: error.message || "Failed to mark transaction as completed.",
      error: error.message,
    };
  }
}


// Admin Add User Action
interface AdminAddUserResult {
  success: boolean;
  message: string;
  userId?: string;
  error?: string | Record<string, string[]>;
}

export async function adminAddUserAction(formData: AdminAddUserFormData): Promise<AdminAddUserResult> {
  const validatedData = AdminAddUserSchema.safeParse(formData);
  if (!validatedData.success) {
    return {
      success: false,
      message: "Invalid user data.",
      error: validatedData.error.flatten().fieldErrors,
    };
  }
  const { email, password, firstName, lastName, phoneNumber, accountType, currency, role } = validatedData.data;

  let newAuthUser: any = null; 
  try {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password); 
    newAuthUser = userCredential.user;
    const uid = newAuthUser.uid;

    const userDocRef = doc(db, "users", uid);
    const newAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const constructedDisplayName = `${firstName} ${lastName}`;
    const primaryCurrency = currency || "USD";


    const newUserProfileData: UserProfile = {
      uid,
      email,
      firstName,
      lastName,
      displayName: constructedDisplayName,
      photoURL: null,
      phoneNumber: phoneNumber || undefined,
      accountType: accountType || "default_user_type",
      balance: 0, // Initialize single balance
      primaryCurrency: primaryCurrency,
      kycStatus: "not_started",
      role: role || "user",
      accountNumber: newAccountNumber,
      isFlagged: false,
      accountHealthScore: 75,
      profileCompletionPercentage: 50,
      isSuspended: false,
    };

    await setDoc(userDocRef, newUserProfileData);
    
    revalidatePath("/admin/users");
    return { success: true, message: "User created successfully.", userId: uid };

  } catch (error: any) {
    console.error("Error in adminAddUserAction:", error);
    if (newAuthUser && newAuthUser.delete) { 
      try {
        await deleteAuthUser(newAuthUser); 
      } catch (deleteError) {
        console.error("AdminAddUserAction: CRITICAL - Failed to roll back Firebase Auth user:", deleteError);
      }
    }
    let errorMessage = "Failed to create user.";
    if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered.";
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, message: errorMessage, error: error.message };
  }
}

// --- User Deletion Action ---
interface DeleteUserAccountResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function deleteUserAccountAction(userId: string): Promise<DeleteUserAccountResult> {
  if (!userId) {
    return { success: false, message: "User ID is required for deletion." };
  }

  try {
    const batch = writeBatch(db);

    // Delete user profile from 'users' collection
    const userProfileRef = doc(db, "users", userId);
    batch.delete(userProfileRef);

    // Delete user's KYC data from 'kycData' collection (document ID is userId)
    const kycDataRef = doc(db, "kycData", userId);
    const kycDocSnap = await getDoc(kycDataRef); // Check if it exists before trying to delete
    if (kycDocSnap.exists()) {
      batch.delete(kycDataRef);
    }

    await batch.commit();

    revalidatePath("/admin/users");

    return {
      success: true,
      message: `User profile (ID: ${userId}) and associated KYC data deleted from Firestore successfully. Firebase Auth record must be deleted separately.`,
    };
  } catch (error: any) {
    console.error(`Error deleting user data for UID ${userId} from Firestore:`, error);
    return {
      success: false,
      message: "Failed to delete user data from Firestore.",
      error: error.message,
    };
  }
}


// --- Admin Support Ticket Actions ---
interface AdminSupportTicketActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function adminReplyToSupportTicketAction(
  ticketId: string,
  replyText: string,
  adminName: string = "Admin",
  adminUserId?: string, // Optional: if you want to log which admin replied
  newStatus?: AdminSupportTicket['status']
): Promise<AdminSupportTicketActionResult> {
  if (!ticketId || !replyText.trim()) {
    return { success: false, message: "Ticket ID and reply text are required." };
  }

  try {
    const ticketDocRef = doc(db, "supportTickets", ticketId);

    const newReply: SupportTicketReply = {
      id: doc(collection(db, "dummy")).id, // Generate a unique ID for the reply
      authorId: adminUserId || "admin_system",
      authorName: adminName,
      authorRole: "admin",
      message: replyText.trim(),
      timestamp: serverTimestamp() as Timestamp,
    };

    const updateData: Partial<AdminSupportTicket> & { updatedAt: Timestamp, replies?: any } = {
      updatedAt: serverTimestamp() as Timestamp,
      replies: arrayUnion(newReply)
    };

    if (newStatus) {
      updateData.status = newStatus;
    } else {
      // If admin is replying, and current status is 'open' or 'pending_admin_reply',
      // change to 'pending_user_reply'
      const ticketSnap = await getDoc(ticketDocRef);
      if (ticketSnap.exists()) {
        const currentTicketData = ticketSnap.data() as AdminSupportTicket;
        if (currentTicketData.status === 'open' || currentTicketData.status === 'pending_admin_reply') {
          updateData.status = 'pending_user_reply';
        }
      }
    }
    
    await updateDoc(ticketDocRef, updateData);
    
    // TODO: Send email notification to user about the new reply

    revalidatePath("/admin/support");
    return { success: true, message: "Reply sent and ticket updated." };

  } catch (error: any) {
    console.error("Error replying to support ticket:", error);
    return { success: false, message: "Failed to send reply.", error: error.message };
  }
}
