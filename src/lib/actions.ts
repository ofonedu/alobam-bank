
// src/lib/actions.ts
"use server";

import { assessKYCRisk, type AssessKYCRiskInput, type AssessKYCRiskOutput } from "@/ai/flows/kyc-risk-assessment";
import { db } from "@/lib/firebase";
import { KYCFormSchema, type KYCFormData, type LocalTransferData, type InternationalTransferData, EditProfileSchema, type EditProfileFormData, LoanApplicationSchema, type LoanApplicationData, SubmitSupportTicketSchema, type SubmitSupportTicketData } from "@/lib/schemas";
import type { KYCData, UserProfile, Transaction as TransactionType, Loan, AdminSupportTicket } from "@/types";
import { doc, setDoc, updateDoc, getDoc, runTransaction, collection, addDoc, Timestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { fileToDataURI } from "./file-utils";
import { revalidatePath } from "next/cache";
import { sendTransactionalEmail, getUserEmail } from "./email-service";

export interface KYCSubmissionResult {
  success: boolean;
  message: string;
  kycData?: KYCData;
  error?: string | Record<string, string[]>; // Allow string for general errors or object for field errors
}

export async function submitKycAction(
  userId: string,
  formData: KYCFormData
): Promise<KYCSubmissionResult> {
  try {
    const validatedData = KYCFormSchema.safeParse(formData);
    if (!validatedData.success) {
      return {
        success: false,
        message: "Invalid form data.",
        error: validatedData.error.flatten().fieldErrors,
      };
    }

    const { fullName, dateOfBirth, address, governmentId, governmentIdPhoto } = validatedData.data;

    if (!governmentIdPhoto || governmentIdPhoto.length === 0) {
        return { success: false, message: "Government ID photo is missing." };
    }
    const photoFile = governmentIdPhoto[0] as File;

    const photoDataUri = await fileToDataURI(photoFile);

    const aiInput: AssessKYCRiskInput = {
      fullName,
      dateOfBirth,
      address,
      governmentId,
      photoDataUri,
    };

    let riskAssessment: AssessKYCRiskOutput["riskAssessment"] | undefined;
    try {
        const aiOutput = await assessKYCRisk(aiInput);
        riskAssessment = aiOutput.riskAssessment;
    } catch (aiError: any) {
        console.error("AI Risk Assessment Error:", aiError);
        riskAssessment = {
            riskLevel: "unknown",
            fraudScore: -1,
            identityVerified: false,
            flags: ["AI assessment failed: " + (aiError.message || "Unknown AI error")],
        };
    }
    
    const kycDocRef = doc(db, "kycData", userId);
    const userDocRef = doc(db, "users", userId);

    const newKycData: KYCData = {
      userId,
      fullName,
      dateOfBirth,
      address,
      governmentId,
      photoUrl: "placeholder_for_actual_storage_url", 
      photoFileName: photoFile.name,
      status: riskAssessment?.identityVerified ? "pending_review" : "rejected",
      submittedAt: new Date(),
      riskAssessment,
    };
    
    if (riskAssessment?.riskLevel === 'high' || !riskAssessment?.identityVerified) {
        newKycData.status = 'rejected';
    } else if (riskAssessment?.identityVerified && (riskAssessment?.riskLevel === 'low' || riskAssessment?.riskLevel === 'medium')) {
        newKycData.status = 'pending_review';
    }

    await setDoc(kycDocRef, newKycData, { merge: true });

    const userProfileUpdate: Partial<UserProfile> = {
      kycStatus: newKycData.status,
    };
    await updateDoc(userDocRef, userProfileUpdate);
    
    revalidatePath("/dashboard/kyc");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "KYC information submitted successfully. Awaiting review.",
      kycData: newKycData,
    };

  } catch (error: any) {
    console.error("Error submitting KYC:", error);
    return {
      success: false,
      message: "An unexpected error occurred during KYC submission.",
      error: error.message,
    };
  }
}


export async function fetchKycData(userId: string): Promise<KYCData | null> {
  if (!userId) return null;
  const kycDocRef = doc(db, "kycData", userId);
  const kycDocSnap = await getDoc(kycDocRef);
  if (kycDocSnap.exists()) {
    const data = kycDocSnap.data();
    // Convert Firestore Timestamps to Dates
    if (data.submittedAt && typeof data.submittedAt.toDate === 'function') {
      data.submittedAt = data.submittedAt.toDate();
    }
    if (data.reviewedAt && typeof data.reviewedAt.toDate === 'function') {
      data.reviewedAt = data.reviewedAt.toDate();
    }
    return data as KYCData;
  }
  return null;
}

interface RecordTransferResult {
  success: boolean;
  message: string;
  newBalance?: number;
  transactionId?: string;
  error?: string;
}

interface AuthorizationDetails {
  cotCode?: string;
  imfCode?: string;
  taxCode?: string;
}

