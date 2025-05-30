// src/lib/email-service.ts
"use server";

import type { UserProfile, EmailType, NotificationData } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";

interface EmailServiceDataPayload {
  toEmail?: string; // Allow overriding fetched email
  fullName?: string; // Allow overriding fetched name
  firstName?: string; // Allow overriding fetched name
  [key: string]: any; // For other dynamic data like amount, reason, link, etc.
}

interface EmailServiceResult {
  success: boolean;
  message: string;
  notificationId?: string;
  error?: string;
}

async function getUserDetails(userId: string): Promise<{ email: string | null; fullName: string | null; firstName: string | null; accountNumber: string | null }> {
  if (!userId) return { email: null, fullName: null, firstName: null, accountNumber: null };
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as UserProfile;
      return {
        email: userData.email,
        fullName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || null,
        firstName: userData.firstName || null,
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
  // userId is optional if toEmail is provided directly in data
  // but highly recommended for fetching other user-specific details for templates
  {
    userId,
    emailType,
    data,
    toEmailOverride,
  }: {
    userId?: string;
    emailType: EmailType;
    data: EmailServiceDataPayload;
    toEmailOverride?: string; // Explicitly pass if userId is not available or to override
  }
): Promise<EmailServiceResult> {
  console.log(`EmailService: Attempting to queue email. Type: ${emailType}, UserID: ${userId || 'N/A'}, Data:`, JSON.stringify(data));

  let userDetails: { email: string | null; fullName: string | null; firstName: string | null; accountNumber: string | null } = {
    email: null,
    fullName: null,
    firstName: null,
    accountNumber: null,
  };

  if (userId) {
    userDetails = await getUserDetails(userId);
  }

  const finalToEmail = toEmailOverride || data.toEmail || userDetails.email;
  const finalFullName = data.fullName || userDetails.fullName || "Valued User";
  const finalFirstName = data.firstName || userDetails.firstName || "User";
  const finalAccountNumber = data.accountNumber || userDetails.accountNumber;

  console.log(`EmailService: Determined recipient: ${finalToEmail}, Name: ${finalFullName}`);

  if (!finalToEmail) {
    console.error(`EmailService: Critical error - No recipient email address determined for email type ${emailType}, UserID: ${userId}. Cannot queue notification.`);
    return {
      success: false,
      message: "Failed to queue notification: Recipient email address is missing.",
      error: "Recipient email address could not be determined.",
    };
  }

  const bankName = process.env.FROM_NAME || "Wohana Funds";
  const logoUrl = data.logoUrl || `https://placehold.co/150x50.png?text=${encodeURIComponent(bankName)}`;

  const notificationDoc: Omit<NotificationData, "id"> = {
    type: emailType,
    toEmail: finalToEmail,
    fullName: finalFullName,
    firstName: finalFirstName,
    accountNumber: finalAccountNumber,
    status: "pending",
    createdAt: Timestamp.now(),
    bankName: bankName,
    logoUrl: logoUrl,
    // Spread other data payload which might contain amount, description, reason etc.
    ...data,
  };

  // Remove undefined properties from data before spreading to avoid Firestore issues
  // although Firestore addDoc/setDoc usually handles undefined by omitting fields.
  // This is an extra precaution or for clarity.
  Object.keys(notificationDoc).forEach(key => {
    if (notificationDoc[key as keyof typeof notificationDoc] === undefined) {
      delete notificationDoc[key as keyof typeof notificationDoc];
    }
  });


  console.log("EmailService: Notification document prepared for Firestore:", JSON.stringify(notificationDoc));

  try {
    const notificationsColRef = collection(db, "notifications");
    const docRef = await addDoc(notificationsColRef, notificationDoc);
    console.log(`EmailService: Notification queued successfully to Firestore with ID: ${docRef.id}`);
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
