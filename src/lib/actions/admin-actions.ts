
// src/lib/actions/admin-actions.ts
"use server";

import { db, auth as firebaseAuth } from "@/lib/firebase"; 
import type { UserProfile, Loan, Transaction as TransactionType, KYCData, AdminAddUserFormData } from "@/types";
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
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
// Removed import { sendTransactionalEmail } from "../email-service";
import { AdminAddUserSchema } from "../schemas";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { getRandomName } from "../utils";


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
    const updateData: Partial<Pick<Loan, 'status' | 'approvalDate'>> = { status: newStatus };

    if (newStatus === "approved") {
      updateData.approvalDate = new Date(); 
    }

    await updateDoc(loanDocRef, updateData);

    const loanDocSnap = await getDoc(loanDocRef);
    const loanData = loanDocSnap.data() as Loan | undefined;

    // Removed email sending logic
    // console.log(`updateLoanStatusAction: Loan status email sending skipped for status ${newStatus}.`);

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
  currency: string, // Added currency parameter
  adminUserId?: string 
): Promise<ManualAdjustmentResult> {
  if (!targetUserId || !amount || !description || !currency) {
    return { success: false, message: "Missing required fields for manual adjustment (User ID, Amount, Description, Currency)." };
  }
  if (amount <= 0) {
    return { success: false, message: "Amount must be positive." };
  }

  let userProfileData: UserProfile | null = null;

  try {
    const adjustmentAmount = type === "credit" ? amount : -amount;
    const transactionTypeForRecord: TransactionType['type'] = type === "credit" ? "manual_credit" : "manual_debit";

    const transactionResult = await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, "users", targetUserId);
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("Target user profile not found.");
      }
      
      userProfileData = userDoc.data() as UserProfile;
      const currentBalances = userProfileData.balances || {};
      const balanceForCurrency = currentBalances[currency] || 0;
      
      const newBalanceForCurrency = parseFloat((balanceForCurrency + adjustmentAmount).toFixed(2));

      if (newBalanceForCurrency < 0 && type === 'debit') {
        console.warn(`User ${targetUserId} balance for ${currency} will be negative after this debit.`);
      }
      
      const newBalances = { ...currentBalances, [currency]: newBalanceForCurrency };
      transaction.update(userDocRef, { balances: newBalances });

      const transactionsColRef = collection(db, "transactions");
      const newTransactionData: Omit<TransactionType, "id" | "date"> & { date: Timestamp } = {
        userId: targetUserId,
        date: Timestamp.now(),
        description: description, 
        amount: adjustmentAmount,
        type: transactionTypeForRecord,
        status: "completed",
        currency: currency, 
        notes: `Manual adjustment by admin: ${adminUserId || 'System Action'}. Original input reason: ${description}`
      };
      const transactionDocRef = doc(collection(db, "transactions")); // Create new doc ref
      transaction.set(transactionDocRef, newTransactionData); 
      return { transactionId: transactionDocRef.id, newBalance: newBalanceForCurrency, userCurrency: currency }; 
    });
    
    // Removed email sending logic
    // console.log("issueManualAdjustmentAction: Debit/Credit notification email sending skipped.");

    revalidatePath("/admin/financial-ops");
    revalidatePath("/admin/transactions"); 
    revalidatePath("/admin/users"); 
    revalidatePath(`/dashboard/transactions`); 
    revalidatePath(`/dashboard`); 

    return {
      success: true,
      message: `Manual ${type} of ${transactionResult.userCurrency} ${amount.toFixed(2)} for user ${userProfileData?.displayName || targetUserId} processed. New balance for ${transactionResult.userCurrency}: ${transactionResult.userCurrency} ${transactionResult.newBalance.toFixed(2)}.`,
      transactionId: transactionResult.transactionId,
    };

  } catch (error: any) {
    console.error("Error issuing manual adjustment:", error);
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

  try {
    const userDocRef = doc(db, "users", targetUserId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return { success: false, message: "Target user profile not found." };
    }
    const userProfileData = userDocSnap.data() as UserProfile;
    const userCurrency = userProfileData.primaryCurrency || "USD";
    let currentBalanceForCurrency = (userProfileData.balances || {})[userCurrency] || 0;

    const batch = writeBatch(db);
    const transactionsColRef = collection(db, "transactions");

    let totalAmountForCompleted = 0;
    const generatedTransactions: Array<Omit<TransactionType, "id" | "date"> & { date: Timestamp }> = [];

    for (let i = 0; i < count; i++) {
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 90)); 
      randomDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

      let amount;
      let type: TransactionType['type'];

      if (targetNetValue !== undefined && targetNetValue !== null) {
        const remainingTransactions = count - i;
        let idealAmountPerTx = 0;
        if (remainingTransactions > 0) {
            idealAmountPerTx = (targetNetValue - totalAmountForCompleted) / remainingTransactions;
        }
        
        const randomFactor = (Math.random() * 0.6) + 0.7; 
        amount = parseFloat((idealAmountPerTx * randomFactor).toFixed(2));
        
        if (i === count - 1) { 
            amount = parseFloat((targetNetValue - totalAmountForCompleted).toFixed(2));
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

      if (amount > 0) {
        type = getRandomElement(["deposit", "credit"]);
      } else {
        type = getRandomElement(["withdrawal", "fee", "debit", "transfer"]);
      }
      
      let counterpartName = "";
      const isCompany = Math.random() < 0.4; 
      if (isCompany) {
        counterpartName = `${getRandomElement(companyRegions)} ${getRandomElement(companySuffixes)}`;
      } else {
        counterpartName = getRandomName();
      }
      
      const description = `${getRandomElement(transactionActions)} ${counterpartName}`;
      
      let status: TransactionType['status'];
      const statusRoll = Math.random() * 100;
      if (statusRoll < 95) { // 95% completed
        status = "completed";
      } else if (statusRoll < 98) { // 3% pending (95 to 97.99)
        status = "pending";
      } else { // 2% failed (98 to 99.99)
        status = "failed";
      }

      const transactionData: Omit<TransactionType, "id" | "date"> & { date: Timestamp } = {
        userId: targetUserId, 
        date: Timestamp.fromDate(randomDate),
        description: description,
        amount: amount,
        type: type,
        status: status,
        currency: userCurrency,
        isFlagged: Math.random() < 0.05, 
      };
      generatedTransactions.push(transactionData);

      if (status === 'completed') { 
        totalAmountForCompleted += amount;
      }
    }
    
    generatedTransactions.forEach(txData => {
        const newTransactionRef = doc(collection(db, "transactions")); 
        batch.set(newTransactionRef, txData);
    });

    const newBalanceForCurrency = parseFloat((currentBalanceForCurrency + totalAmountForCompleted).toFixed(2));
    const updatedBalances = { ...(userProfileData.balances || {}), [userCurrency]: newBalanceForCurrency };
    batch.update(userDocRef, { balances: updatedBalances });

    await batch.commit();

    revalidatePath("/admin/transactions");
    revalidatePath("/admin/financial-ops");
    revalidatePath("/admin/users");
    revalidatePath(`/dashboard/transactions`); 
    revalidatePath(`/dashboard`); 

    return { 
      success: true, 
      message: `${count} random transactions generated for user ${userProfileData.displayName || targetUserId}. Balance for ${userCurrency} updated by ${userCurrency} ${totalAmountForCompleted.toFixed(2)} to ${userCurrency} ${newBalanceForCurrency.toFixed(2)}.`, 
      count 
    };
  } catch (error: any) {
    console.error("Error generating random transactions:", error);
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

    const kycUpdate: Partial<KYCData> = {
      status: "verified",
      reviewedAt: new Date(), 
      reviewedBy: adminId || "system_admin_placeholder", 
      rejectionReason: "" 
    };
    const userProfileUpdate: Partial<UserProfile> = { kycStatus: "verified" };

    const firestoreBatch = writeBatch(db); 
    firestoreBatch.update(kycDocRef, kycUpdate);
    firestoreBatch.update(userDocRef, userProfileUpdate);
    await firestoreBatch.commit();
    
    // Removed email sending logic
    // console.log("approveKycAction: KYC approved email sending skipped.");

    revalidatePath("/admin/kyc");
    revalidatePath(`/dashboard/kyc`);
    revalidatePath("/admin/users"); 
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

    const kycUpdate: Partial<KYCData> = {
      status: "rejected",
      rejectionReason,
      reviewedAt: new Date(), 
      reviewedBy: adminId || "system_admin_placeholder", 
    };
    const userProfileUpdate: Partial<UserProfile> = { kycStatus: "rejected" };

    const firestoreBatch = writeBatch(db); 
    firestoreBatch.update(kycDocRef, kycUpdate);
    firestoreBatch.update(userDocRef, userProfileUpdate);
    await firestoreBatch.commit();

    // Removed email sending logic
    // console.log("rejectKycAction: KYC rejected email sending skipped.");

    revalidatePath("/admin/kyc");
    revalidatePath(`/dashboard/kyc`);
    revalidatePath("/admin/users");
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
  // amount: number // Amount is fetched from transactionData now
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
      const transactionCurrency = transactionData.currency || userProfileData.primaryCurrency || "USD";
      const currentBalances = userProfileData.balances || {};
      const balanceForCurrency = currentBalances[transactionCurrency] || 0;
      
      const newBalanceForCurrency = parseFloat((balanceForCurrency + transactionData.amount).toFixed(2));
      const newBalances = { ...currentBalances, [transactionCurrency]: newBalanceForCurrency };


      firestoreTransaction.update(transactionDocRef, { status: "completed", updatedAt: Timestamp.now() });
      firestoreTransaction.update(userDocRef, { balances: newBalances });
    });

    revalidatePath("/admin/transactions");
    revalidatePath("/admin/users"); 
    revalidatePath(`/dashboard/transactions`); 
    revalidatePath(`/dashboard`); 

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
    console.log("adminAddUserAction: Attempting to create Firebase Auth user for:", email);
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password); 
    newAuthUser = userCredential.user;
    const uid = newAuthUser.uid;
    console.log("adminAddUserAction: Firebase Auth user created successfully. UID:", uid);

    const userDocRef = doc(db, "users", uid);
    const newAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const initialBalance = 0;
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
      primaryCurrency: primaryCurrency,
      balances: { [primaryCurrency]: initialBalance },
      kycStatus: "not_started",
      role: role || "user",
      accountNumber: newAccountNumber,
      isFlagged: false,
      accountHealthScore: 75,
      profileCompletionPercentage: 50,
      isSuspended: false,
    };

    await setDoc(userDocRef, newUserProfileData);
    console.log("adminAddUserAction: Firestore profile created successfully for UID:", uid);
    
    // Removed email sending logic
    // console.log("adminAddUserAction: Welcome email sending skipped.");
    
    revalidatePath("/admin/users");
    return { success: true, message: "User created successfully.", userId: uid };

  } catch (error: any) {
    console.error("Error in adminAddUserAction:", error);
    if (newAuthUser && newAuthUser.delete) { 
      try {
        await deleteUser(newAuthUser); 
        console.warn("AdminAddUserAction: Rolled back Firebase Auth user due to Firestore error.");
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

    