export async function recordTransferAction(
  userId: string,
  transferData: LocalTransferData | InternationalTransferData,
  authorizations: AuthorizationDetails
): Promise<RecordTransferResult> {
  try {
    const MOCK_COT_PERCENTAGE = 0.01; // 1%
    const cotAmount = transferData.amount * MOCK_COT_PERCENTAGE;
    const totalDeduction = transferData.amount + cotAmount;

    let userEmail: string | null = null;

    const transactionResult = await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("User profile not found.");
      }
      const userProfileData = userDoc.data() as UserProfile;
      userEmail = userProfileData.email; 

      const currentBalance = userProfileData.balance;
      if (currentBalance < totalDeduction) {
        throw new Error("Insufficient funds to complete the transfer including fees.");
      }

      const updatedBalance = currentBalance - totalDeduction;
      transaction.update(userDocRef, { balance: updatedBalance });

      const transactionsColRef = collection(db, "transactions");
      const newTransactionData: Omit<TransactionType, "id" | "date"> & { date: Timestamp } = {
        userId,
        date: Timestamp.now(),
        description: `Transfer to ${transferData.recipientName}`,
        amount: -transferData.amount, 
        type: "transfer",
        status: "completed",
        currency: 'currency' in transferData ? transferData.currency : "USD", 
        recipientDetails: {
          name: transferData.recipientName,
          accountNumber: 'recipientAccountNumber' in transferData ? transferData.recipientAccountNumber : transferData.recipientAccountNumberIBAN,
          bankName: transferData.bankName,
          swiftBic: 'swiftBic' in transferData ? transferData.swiftBic : undefined,
          country: 'country' in transferData ? transferData.country : undefined,
        },
        authorizationDetails: { // Store the provided codes
          cot: parseFloat(cotAmount.toFixed(2)),
          cotCode: authorizations.cotCode,
          imfCode: authorizations.imfCode,
          taxCode: authorizations.taxCode,
          imfCodeProvided: !!authorizations.imfCode, // Keep this for backward compatibility if needed, or remove
        },
      };
      const transactionDocRef = await addDoc(transactionsColRef, newTransactionData);
      
      return { balance: updatedBalance, transactionId: transactionDocRef.id };
    });

    if (userEmail && transactionResult.transactionId) {
      await sendTransactionalEmail({
        recipientEmail: userEmail,
        emailType: "TRANSFER_SUCCESS",
        data: {
          amount: transferData.amount.toFixed(2),
          currency: 'currency' in transferData ? transferData.currency : "USD",
          recipientName: transferData.recipientName,
          transactionId: transactionResult.transactionId,
          newBalance: transactionResult.balance.toFixed(2),
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath(`/dashboard/profile`); 

    return {
      success: true,
      message: "Transfer processed successfully.",
      newBalance: transactionResult.balance,
      transactionId: transactionResult.transactionId,
    };

  } catch (error: any) {
    console.error("Error recording transfer:", error);
    const userEmailForFailure = await getUserEmail(userId, db);
    if (userEmailForFailure) {
      await sendTransactionalEmail({
        recipientEmail: userEmailForFailure,
        emailType: "TRANSFER_FAILED",
        data: {
          amount: transferData.amount.toFixed(2),
          currency: 'currency' in transferData ? transferData.currency : "USD",
          recipientName: transferData.recipientName,
          reason: error.message || "Unknown error",
        },
      });
    }
    return {
      success: false,
      message: error.message || "An unexpected error occurred during transfer processing.",
      error: error.message,
    };
  }
}


export async function fetchUserTransactionsAction(userId: string, count?: number): Promise<{ success: boolean; transactions?: TransactionType[]; error?: string }> {
  if (!userId) {
    return { success: false, error: "User ID is required." };
  }
  try {
    const transactionsColRef = collection(db, "transactions");
    let q;
    if (count && count > 0) {
      q = query(
        transactionsColRef,
        where("userId", "==", userId),
        orderBy("date", "desc"),
        limit(count)
      );
    } else {
      q = query(
        transactionsColRef,
        where("userId", "==", userId),
        orderBy("date", "desc")
      );
    }
    
    const querySnapshot = await getDocs(q);
    const transactions: TransactionType[] = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      let transactionDate = new Date(); 
      if (data.date && typeof (data.date as Timestamp).toDate === 'function') {
        transactionDate = (data.date as Timestamp).toDate();
      } else if (data.date) {
        try {
          const parsedDate = new Date(data.date);
          if (!isNaN(parsedDate.getTime())) {
            transactionDate = parsedDate;
          } else {
            console.warn(`Transaction document ${docSnap.id} has an invalid date format:`, data.date);
          }
        } catch (e) {
          console.warn(`Transaction document ${docSnap.id} has an unparsable date:`, data.date, e);
        }
      } else {
         console.warn(`Transaction document ${docSnap.id} is missing the 'date' field.`);
      }

      return {
        ...data,
        id: docSnap.id,
        date: transactionDate,
      } as TransactionType;
    });
    return { success: true, transactions };
  } catch (error: any) {
    console.error("Error fetching user transactions (fetchUserTransactionsAction):", error.message, error.stack);
    return { success: false, error: `Failed to fetch transactions. Server error: ${error.message}` };
  }
}

