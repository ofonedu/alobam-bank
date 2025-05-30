
// src/lib/actions/admin-actions.ts
"use server";

import { db } from "@/lib/firebase";
import type { UserProfile, Loan, Transaction as TransactionType, KYCData, DashboardNavItem } from "@/types";
import {
  doc,
  updateDoc,
  collection,
  getDocs,
  Timestamp,
  runTransaction,
  addDoc,
  writeBatch,
  getDoc,
  query,
  where,
  getCountFromServer
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { sendTransactionalEmail } from "../email-service";
import { AdminAddUserSchema, type AdminAddUserFormData } from "../schemas";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";


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

    const loanDocSnap = await getDoc(loanDocRef); // Fetch after update to get latest data for email
    const loanData = loanDocSnap.data() as Loan | undefined;

    if (newStatus === "approved") {
      await sendTransactionalEmail({
        userId,
        emailType: "LOAN_APPROVED",
        data: {
          loanId,
          loanAmount: loanData?.amount,
          currency: "USD", // Assuming USD, adjust if loans have currency
          approvalDate: updateData.approvalDate ? new Date(updateData.approvalDate).toLocaleDateString() : "N/A",
        },
      });
    } else if (newStatus === "rejected") {
       await sendTransactionalEmail({
        userId,
        emailType: "LOAN_REJECTED",
        data: {
          loanId,
          loanAmount: loanData?.amount,
          currency: "USD", // Assuming USD
          rejectionDate: new Date().toLocaleDateString(), // Current date for rejection
          reason: "Application did not meet criteria.", // Placeholder reason
        },
      });
    }

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
  adminUserId?: string 
): Promise<ManualAdjustmentResult> {
  if (!targetUserId || !amount || !description) {
    return { success: false, message: "Missing required fields for manual adjustment." };
  }
  if (amount <= 0) {
    return { success: false, message: "Amount must be positive." };
  }

  let userProfileData: UserProfile | null = null;

  try {
    const adjustmentAmount = type === "credit" ? amount : -amount;
    const transactionTypeForRecord: TransactionType['type'] = type; // 'credit' or 'debit'

    const transactionResult = await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, "users", targetUserId);
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("Target user profile not found.");
      }
      
      userProfileData = userDoc.data() as UserProfile;
      const currentBalance = userProfileData.balance;
      const newBalance = parseFloat((currentBalance + adjustmentAmount).toFixed(2));

      if (newBalance < 0 && type === 'debit') {
        console.warn(`User ${targetUserId} balance will be negative after this debit.`);
      }
      
      transaction.update(userDocRef, { balance: newBalance });

      const transactionsColRef = collection(db, "transactions");
      const newTransactionData: Omit<TransactionType, "id" | "date"> & { date: Timestamp } = {
        userId: targetUserId,
        date: Timestamp.now(),
        description: description, 
        amount: adjustmentAmount,
        type: transactionTypeForRecord,
        status: "completed",
        currency: userProfileData.currency || "USD", 
        notes: `Manual adjustment by admin: ${adminUserId || 'System Action'}. User: ${userProfileData.displayName || targetUserId}. Original input reason: ${description}`
      };
      const transactionDocRef = await addDoc(transactionsColRef, newTransactionData); 
      return { transactionId: transactionDocRef.id, newBalance, userCurrency: userProfileData.currency || "USD" }; 
    });
    
    // Send email notification after transaction is committed
    const emailType = type === "credit" ? "CREDIT_NOTIFICATION" : "DEBIT_NOTIFICATION";
    await sendTransactionalEmail({
      userId: targetUserId,
      emailType,
      data: {
        accountNumber: userProfileData?.accountNumber,
        amount: amount, // original positive amount
        currency: transactionResult.userCurrency,
        description: description,
        transactionId: transactionResult.transactionId,
        currentBalance: transactionResult.newBalance,
        availableBalance: transactionResult.newBalance, // Assuming same for this context
        valueDate: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        location: "Platform Adjustment",
        remarks: description,
      },
    });

    revalidatePath("/admin/financial-ops");
    revalidatePath("/admin/transactions"); 
    revalidatePath("/admin/users"); 
    revalidatePath(`/dashboard/transactions`); 
    revalidatePath(`/dashboard`); 

    return {
      success: true,
      message: `Manual ${type} of ${transactionResult.userCurrency} ${amount.toFixed(2)} for user ${userProfileData?.displayName || targetUserId} processed. New balance: ${transactionResult.userCurrency} ${transactionResult.newBalance.toFixed(2)}.`,
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


const americanFirstNames = ["John", "Jane", "Michael", "Emily", "David", "Sarah", "Chris", "Jessica", "James", "Linda", "Robert", "Patricia"];
const americanLastNames = ["Smith", "Doe", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Garcia", "Rodriguez"];
const asianFirstNames = ["Kenji", "Sakura", "Wei", "Mei", "Hiroshi", "Yuki", "Jin", "Lien", "Raj", "Priya"];
const asianLastNames = ["Tanaka", "Kim", "Lee", "Chen", "Watanabe", "Park", "Nguyen", "Singh", "Gupta", "Khan"];
const europeanFirstNames = ["Hans", "Sophie", "Luca", "Isabelle", "Miguel", "Clara", "Pierre", "Anna", "Viktor", "Elena"];
const europeanLastNames = ["Müller", "Dubois", "Rossi", "García", "Silva", "Jansen", "Novak", "Ivanov", "Kowalski", "Andersson"];
const companySuffixes = ["Solutions", "Group", "Enterprises", "Corp", "Ltd.", "Inc.", "Global", "Tech", "Ventures", "Industries"];
const companyRegions = ["Global", "Atlantic", "Pacific", "Euro", "Asia", "Ameri", "International", "Continental"];
const transactionActions = ["Payment to", "Received from", "Invoice for", "Services by", "Consulting for", "Purchase from", "Refund from", "Subscription to", "Transfer to", "Credit from", "Market adjustment by"];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function getRandomName(): string {
    const regionChoice = Math.random();
    let firstNames, lastNames;
    if (regionChoice < 0.33) { // American
        firstNames = americanFirstNames;
        lastNames = americanLastNames;
    } else if (regionChoice < 0.66) { // Asian
        firstNames = asianFirstNames;
        lastNames = asianLastNames;
    } else { // European
        firstNames = europeanFirstNames;
        lastNames = europeanLastNames;
    }
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${randomFirstName} ${randomLastName}`;
};


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
    let currentBalance = userProfileData.balance; 
    const userCurrency = userProfileData.currency || "USD";

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
        
        const randomFactor = (Math.random() * 0.6) + 0.7; // Random factor between 0.7 and 1.3
        amount = parseFloat((idealAmountPerTx * randomFactor).toFixed(2));
        
        if (i === count - 1) { // Last transaction, adjust to hit target precisely
            amount = parseFloat((targetNetValue - totalAmountForCompleted).toFixed(2));
        }
        
        // Clamp amount to avoid extreme values but still allow for variety
        const maxReasonableTxAmount = targetNetValue === 0 ? 500 : (Math.abs(targetNetValue) / Math.max(1, count / 4)) * 1.5;
        const minReasonableTxAmount = targetNetValue === 0 ? -500 : (Math.abs(targetNetValue) / Math.max(1, count / 4)) * -1.5;
        amount = Math.max(minReasonableTxAmount, Math.min(maxReasonableTxAmount, amount));
        amount = parseFloat(amount.toFixed(2)); // Ensure two decimal places
        if (amount === 0 && targetNetValue !== 0 && count > 1 && i < count -1 ) { // Avoid zero transactions unless it's the target or last item
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
        counterpartName = getRandomName(); // Uses the new global getRandomName
      }
      
      const description = `${getRandomElement(transactionActions)} ${counterpartName}`;
      
      let status: TransactionType['status'];
      const statusRoll = Math.random() * 100;
      if (statusRoll < 95) { 
        status = "completed";
      } else if (statusRoll < 98) { 
        status = "pending";
      } else { 
        status = "failed";
      }

      const transactionData: Omit<TransactionType, "id" | "date"> & { date: Timestamp } = {
        userId: targetUserId, // Ensure this is set correctly
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

    const newBalance = parseFloat((currentBalance + totalAmountForCompleted).toFixed(2));
    batch.update(userDocRef, { balance: newBalance });

    await batch.commit();

    revalidatePath("/admin/transactions");
    revalidatePath("/admin/financial-ops");
    revalidatePath("/admin/users");
    revalidatePath(`/dashboard/transactions`); 
    revalidatePath(`/dashboard`); 

    return { 
      success: true, 
      message: `${count} random transactions generated for user ${userProfileData.displayName || targetUserId}. Balance updated by ${userCurrency} ${totalAmountForCompleted.toFixed(2)} (from completed transactions) to ${userCurrency} ${newBalance.toFixed(2)}.`, 
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
      reviewedBy: adminId || "system", 
      rejectionReason: "" 
    };
    const userProfileUpdate: Partial<UserProfile> = { kycStatus: "verified" };

    const batch = writeBatch(db);
    batch.update(kycDocRef, kycUpdate);
    batch.update(userDocRef, userProfileUpdate);
    await batch.commit();
    
    await sendTransactionalEmail({
      userId,
      emailType: "KYC_APPROVED", 
      data: { /* Add any specific data KYC_APPROVED template might need */ },
    });

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
      reviewedBy: adminId || "system", 
    };
    const userProfileUpdate: Partial<UserProfile> = { kycStatus: "rejected" };

    const batch = writeBatch(db);
    batch.update(kycDocRef, kycUpdate);
    batch.update(userDocRef, userProfileUpdate);
    await batch.commit();

    await sendTransactionalEmail({
      userId,
      emailType: "KYC_REJECTED", 
      data: { reason: rejectionReason },
    });

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
  amount: number 
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
      
      if (transactionData.amount !== amount) {
          console.warn(`Amount mismatch for transaction ${transactionId}. Passed: ${amount}, Stored: ${transactionData.amount}. Using stored amount for balance update.`);
      }

      const userProfileData = userDoc.data() as UserProfile;
      const currentBalance = userProfileData.balance;
      const newBalance = parseFloat((currentBalance + transactionData.amount).toFixed(2));

      firestoreTransaction.update(transactionDocRef, { status: "completed", updatedAt: Timestamp.now() });
      firestoreTransaction.update(userDocRef, { balance: newBalance });
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
    // 1. Create Firebase Auth user
    newAuthUser = await createUserWithEmailAndPassword(auth, email, password);
    const uid = newAuthUser.user.uid;

    // 2. Create Firestore user profile document
    const userDocRef = doc(db, "users", uid);
    const newAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const initialBalance = 0;
    const constructedDisplayName = `${firstName} ${lastName}`;

    const newUserProfileData: UserProfile = {
      uid,
      email,
      firstName,
      lastName,
      displayName: constructedDisplayName,
      photoURL: null,
      phoneNumber: phoneNumber || undefined,
      accountType: accountType || "default_user_type",
      currency: currency || "USD",
      kycStatus: "not_started",
      role: role || "user",
      balance: initialBalance,
      accountNumber: newAccountNumber,
      isFlagged: false,
      accountHealthScore: 75,
      profileCompletionPercentage: 50,
      isSuspended: false,
    };

    await setDoc(userDocRef, newUserProfileData);

    // 3. Send Welcome Email (optional, but good practice)
    await sendTransactionalEmail({
      userId: uid,
      emailType: "WELCOME_EMAIL",
      data: {
        loginLink: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002"}/login`, // Use env variable
        accountNumber: newAccountNumber,
        // email-service will fetch fullName and toEmail using userId
      },
    });
    
    revalidatePath("/admin/users");
    return { success: true, message: "User created successfully.", userId: uid };

  } catch (error: any) {
    console.error("Error in adminAddUserAction:", error);
    // If Firebase Auth user was created but Firestore profile failed, attempt to delete Auth user
    if (newAuthUser && newAuthUser.user && newAuthUser.user.delete) {
      try {
        await newAuthUser.user.delete();
        console.warn("AdminAddUserAction: Rolled back Firebase Auth user due to Firestore error.");
      } catch (deleteError) {
        console.error("AdminAddUserAction: CRITICAL - Failed to roll back Firebase Auth user:", deleteError);
      }
    }
    return { success: false, message: error.message || "Failed to create user.", error: error.message };
  }
}


    