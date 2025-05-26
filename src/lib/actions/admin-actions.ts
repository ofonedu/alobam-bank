
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
      updateData.approvalDate = new Date(); // Store as JS Date, Firestore will convert to Timestamp
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
    const transactionType = type === "credit" ? "credit" : "debit"; // Changed from manual_credit/manual_debit

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
        description: description, // Use admin-provided description directly
        amount: adjustmentAmount,
        type: transactionType,
        status: "completed",
        currency: userCurrency, 
        notes: `Manual adjustment by admin: ${adminUserId || 'System'}. User: ${userName || targetUserId}. Original input description: ${description}`
      };
      const transactionDocRef = await addDoc(transactionsColRef, newTransactionData); 
      return { transactionId: transactionDocRef.id, newBalance }; 
    });
    
    if (type === "debit" && userEmail) {
      await sendTransactionalEmail({
        recipientEmail: userEmail,
        emailType: "MANUAL_DEBIT_NOTIFICATION",
        data: {
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


interface GenerateRandomTransactionsResult {
  success: boolean;
  message: string;
  count?: number;
  error?: string;
}

export async function generateRandomTransactionsAction(
  targetUserId: string,
  count: number
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

    const descriptions = ["Online Purchase", "Service Fee", "Subscription", "Refund Recieved", "Cash Deposit", "Utility Bill", "Salary Payment", "Loan Interest", "Investment Dividend", "Miscellaneous Credit", "Miscellaneous Debit"];
    const types: TransactionType['type'][] = ["withdrawal", "fee", "deposit", "credit", "debit", "transfer"]; // Updated types
    const statuses: TransactionType['status'][] = ["completed", "pending", "failed"];

    let totalAmountGenerated = 0;

    for (let i = 0; i < count; i++) {
      const randomType = types[Math.floor(Math.random() * types.length)];
      let randomAmount = Math.random() * 500 + 5; 
      
      if (["withdrawal", "fee", "debit"].includes(randomType) || (randomType === "transfer" && Math.random() < 0.5)) { // Updated types
        randomAmount = -Math.abs(randomAmount);
      } else {
        randomAmount = Math.abs(randomAmount);
      }
      
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 90)); 

      const transactionData: Omit<TransactionType, "id" | "date"> & { date: Timestamp } = {
        userId: targetUserId,
        date: Timestamp.fromDate(randomDate),
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        amount: parseFloat(randomAmount.toFixed(2)),
        type: randomType,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        currency: userCurrency,
        isFlagged: Math.random() < 0.05, 
      };
      const newTransactionRef = doc(transactionsColRef); 
      batch.set(newTransactionRef, transactionData);

      if (transactionData.status === 'completed') {
        totalAmountGenerated += transactionData.amount;
      }
    }

    const newBalance = parseFloat((currentBalance + totalAmountGenerated).toFixed(2));
    batch.update(userDocRef, { balance: newBalance });

    await batch.commit();

    revalidatePath("/admin/transactions");
    revalidatePath("/admin/financial-ops");
    revalidatePath("/admin/users");
    revalidatePath(`/dashboard/transactions`); 
    revalidatePath(`/dashboard`); 

    return { 
      success: true, 
      message: `${count} random transactions generated for user ${targetUserId}. Balance updated by ${userCurrency} ${totalAmountGenerated.toFixed(2)} to ${userCurrency} ${newBalance.toFixed(2)}.`, 
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
      reviewedAt: new Date(), // Store as JS Date
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
      reviewedAt: new Date(), // Store as JS Date
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