interface UpdateUserProfileResult {
  success: boolean;
  message: string;
  error?: string | Record<string, string[]>;
}

export async function updateUserProfileInformationAction(
  userId: string,
  data: EditProfileFormData
): Promise<UpdateUserProfileResult> {
  if (!userId) {
    return { success: false, message: "User ID is required." };
  }

  const validatedData = EditProfileSchema.safeParse(data);
  if (!validatedData.success) {
    return {
      success: false,
      message: "Invalid form data.",
      error: validatedData.error.flatten().fieldErrors,
    };
  }

  const { firstName, lastName, phoneNumber } = validatedData.data;

  try {
    const userDocRef = doc(db, "users", userId);
    const updateData: Partial<UserProfile> = {
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: phoneNumber || undefined, 
    };

    await updateDoc(userDocRef, updateData);
    revalidatePath("/dashboard/profile");

    return {
      success: true,
      message: "Profile updated successfully.",
    };
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      message: "Failed to update profile.",
      error: error.message,
    };
  }
}

interface SubmitLoanApplicationResult {
  success: boolean;
  message: string;
  loanId?: string;
  error?: string | Record<string, string[]>;
}

export async function submitLoanApplicationAction(
  userId: string,
  loanData: LoanApplicationData
): Promise<SubmitLoanApplicationResult> {
  if (!userId) {
    return { success: false, message: "User ID is required." };
  }

  const validatedData = LoanApplicationSchema.safeParse(loanData);
  if (!validatedData.success) {
    return {
      success: false,
      message: "Invalid loan application data.",
      error: validatedData.error.flatten().fieldErrors,
    };
  }

  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return { success: false, message: "User profile not found." };
    }
    const userProfile = userDocSnap.data() as UserProfile;
    const applicantName = userProfile.displayName || userProfile.email || "Unknown Applicant";

    const loansColRef = collection(db, "loans");
    const newLoanDocData: Omit<Loan, "id" | "applicationDate"> & { applicationDate: Timestamp } = {
      userId,
      applicantName,
      amount: validatedData.data.amount,
      termMonths: validatedData.data.termMonths,
      purpose: validatedData.data.purpose,
      interestRate: 0.08, 
      status: "pending",
      applicationDate: Timestamp.now(),
    };

    const loanDocRef = await addDoc(loansColRef, newLoanDocData);

    revalidatePath("/dashboard/loans");
    revalidatePath("/admin/loans");

    return {
      success: true,
      message: "Loan application submitted successfully.",
      loanId: loanDocRef.id,
    };
  } catch (error: any) {
    console.error("Error submitting loan application:", error);
    return {
      success: false,
      message: "Failed to submit loan application.",
      error: error.message,
    };
  }
}

interface SubmitSupportTicketResult {
  success: boolean;
  message: string;
  ticketId?: string;
  error?: string | Record<string, string[]>;
}

export async function submitSupportTicketAction(
  userId: string,
  ticketData: SubmitSupportTicketData
): Promise<SubmitSupportTicketResult> {
  if (!userId) {
    return { success: false, message: "User ID is required to submit a ticket." };
  }

  const validatedData = SubmitSupportTicketSchema.safeParse(ticketData);
  if (!validatedData.success) {
    return {
      success: false,
      message: "Invalid support ticket data.",
      error: validatedData.error.flatten().fieldErrors,
    };
  }

  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return { success: false, message: "User profile not found." };
    }
    const userProfile = userDocSnap.data() as UserProfile;

    const supportTicketsColRef = collection(db, "supportTickets");
    const newTicketData: Omit<AdminSupportTicket, "id" | "createdAt" | "updatedAt"> & { createdAt: Timestamp; updatedAt: Timestamp } = {
      userId,
      userName: userProfile.displayName || "N/A",
      userEmail: userProfile.email || "N/A",
      subject: validatedData.data.subject,
      message: validatedData.data.message,
      status: "open",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const ticketDocRef = await addDoc(supportTicketsColRef, newTicketData);

    revalidatePath("/admin/support"); 

    return {
      success: true,
      message: "Support ticket submitted successfully. We'll get back to you soon.",
      ticketId: ticketDocRef.id,
    };
  } catch (error: any) {
    console.error("Error submitting support ticket:", error);
    return {
      success: false,
      message: "Failed to submit support ticket.",
      error: error.message,
    };
  }
}

    