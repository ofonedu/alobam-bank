
// src/lib/actions.ts
"use server";

import { db, storage } from "@/lib/firebase";
import { KYCFormSchema, type KYCFormData, type LocalTransferData, type InternationalTransferData, EditProfileSchema, type EditProfileFormData, LoanApplicationSchema, type LoanApplicationData, SubmitSupportTicketSchema, type SubmitSupportTicketData } from "@/lib/schemas";
import type { KYCData, UserProfile, Transaction as TransactionType, Loan, AdminSupportTicket, AuthorizationDetails, PlatformSettings } from "@/types";
import { doc, setDoc, updateDoc, getDoc, runTransaction, collection, addDoc, Timestamp, query, where, orderBy, limit, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { revalidatePath } from "next/cache";
import { sendTransactionalEmail } from "./email-service";
import { validateAuthorizationCode, markCodeAsUsed } from "./actions/admin-code-actions"; 
import { getPlatformSettingsAction } from "./actions/admin-settings-actions"; 

export interface KYCSubmissionResult {
  success: boolean;
  message: string;
  kycData?: KYCData;
  error?: string | Record<string, string[]>; 
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
    let uploadedPhotoUrl = "";
    let photoFileName = photoFile.name;

    try {
      console.log(`submitKycAction: Attempting to upload KYC photo for user ${userId}, filename: ${photoFile.name}, size: ${photoFile.size}, type: ${photoFile.type}`);
      const filePath = `kycDocuments/${userId}/${Date.now()}_${photoFile.name}`;
      const storageRef = ref(storage, filePath);
      
      console.log(`submitKycAction: Storage reference created: ${storageRef.toString()}`);
      const snapshot = await uploadBytes(storageRef, photoFile);
      uploadedPhotoUrl = await getDownloadURL(snapshot.ref);
      console.log(`submitKycAction: KYC photo uploaded successfully for user ${userId}. URL: ${uploadedPhotoUrl}`);

    } catch (uploadError: any) {
      console.error(`submitKycAction: Critical error uploading KYC photo to Firebase Storage for user ${userId}:`);
      console.error("Detailed Firebase Storage Upload Error Code:", uploadError.code);
      console.error("Detailed Firebase Storage Upload Error Message:", uploadError.message);
      console.error("Detailed Firebase Storage Upload Error Name:", uploadError.name);
      console.error("Full Firebase Storage Upload Error Object:", JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError)));
      return {
        success: false,
        message: "Failed to upload ID photo. Please check server logs for details and try again.",
        error: `Storage Upload Error: ${uploadError.code || 'Unknown'} - ${uploadError.message || 'No specific message.'}`,
      };
    }
    
    const kycDocRef = doc(db, "kycData", userId);
    const userDocRef = doc(db, "users", userId);

    const newKycData: Omit<KYCData, 'userId' | 'status'> & {userId: string, status: "not_started" | "pending_review" | "verified" | "rejected" } = {
      userId,
      fullName,
      dateOfBirth,
      address,
      governmentId,
      photoUrl: uploadedPhotoUrl, 
      photoFileName: photoFileName,
      status: "pending_review", 
      submittedAt: Timestamp.now(),
    };
    
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
      kycData: newKycData as KYCData,
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
    const kycResult: Partial<KYCData> = {};
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            (kycResult as any)[key] = (data[key] as Timestamp).toDate();
        } else {
            (kycResult as any)[key] = data[key];
        }
    }
    return kycResult as KYCData;
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


