
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
import { sendTransactionalEmail, getUserEmail } from "../email-service";

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

    const recipientEmail = await getUserEmail(userId, db);
    if (recipientEmail) {
      const loanDocSnap = await getDoc(loanDocRef);
      const loanData = loanDocSnap.data() as Loan | undefined;

      if (newStatus === "approved") {
        await sendTransactionalEmail({
          recipientEmail,
          emailType: "LOAN_APPROVED",
          data: {
            loanId,
            loanAmount: loanData?.amount,
            approvalDate: updateData.approvalDate ? updateData.approvalDate.toLocaleDateString() : "N/A",
          },
        });
      } else if (newStatus === "rejected") {
         await sendTransactionalEmail({
          recipientEmail,
          emailType: "LOAN_REJECTED",
          data: {
            loanId,
            loanAmount: loanData?.amount,
          },
        });
      }
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

  let userEmail: string | null = null;
  let userName: string | null = null;
  let userCurrency: string = "USD"; 

  try {
    const adjustmentAmount = type === "credit" ? amount : -amount;
    const transactionType = type === "credit" ? "credit" : "debit"; 

    const transactionResult = await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, "users", targetUserId);
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("Target user profile not found.");
      }
      
      const userProfileData = userDoc.data() as UserProfile;
      userEmail = userProfileData.email; 
      userName = userProfileData.displayName || null;
      userCurrency = userProfileData.currency || "USD"; 


      const currentBalance = userProfileData.balance;
      const newBalance = currentBalance + adjustmentAmount;

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
        type: transactionType,
        status: "completed",
        currency: userCurrency, 
        notes: `Manual adjustment by admin: ${adminUserId || 'System Action'}. User: ${userName || targetUserId}. Original input reason: ${description}`
      };
      const transactionDocRef = await addDoc(transactionsColRef, newTransactionData); 
      return { transactionId: transactionDocRef.id, newBalance }; 
    });
    
    if (type === "debit" && userEmail) {
      await sendTransactionalEmail({
        recipientEmail: userEmail,
        emailType: "MANUAL_DEBIT_NOTIFICATION",
        data: {
          userName: userName || 'Valued Customer',
          amount: amount.toFixed(2),
          currency: userCurrency,
          description,
          transactionId: transactionResult.transactionId,
          newBalance: transactionResult.newBalance.toFixed(2),
        },
      });
    }
     if (type === "credit" && userEmail) {
      await sendTransactionalEmail({
        recipientEmail: userEmail,
        emailType: "MANUAL_CREDIT_NOTIFICATION",
        data: {
          userName: userName || 'Valued Customer',
          amount: amount.toFixed(2),
          currency: userCurrency,
          description,
          transactionId: transactionResult.transactionId,
          newBalance: transactionResult.newBalance.toFixed(2),
        },
      });
    }

    revalidatePath("/admin/financial-ops");
    revalidatePath("/admin/transactions"); 
    revalidatePath("/admin/users"); 
    revalidatePath(`/dashboard/transactions`); 
    revalidatePath(`/dashboard`); 

    return {
      success: true,
      message: `Manual ${type} of ${userCurrency} ${amount.toFixed(2)} for user ${userName || targetUserId} processed. New balance: ${userCurrency} ${transactionResult.newBalance.toFixed(2)}.`,
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

// Helper function for random selection from an array
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Sample names and company details
const americanFirstNames = ["John", "Jane", "Michael", "Emily", "David", "Sarah", "Chris", "Jessica"];
const americanLastNames = ["Smith", "Doe", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson"];
const asianFirstNames = ["Kenji", "Sakura", "Wei", "Mei", "Hiroshi", "Yuki", "Jin", "Lien"];
const asianLastNames = ["Tanaka", "Kim", "Lee", "Chen", "Watanabe", "Park", "Nguyen", "Singh"];
const europeanFirstNames = ["Hans", "Sophie", "Luca", "Isabelle", "Miguel", "Clara", "Pierre", "Anna"];
const europeanLastNames = ["Müller", "Dubois", "Rossi", "García", "Silva", "Jansen", "Novak", "Ivanov"];
const companySuffixes = ["Solutions", "Group", "Enterprises", "Corp", "Ltd.", "Inc.", "Global", "Tech"];
const companyRegions = ["Global", "Atlantic", "Pacific", "Euro", "Asia", "Ameri"];
const transactionActions = ["Payment to", "Received from", "Invoice for", "Services by", "Consulting for", "Purchase from", "Refund from", "Subscription to"];


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

      let amount;
      let type: TransactionType['type'];

      if (targetNetValue !== undefined) {
        const remainingTransactions = count - i;
        // Calculate the average amount needed per remaining transaction to reach the targetNetValue
        // This needs to consider only future *completed* transactions.
        // For simplicity in generation, we'll still aim for the overall target and let status sort it out.
        const idealAmountPerTx = remainingTransactions > 0 ? (targetNetValue - totalAmountForCompleted) / remainingTransactions : 0;
        
        const randomFactor = (Math.random() - 0.5) * 0.6 + 1; // e.g., 0.7 to 1.3
        amount = parseFloat((idealAmountPerTx * randomFactor).toFixed(2));
        
        if (i === count - 1 && remainingTransactions === 1) { // Last transaction
            amount = parseFloat((targetNetValue - totalAmountForCompleted).toFixed(2));
        }
        
        // Clamp amount to avoid extreme values relative to targetNetValue, or use a fixed cap if target is 0
        const maxIndividualTxAmount = targetNetValue !== 0 ? Math.abs(targetNetValue) / Math.max(1, count / 5) : 500; // Heuristic
        amount = Math.max(-maxIndividualTxAmount, Math.min(maxIndividualTxAmount, amount));
        amount = parseFloat(amount.toFixed(2));


      } else {
        amount = (Math.random() * 495 + 5) * (Math.random() < 0.55 ? 1 : -1); // Roughly 55% chance of credit
        amount = parseFloat(amount.toFixed(2));
      }


      if (amount > 0) {
        type = getRandomElement(["deposit", "credit"]);
      } else {
        type = getRandomElement(["withdrawal", "fee", "debit", "transfer"]);
      }

      // Generate counterpart name/company
      let counterpartName = "";
      const isCompany = Math.random() < 0.4; // 40% chance of company
      const regionChoice = getRandomElement(["American", "Asian", "European"]);

      if (isCompany) {
        counterpartName = `${getRandomElement(companyRegions)} ${getRandomElement(companySuffixes)}`;
      } else {
        let fName, lName;
        if (regionChoice === "American") { fName = getRandomElement(americanFirstNames); lName = getRandomElement(americanLastNames); }
        else if (regionChoice === "Asian") { fName = getRandomElement(asianFirstNames); lName = getRandomElement(asianLastNames); }
        else { fName = getRandomElement(europeanFirstNames); lName = getRandomElement(europeanLastNames); }
        counterpartName = `${fName} ${lName}`;
      }
      
      const description = `${getRandomElement(transactionActions)} ${counterpartName}`;
      
      let status: TransactionType['status'];
      const statusRoll = Math.random() * 100;
      if (statusRoll < 95) { // 95% completed
        status = "completed";
      } else if (statusRoll < 98) { // 3% pending (95 to 98)
        status = "pending";
      } else { // 2% failed (98 to 100)
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

      if (status === 'completed') { // Only add to balance if completed
        totalAmountForCompleted += amount;
      }
    }
    
    // Add transactions to batch
    generatedTransactions.forEach(txData => {
        const newTransactionRef = doc(transactionsColRef); 
        batch.set(newTransactionRef, txData);
    });

    // The balance update should reflect the sum of *completed* transactions
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
    
    const recipientEmail = await getUserEmail(userId, db);
    if (recipientEmail) {
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data() as UserProfile | undefined;
      await sendTransactionalEmail({
        recipientEmail,
        emailType: "KYC_APPROVED", 
        data: { userName: userData?.displayName || 'User' },
      });
    }

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

    const recipientEmail = await getUserEmail(userId, db);
    if (recipientEmail) {
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data() as UserProfile | undefined;
      await sendTransactionalEmail({
        recipientEmail,
        emailType: "KYC_REJECTED", 
        data: { userName: userData?.displayName || 'User', rejectionReason },
      });
    }

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
  amount: number // The amount of the transaction being marked as completed
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
      // Ensure the amount passed matches the transaction amount for safety
      if (transactionData.amount !== amount) {
          console.warn(`Amount mismatch for transaction ${transactionId}. Passed: ${amount}, Stored: ${transactionData.amount}. Using stored amount for balance update.`);
      }


      const userProfileData = userDoc.data() as UserProfile;
      const currentBalance = userProfileData.balance;
      const newBalance = currentBalance + transactionData.amount; // Use the stored amount

      firestoreTransaction.update(transactionDocRef, { status: "completed", updatedAt: Timestamp.now() });
      firestoreTransaction.update(userDocRef, { balance: newBalance });
    });

    revalidatePath("/admin/transactions");
    revalidatePath("/admin/users"); // User balance might be displayed here
    revalidatePath(`/dashboard/transactions`); 
    revalidatePath(`/dashboard`); // User balance is displayed here

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

