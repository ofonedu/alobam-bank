
// src/lib/email-service.ts
"use server";

import type { UserProfile, EmailType, NotificationData } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";

interface EmailServiceDataPayload {
  toEmail?: string; 
  fullName?: string; 
  firstName?: string;
  accountNumber?: string;
  // Fields for DEBIT_NOTIFICATION / CREDIT_NOTIFICATION
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
  transactionId?: string; // For linking to the transaction
  // Fields for WELCOME_EMAIL
  loginLink?: string;
  // Fields for TRANSFER_SUCCESS / TRANSFER_FAILED
  recipientName?: string;
  reason?: string; // For rejections/failures
  // Fields for LOAN_APPROVED / LOAN_REJECTED
  loanId?: string;
  loanAmount?: number;
  approvalDate?: string; // Or Date
  rejectionDate?: string; // Or Date
  // ... any other dynamic data your templates might need for various types
}

interface EmailServiceResult {
  success: boolean;
  message: string;
  notificationId?: string;
  error?: string;
}

async function getUserDetails(userId?: string): Promise<{ email: string | null; fullName: string | null; firstName: string | null; accountNumber: string | null }> {
  if (!userId) return { email: null, fullName: null, firstName: null, accountNumber: null };
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as UserProfile;
      const constructedFullName = userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || "User";
      return {
        email: userData.email,
        fullName: constructedFullName,
        firstName: userData.firstName || "User",
        accountNumber: userData.accountNumber || null,
      };
    }
    console.warn(`EmailService (getUserDetails): User document not found for UID: ${userId}`);
    return { email: null, fullName: null, firstName: null, accountNumber: null };
  } catch (error) {
    console.error(`EmailService (getUserDetails): Error fetching user details for UID ${userId}:`, error);
    return { email: null, fullName: null, firstName: null, accountNumber: null };
  }
}

export async function sendTransactionalEmail(
  {
    userId, // Optional: if toEmail and fullName are provided directly in data
    emailType,
    data, // This object should contain all fields for the NotificationData, including toEmail/fullName if not relying on userId fetch
    toEmailOverride,
  }: {
    userId?: string;
    emailType: EmailType;
    data: Partial<Omit<NotificationData, 'type' | 'status' | 'createdAt' | 'bankName' | 'logoUrl' >> & { toEmail?: string; fullName?: string; firstName?: string; }; // Make specific fields from NotificationData optional
    toEmailOverride?: string;
  }
): Promise<EmailServiceResult> {
  
  console.log(`EmailService: Attempting to queue email. Type: ${emailType}, UserID: ${userId || 'N/A'}, Data:`, JSON.stringify(data));

  const userDetails = await getUserDetails(userId);

  const finalToEmail = toEmailOverride || data.toEmail || userDetails.email;
  const finalFullName = data.fullName || userDetails.fullName || "Valued User";
  const finalFirstName = data.firstName || userDetails.firstName || "User";
  const finalAccountNumber = data.accountNumber || userDetails.accountNumber;

  console.log(`EmailService: Determined recipient: ${finalToEmail}, Name: ${finalFullName}`);

  if (!finalToEmail) {
    console.error(`EmailService: CRITICAL - No recipient email address determined for email type ${emailType}, UserID: ${userId || 'N/A'}, Data: ${JSON.stringify(data)}. Cannot queue notification.`);
    return {
      success: false,
      message: "Failed to queue notification: Recipient email address is missing.",
      error: "Recipient email address could not be determined from provided data or user profile.",
    };
  }
  
  const bankName = process.env.FROM_NAME || "Wohana Funds"; // Should be configured in Cloud Function env
  const logoUrl = data.logoUrl || `https://placehold.co/150x50.png?text=${encodeURIComponent(bankName)}`; // Placeholder

  const notificationDoc: Omit<NotificationData, "id"> = {
    type: emailType,
    toEmail: finalToEmail,
    fullName: finalFullName,
    firstName: finalFirstName,
    accountNumber: finalAccountNumber, // Can be null if userDetails.accountNumber is null
    status: "pending",
    createdAt: Timestamp.now(),
    bankName: bankName, // For template consistency
    logoUrl: logoUrl,   // For template consistency
    // Spread other dynamic data
    ...data,
  };

  // Remove undefined properties explicitly to avoid Firestore issues
  Object.keys(notificationDoc).forEach(keyStr => {
    const key = keyStr as keyof typeof notificationDoc;
    if (notificationDoc[key] === undefined) {
      delete notificationDoc[key];
    }
  });

  console.log("EmailService: Notification document prepared for Firestore:", JSON.stringify(notificationDoc));

  try {
    const notificationsColRef = collection(db, "notifications");
    const docRef = await addDoc(notificationsColRef, notificationDoc);
    console.log(`EmailService: Notification queued successfully to Firestore with ID: ${docRef.id} for type ${emailType} to ${finalToEmail}`);
    return {
      success: true,
      message: `Notification successfully queued for ${emailType}.`,
      notificationId: docRef.id,
    };
  } catch (firestoreError: any) {
    console.error(`EmailService: CRITICAL ERROR - Failed to write notification to Firestore for type ${emailType} to ${finalToEmail}.`);
    console.error("Firestore Write Error Details:", firestoreError.message);
    console.error("Firestore Write Error Code:", firestoreError.code);
    console.error("Full Firestore Write Error Object:", JSON.stringify(firestoreError, Object.getOwnPropertyNames(firestoreError)));
    return {
      success: false,
      message: "Failed to queue notification to Firestore. Check server logs.",
      error: `Firestore error: ${firestoreError.message} (Code: ${firestoreError.code || 'N/A'})`,
    };
  }
}

// Kept for potential direct use if needed, but sendTransactionalEmail is preferred.
export { getUserDetails as getUserEmail }; // Re-exporting for clarity if needed, but prefer getUserDetails
export { getUserDetails };
    