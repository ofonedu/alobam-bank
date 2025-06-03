// src/lib/actions.ts
"use server";

import { auth, db, storage } from "@/lib/firebase";
import { KYCFormSchema, type KYCFormData, type LocalTransferData, type InternationalTransferData, EditProfileSchema, type EditProfileFormData, LoanApplicationSchema, type LoanApplicationData, SubmitSupportTicketSchema, type SubmitSupportTicketData, ForgotPasswordSchema } from "@/lib/schemas";
import type { KYCData, UserProfile, Transaction as TransactionType, Loan, AdminSupportTicket, AuthorizationDetails, ClientKYCData, KYCSubmissionResult } from "@/types";
import { doc, setDoc, updateDoc, getDoc, runTransaction, collection, addDoc, Timestamp, query, where, orderBy, limit, getDocs, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { revalidatePath } from "next/cache";
import { validateAuthorizationCode, markCodeAsUsed } from "./actions/admin-code-actions";
import { getPlatformSettingsAction } from "./actions/admin-settings-actions";
import { sendPasswordResetEmail } from "firebase/auth";
import { sendTransactionalEmail, getEmailTemplateAndSubject } from "./email-service";
import { formatCurrency } from "./utils";

export async function submitKycAction(
  userId: string,
  formData: KYCFormData
): Promise<KYCSubmissionResult> {
  if (!userId) {
    return { success: false, message: "User ID is required for KYC submission." };
  }
  try {
    const validatedData = KYCFormSchema.safeParse(formData);
    if (!validatedData.success) {
      return {
        success: false,
        message: "Invalid form data. Please check your inputs.",
        error: validatedData.error.flatten().fieldErrors,
      };
    }

    const { fullName, dateOfBirth, address, governmentId, governmentIdPhoto } = validatedData.data;

    let uploadedPhotoUrl = "";
    let photoFileName = "";

    if (governmentIdPhoto && governmentIdPhoto[0]) {
      const photoFile = governmentIdPhoto[0] as File;
      photoFileName = photoFile.name;

      try {
        console.log(`submitKycAction: Attempting to upload KYC photo for user ${userId}, filename: ${photoFile.name}, size: ${photoFile.size}, type: ${photoFile.type}`);
        const filePath = `kycDocuments/${userId}/${Date.now()}_${photoFile.name}`;
        const storageRef = ref(storage, filePath);

        console.log(`submitKycAction: Storage reference created: ${storageRef.toString()}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        uploadedPhotoUrl = await getDownloadURL(snapshot.ref);
        console.log(`submitKycAction: KYC photo uploaded successfully for user ${userId}. URL: ${uploadedPhotoUrl}`);

      } catch (uploadError: any) {
        const targetBucket = storage.app.options.storageBucket || "NOT_CONFIGURED";
        const projectId = storage.app.options.projectId || "PROJECT_ID_NOT_CONFIGURED";
        console.error(`submitKycAction: Critical error uploading KYC photo to Firebase Storage for user ${userId}:`);
        console.error("Detailed Firebase Storage Upload Error Code:", uploadError.code);
        console.error("Detailed Firebase Storage Upload Error Message:", uploadError.message);
        console.error("Detailed Firebase Storage Upload Error Name:", uploadError.name);
        console.error("Full Firebase Storage Upload Error Object:", JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError)));

        const specificErrorMessage = `Storage Error: ${uploadError.code || 'Unknown Code'} - ${uploadError.message || 'No specific message from storage.'}. Attempted bucket: ${targetBucket} for Project ID: ${projectId}. Please ensure Firebase Storage is enabled and configured for this project in the Firebase Console.`;

        return {
          success: false,
          message: `Failed to upload ID photo. ${specificErrorMessage}`,
          error: specificErrorMessage,
        };
      }
    } else {
      console.warn(`submitKycAction: No governmentIdPhoto provided or file is missing for user ${userId}.`);
       return {
          success: false,
          message: "Government ID photo was not provided or is invalid. Please select a file.",
          error: "No photo file in form data.",
        };
    }

    const kycDocRef = doc(db, "kycData", userId);
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { success: false, message: "User profile not found." };
    }
    const userProfile = userDocSnap.data() as UserProfile;


    const newKycDataForFirestore: KYCData = { 
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

    await setDoc(kycDocRef, newKycDataForFirestore, { merge: true });

    const userProfileUpdate: Partial<UserProfile> = {
      kycStatus: newKycDataForFirestore.status,
    };
    await updateDoc(userDocRef, userProfileUpdate);

    const settingsResult = await getPlatformSettingsAction();
    const platformName = settingsResult.settings?.platformName || "Wohana Funds";
    const emailLogoUrl = settingsResult.settings?.emailLogoImageUrl;
    const adminEmail = settingsResult.settings?.supportEmail;
    const submissionTimestamp = (newKycDataForFirestore.submittedAt as Timestamp).toDate().toISOString();

    // Send KYC Submitted Email to User
    const userEmailPayload = {
      fullName,
      bankName: platformName,
      emailLogoImageUrl: emailLogoUrl,
      kycSubmissionDate: submissionTimestamp,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard/kyc`,
    };

    if (userProfile.email) {
      try {
        const emailContent = await getEmailTemplateAndSubject("KYC_SUBMITTED", userEmailPayload);
        if (emailContent.html) {
          sendTransactionalEmail({
            to: userProfile.email,
            subject: emailContent.subject,
            htmlBody: emailContent.html,
            textBody: `Your KYC documents submitted on ${submissionTimestamp} have been received and are under review. Thank you, The ${platformName} Team.`
          }).then(emailResult => {
            if (!emailResult.success) console.error("Failed to send KYC submitted email to user:", emailResult.error);
            else console.log("KYC submitted email sent to user successfully.");
          });
        }
      } catch (emailError: any) {
        console.error("Error preparing/sending KYC submitted email to user:", emailError.message);
      }
    }

    // Send KYC Submitted Notification to Admin
    if (adminEmail) {
      const adminEmailPayload = {
        fullName, // User's full name
        userId,
        bankName: platformName,
        emailLogoImageUrl: emailLogoUrl,
        kycSubmissionDate: submissionTimestamp,
        adminReviewUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/admin/kyc`,
      };
      try {
        const adminEmailContent = await getEmailTemplateAndSubject("ADMIN_KYC_SUBMITTED", adminEmailPayload);
        if (adminEmailContent.html) {
          sendTransactionalEmail({
            to: adminEmail,
            subject: adminEmailContent.subject,
            htmlBody: adminEmailContent.html,
            textBody: `New KYC Submission: User ${fullName} (ID: ${userId}) submitted KYC documents on ${submissionTimestamp}. Review at ${adminEmailPayload.adminReviewUrl}. - The ${platformName} System.`
          }).then(emailResult => {
            if (!emailResult.success) console.error("Failed to send KYC submitted notification to admin:", emailResult.error);
            else console.log("KYC submitted notification sent to admin successfully.");
          });
        }
      } catch (emailError: any) {
        console.error("Error preparing/sending KYC submitted notification to admin:", emailError.message);
      }
    } else {
      console.warn("Admin/Support email not configured in platform settings. Cannot send KYC submission notification to admin.");
    }


    revalidatePath("/dashboard/kyc");
    revalidatePath("/dashboard");

    const serializableKycData: ClientKYCData = {
      userId: newKycDataForFirestore.userId,
      fullName: newKycDataForFirestore.fullName,
      dateOfBirth: newKycDataForFirestore.dateOfBirth,
      address: newKycDataForFirestore.address,
      governmentId: newKycDataForFirestore.governmentId,
      photoUrl: newKycDataForFirestore.photoUrl,
      photoFileName: newKycDataForFirestore.photoFileName,
      status: newKycDataForFirestore.status,
      submittedAt: submissionTimestamp,
    };

    return {
      success: true,
      message: "KYC information submitted successfully. Awaiting review.",
      kycData: serializableKycData,
    };

  } catch (error: any) {
    console.error("Error submitting KYC:", error);
    const targetBucket = storage.app.options.storageBucket || "NOT_CONFIGURED";
    const projectId = storage.app.options.projectId || "PROJECT_ID_NOT_CONFIGURED";
    const generalErrorMessage = `An unexpected error occurred during KYC submission. Attempted bucket: ${targetBucket} for Project ID: ${projectId}. Error: ${error.message}`;
    return {
      success: false,
      message: generalErrorMessage,
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
    const kycResult: KYCData = {
      userId: data.userId,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      governmentId: data.governmentId,
      photoUrl: data.photoUrl,
      photoFileName: data.photoFileName,
      status: data.status,
      submittedAt: data.submittedAt ? (data.submittedAt as Timestamp).toDate() : undefined,
      reviewedAt: data.reviewedAt ? (data.reviewedAt as Timestamp).toDate() : undefined,
      reviewedBy: data.reviewedBy,
      rejectionReason: data.rejectionReason,
    };
    return kycResult;
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
    let cotPercentageToUse = platformCotPercentage;
    if (cotPercentageToUse === undefined || cotPercentageToUse === null) {
        cotPercentageToUse = settingsResult.settings?.cotPercentage ?? 0.01; 
    }

    const cotAmount = transferData.amount * cotPercentageToUse;
    const totalDeduction = transferData.amount + cotAmount;
    const transactionCurrency = 'currency' in transferData && transferData.currency ? transferData.currency : userProfile.primaryCurrency || "USD";


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
      const freshUserDoc = await transaction.get(userDocRef);
      if (!freshUserDoc.exists()) {
        throw new Error("User profile not found within transaction.");
      }
      const userProfileData = freshUserDoc.data() as UserProfile;
      const currentBalance = userProfileData.balance || 0; 

      if (userProfileData.primaryCurrency !== transactionCurrency && !('currency' in transferData) ) {
        // This case is unlikely if `transactionCurrency` defaults to `userProfile.primaryCurrency`
        // but good for safety.
        console.warn(`Transfer currency for local transfer should match user's primary currency. Defaulting to user's primary: ${userProfileData.primaryCurrency}.`);
      }

      if (currentBalance < totalDeduction) {
        throw new Error(`Insufficient funds in your primary account (${userProfileData.primaryCurrency}) to complete the transfer including fees. Required: ${totalDeduction.toFixed(2)}, Available: ${currentBalance.toFixed(2)}`);
      }

      const updatedBalance = parseFloat((currentBalance - totalDeduction).toFixed(2));
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

      const authDetailsToSave: Partial<AuthorizationDetails> = {
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
        amount: -transferData.amount, // Store the actual transfer amount as negative
        type: "transfer",
        status: "completed",
        currency: transactionCurrency,
        ...(Object.keys(recipientDetails).length > 0 && { recipientDetails: recipientDetails as TransactionType['recipientDetails'] }),
        ...(Object.keys(authDetailsToSave).length > 1 && { authorizationDetails: authDetailsToSave as AuthorizationDetails }),
      };
      const transactionDocRef = doc(collection(db, "transactions"));
      transaction.set(transactionDocRef, newTransactionData);
      
      if (cotAmount > 0) {
        const cotTransactionData: Omit<TransactionType, "id" | "date"> & { date: Timestamp } = {
            userId,
            date: Timestamp.now(),
            description: `Cost of Transfer (COT) for transaction to ${transferData.recipientName}`,
            amount: -cotAmount, // COT is a deduction
            type: "fee",
            status: "completed",
            currency: transactionCurrency,
            relatedTransferId: transactionDocRef.id,
        };
        const cotTransactionDocRef = doc(collection(db, "transactions"));
        transaction.set(cotTransactionDocRef, cotTransactionData);
      }
      
      const firestoreBatchForCodesInsideTx = writeBatch(db); 
      if (cotCodeId) await markCodeAsUsed(cotCodeId, firestoreBatchForCodesInsideTx);
      if (imfCodeId) await markCodeAsUsed(imfCodeId, firestoreBatchForCodesInsideTx);
      if (taxCodeId) await markCodeAsUsed(taxCodeId, firestoreBatchForCodesInsideTx);
      // The batch inside runTransaction will be committed as part of the transaction

      return { 
        transactionId: transactionDocRef.id, 
        newBalance: updatedBalance, 
        userCurrency: userProfileData.primaryCurrency || "USD",
        userFullName: userProfileData.displayName || "Customer",
        mainTransferAmount: transferData.amount,
        recipientName: transferData.recipientName
      };
    });

    const firestoreBatchForCodes = writeBatch(db);
    if (cotCodeId) await markCodeAsUsed(cotCodeId, firestoreBatchForCodes);
    if (imfCodeId) await markCodeAsUsed(imfCodeId, firestoreBatchForCodes);
    if (taxCodeId) await markCodeAsUsed(taxCodeId, firestoreBatchForCodes);
    await firestoreBatchForCodes.commit().catch(err => console.error("Error committing code usage batch:", err));
    
    // Send Debit Notification Email to Sender
    if (userProfile.email) {
      const emailPayload = {
        fullName: transactionResult.userFullName,
        transactionAmount: formatCurrency(transactionResult.mainTransferAmount, transactionResult.userCurrency),
        transactionType: "Debit - Fund Transfer",
        transactionDate: new Date().toISOString(),
        transactionId: transactionResult.transactionId,
        transactionDescription: `Transfer to ${transactionResult.recipientName}`,
        recipientName: transactionResult.recipientName,
        currentBalance: formatCurrency(transactionResult.newBalance, transactionResult.userCurrency),
        loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard/transactions`,
      };
      try {
        const emailContent = await getEmailTemplateAndSubject("DEBIT_NOTIFICATION", emailPayload);
        if (emailContent.html) {
          sendTransactionalEmail({
            to: userProfile.email,
            subject: emailContent.subject,
            htmlBody: emailContent.html,
          }).then(emailRes => {
            if (!emailRes.success) console.error("Failed to send debit notification email:", emailRes.error);
          });
        }
      } catch (emailError: any) {
        console.error("Error preparing debit notification email:", emailError.message);
      }
    }


    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath(`/dashboard/profile`);

    return {
      success: true,
      message: "Transfer processed successfully.",
      newBalance: transactionResult.newBalance,
      transactionId: transactionResult.transactionId,
    };

  } catch (error: any) {
    console.error("Error recording transfer:", error);
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
      } else if (data.date instanceof Date) {
        transactionDate = data.date;
      } else if (data.date) {
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
        id: docSnap.id,
        ...data,
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
    };

    if (phoneNumber !== undefined) {
        updateData.phoneNumber = phoneNumber;
    }

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
      currency: userProfile.primaryCurrency || "USD",
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
      userName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`.trim() || "N/A",
      userEmail: userProfile.email || "N/A",
      subject: validatedData.data.subject,
      message: validatedData.data.message,
      status: "open",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      priority: "medium",
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


interface RequestPasswordResetResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function requestPasswordResetAction(email: string): Promise<RequestPasswordResetResult> {
  const validatedData = ForgotPasswordSchema.safeParse({ email });
  if (!validatedData.success) {
    return {
      success: false,
      message: "Invalid email address.",
      error: validatedData.error.flatten().fieldErrors.email?.[0] || "Validation failed.",
    };
  }

  try {
    await sendPasswordResetEmail(auth, validatedData.data.email);
    return { success: true, message: "If an account exists for this email, a password reset link has been sent." };
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    // Don't reveal if email exists or not for security reasons
    return { success: true, message: "If an account exists for this email, a password reset link has been sent." };
  }
}