export async function recordTransferAction(
  userId: string,
  transferData: LocalTransferData | InternationalTransferData,
  authorizations: Partial<AuthorizationDetails>, 
  platformCotPercentage?: number 
): Promise<RecordTransferResult> {
  if (!userId) {
    return { success: false, message: "User ID is required for transfer." };
  }
  
  const userDocSnap = await getDoc(doc(db, "users", userId));
  if (!userDocSnap.exists()) {
    return { success: false, message: "User profile not found." };
  }
  const userProfile = userDocSnap.data() as UserProfile;

  if (userProfile.kycStatus !== 'verified') {
    return { success: false, message: "KYC verification required to perform transfers." };
  }
  
  try {
    const settingsResult = await getPlatformSettingsAction();
    const cotPercentageToUse = platformCotPercentage ?? settingsResult.settings?.cotPercentage ?? 0.01;

    const cotAmount = transferData.amount * cotPercentageToUse;
    const totalDeduction = transferData.amount + cotAmount;

    let cotCodeId: string | undefined;
    let imfCodeId: string | undefined;
    let taxCodeId: string | undefined;

    if (settingsResult.settings?.requireCOTConfirmation && authorizations.cotCode) {
        const validation = await validateAuthorizationCode(authorizations.cotCode, 'COT', userId);
        if (!validation.valid || !validation.codeId) {
            return { success: false, message: validation.message || "Invalid or missing COT code." };
        }
        cotCodeId = validation.codeId;
    }
    if (settingsResult.settings?.requireIMFAuthorization && authorizations.imfCode) {
        const validation = await validateAuthorizationCode(authorizations.imfCode, 'IMF', userId);
        if (!validation.valid || !validation.codeId) {
            return { success: false, message: validation.message || "Invalid or missing IMF code." };
        }
        imfCodeId = validation.codeId;
    }
    if (settingsResult.settings?.requireTaxClearance && authorizations.taxCode) {
        const validation = await validateAuthorizationCode(authorizations.taxCode, 'TAX', userId);
        if (!validation.valid || !validation.codeId) {
            return { success: false, message: validation.message || "Invalid or missing Tax code." };
        }
        taxCodeId = validation.codeId;
    }

    const transactionResult = await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, "users", userId);
      // User doc already fetched, re-get inside transaction for atomicity
      const freshUserDoc = await transaction.get(userDocRef); 
      if (!freshUserDoc.exists()) {
        throw new Error("User profile not found within transaction.");
      }
      const userProfileData = freshUserDoc.data() as UserProfile;

      const currentBalance = userProfileData.balance;
      if (currentBalance < totalDeduction) {
        throw new Error("Insufficient funds to complete the transfer including fees.");
      }

      const updatedBalance = currentBalance - totalDeduction;
      transaction.update(userDocRef, { balance: updatedBalance });

      const recipientDetails: Partial<TransactionType['recipientDetails']> = {};
      if (transferData.recipientName) recipientDetails.name = transferData.recipientName;
      if ('recipientAccountNumber' in transferData && transferData.recipientAccountNumber) {
        recipientDetails.accountNumber = transferData.recipientAccountNumber;
      } else if ('recipientAccountNumberIBAN' in transferData && transferData.recipientAccountNumberIBAN) {
        recipientDetails.accountNumber = transferData.recipientAccountNumberIBAN;
      }
      if (transferData.bankName) recipientDetails.bankName = transferData.bankName;
      if ('swiftBic' in transferData && transferData.swiftBic && transferData.swiftBic.trim() !== "") {
        recipientDetails.swiftBic = transferData.swiftBic;
      }
      if ('country' in transferData && transferData.country && transferData.country.trim() !== "") {
        recipientDetails.country = transferData.country;
      }
      
      const authDetailsToSave: AuthorizationDetails = { 
        cot: parseFloat(cotAmount.toFixed(2)),
      };
      if (authorizations.cotCode) authDetailsToSave.cotCode = authorizations.cotCode;
      if (authorizations.imfCode) authDetailsToSave.imfCode = authorizations.imfCode;
      if (authorizations.taxCode) authDetailsToSave.taxCode = authorizations.taxCode;

      const transactionsColRef = collection(db, "transactions");
      const newTransactionData: Omit<TransactionType, "id" | "date"> & { date: Timestamp } = {
        userId,
        date: Timestamp.now(),
        description: `Transfer to ${transferData.recipientName}`,
        amount: -transferData.amount, 
        type: "transfer",
        status: "completed",
        currency: 'currency' in transferData ? transferData.currency : "USD", 
        ...(Object.keys(recipientDetails).length > 0 && { recipientDetails: recipientDetails as TransactionType['recipientDetails'] }),
        ...(Object.keys(authDetailsToSave).length > 1 && { authorizationDetails: authDetailsToSave }),
      };
      const transactionDocRef = doc(collection(db, "transactions")); // Generate ref before setting
      transaction.set(transactionDocRef, newTransactionData); // Use transaction.set

      // Mark codes as used within the same Firestore transaction
      if (cotCodeId) await markCodeAsUsed(cotCodeId, transaction);
      if (imfCodeId) await markCodeAsUsed(imfCodeId, transaction);
      if (taxCodeId) await markCodeAsUsed(taxCodeId, transaction);
      
      return { balance: updatedBalance, transactionId: transactionDocRef.id };
    });

    // Send email after successful transaction
    if (userProfile.email && transactionResult.transactionId) {
      await sendTransactionalEmail({
        userId: userId, // Pass userId so email service can fetch details if needed
        emailType: "TRANSFER_SUCCESS",
        data: {
          toEmail: userProfile.email,
          fullName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
          accountNumber: userProfile.accountNumber,
          amount: transferData.amount,
          currency: 'currency' in transferData ? transferData.currency : "USD",
          recipientName: transferData.recipientName,
          transactionId: transactionResult.transactionId,
          currentBalance: transactionResult.balance,
          availableBalance: transactionResult.balance,
          valueDate: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          remarks: transferData.remarks || `Transfer to ${transferData.recipientName}`,
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
    const userEmailForFailure = userProfile?.email;
    if (userEmailForFailure) {
      await sendTransactionalEmail({
        userId: userId, // Pass userId
        emailType: "TRANSFER_FAILED",
        data: {
          toEmail: userEmailForFailure,
          fullName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
          accountNumber: userProfile.accountNumber,
          amount: transferData.amount,
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
    const queryConstraints = [
        where("userId", "==", userId),
        orderBy("date", "desc")
    ];

    if (count && count > 0) {
      queryConstraints.push(limit(count));
    }
    
    q = query(transactionsColRef, ...queryConstraints);
    
    const querySnapshot = await getDocs(q);
    const transactions: TransactionType[] = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      let transactionDate = new Date(); 
      if (data.date && typeof (data.date as Timestamp).toDate === 'function') {
        transactionDate = (data.date as Timestamp).toDate();
      } else if (data.date instanceof Date) { // If it's already a JS Date
        transactionDate = data.date;
      } else if (data.date) { // Fallback for string/number representation
        try {
          const parsedDate = new Date(data.date as string | number);
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
        id: docSnap.id, // Ensure id is always populated
        ...data,
        date: transactionDate, // Ensure date is a JS Date object
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
      phoneNumber: phoneNumber || undefined, // Store as undefined if empty, not ""
    };
    
    // Remove undefined fields to avoid Firestore errors
    Object.keys(updateData).forEach(key => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]);


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
  const userDocSnap = await getDoc(doc(db, "users", userId));
  if (!userDocSnap.exists()) {
      return { success: false, message: "User profile not found." };
  }
  const userProfile = userDocSnap.data() as UserProfile;

  if (userProfile.kycStatus !== 'verified') {
      return { success: false, message: "KYC verification required to apply for a loan." };
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
    const applicantName = userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`.trim() || "Unknown Applicant";

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
      currency: userProfile.currency || "USD", // Add currency
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
      priority: "medium", // Default priority
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

    