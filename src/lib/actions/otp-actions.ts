
// src/lib/actions/otp-actions.ts
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp, serverTimestamp, query, where, getDocs, limit, updateDoc, doc, orderBy, type FieldValue } from "firebase/firestore";
import type { OtpRecord } from "@/types";
import { sendTransactionalEmail, getEmailTemplateAndSubject } from "@/lib/email-service";
import { getPlatformSettingsAction } from "./admin-settings-actions";

interface GenerateOtpResult {
  success: boolean;
  message: string;
  otpId?: string;
  error?: string;
}

// Generates a 6-digit numeric OTP
function generateNumericOtp(length: number = 6): string {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

export async function generateAndSendOtpAction(
  userId: string,
  purpose: string,
  userEmail?: string,
  userName?: string
): Promise<GenerateOtpResult> {
  if (!userId) {
    return { success: false, message: "User ID is required to generate OTP." };
  }
  if (!userEmail) {
    return { success: false, message: "User email is required to send OTP." };
  }
  // console.log(`generateAndSendOtpAction: Initiated for userId='${userId}', purpose='${purpose}', email='${userEmail}'`);

  try {
    const otpValue = generateNumericOtp();
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + 10 * 60 * 1000); // OTP expires in 10 minutes

    const newOtpRecord: Omit<OtpRecord, "id"> = {
      userId,
      otp: otpValue,
      purpose,
      createdAt: now,
      expiresAt,
      isUsed: false,
    };

    const otpCollectionRef = collection(db, "otpRecords");
    const docRef = await addDoc(otpCollectionRef, newOtpRecord);
    // console.log(`generateAndSendOtpAction: OTP record stored in Firestore. ID: ${docRef.id}, OTP: ${otpValue} (for debugging only, remove in prod)`);

    // Send OTP email
    const settingsResult = await getPlatformSettingsAction();
    const platformName = settingsResult.settings?.platformName || "Wohana Funds";
    const emailLogoUrl = settingsResult.settings?.emailLogoImageUrl;
    const supportEmail = settingsResult.settings?.supportEmail;

    const emailPayload = {
      fullName: userName || "Valued Customer",
      bankName: platformName,
      emailLogoImageUrl: emailLogoUrl,
      otp: otpValue,
      supportEmail: supportEmail,
    };

    const emailContent = await getEmailTemplateAndSubject("OTP_VERIFICATION", emailPayload);

    if (emailContent.html) {
      // console.log(`generateAndSendOtpAction: Sending OTP email to ${userEmail}`);
      const emailResult = await sendTransactionalEmail({
        to: userEmail,
        subject: emailContent.subject,
        htmlBody: emailContent.html,
        textBody: `Your One-Time Password (OTP) for ${platformName} is ${otpValue}. It will expire in 10 minutes.`,
      });

      if (!emailResult.success) {
        console.error("generateAndSendOtpAction: Failed to send OTP email:", emailResult.error);
        // Decide if this should be a hard failure or just a warning
      } else {
        // console.log("generateAndSendOtpAction: OTP email sent successfully.");
      }
    } else {
        console.warn("generateAndSendOtpAction: OTP email HTML content was null or empty. OTP email not sent.");
    }

    return {
      success: true,
      message: "OTP generated and sent successfully.",
      otpId: docRef.id,
    };
  } catch (error: any) {
    console.error("generateAndSendOtpAction: Error generating and sending OTP:", error.message, error.stack);
    return {
      success: false,
      message: "Failed to generate or send OTP.",
      error: error.message,
    };
  }
}

interface VerifyOtpResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function verifyOtpAction(
  userId: string,
  purpose: string,
  otpEntered: string
): Promise<VerifyOtpResult> {
  console.log(`verifyOtpAction: Called for userId='${userId}', purpose='${purpose}', otpEntered='${otpEntered}'`);
  if (!userId || !purpose || !otpEntered) {
    return { success: false, message: "User ID, purpose, and OTP are required. (Code: INP_VAL)" };
  }

  try {
    const otpCollectionRef = collection(db, "otpRecords");
    const q = query(
      otpCollectionRef,
      where("userId", "==", userId),
      where("purpose", "==", purpose),
      where("otp", "==", otpEntered),
      where("isUsed", "==", false),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (queryError: any) {
      console.error("verifyOtpAction: Firestore query failed:", queryError.message, queryError.stack);
      return { success: false, message: "Error querying OTP records. Please try again. (Code: DB_QRY_FAIL)", error: queryError.message };
    }

    if (querySnapshot.empty) {
      console.log("verifyOtpAction: No matching, unused OTP found in Firestore for the provided details.");
      return { success: false, message: "Invalid or expired OTP. Please ensure you've entered the latest code. (Code: OTP_NFD_OR_USED)" };
    }

    const otpDoc = querySnapshot.docs[0];
    const otpDataFromStore = otpDoc.data();
    
    if (!otpDataFromStore) {
        console.error("verifyOtpAction: CRITICAL - otpDoc.data() returned undefined/null for a non-empty snapshot. Doc ID:", otpDoc.id);
        return { success: false, message: "Error retrieving OTP data. Please try again. (Code: DATA_RTRV_FAIL)", error: "OTP document data is undefined/null" };
    }
    console.log("verifyOtpAction: Raw OTP record found:", JSON.stringify(otpDataFromStore));


    // --- Timestamp Validation ---
    let expiresAtMillis: number;
    const firestoreExpiresAt = otpDataFromStore.expiresAt;

    if (!firestoreExpiresAt) {
        console.error("verifyOtpAction: CRITICAL - expiresAt field is missing from OTP record:", otpDoc.id, "Data:", otpDataFromStore);
        return { success: false, message: "OTP record is malformed (missing expiry). Please contact support. (Code: TM_MISS)" };
    }

    if (firestoreExpiresAt && typeof (firestoreExpiresAt as Timestamp).toMillis === 'function') {
        expiresAtMillis = (firestoreExpiresAt as Timestamp).toMillis();
        console.log(`verifyOtpAction: 'expiresAt' is a Firestore Timestamp. Millis: ${expiresAtMillis}`);
    } else {
        console.warn("verifyOtpAction: 'expiresAt' is not a direct Firestore Timestamp object. Type:", typeof firestoreExpiresAt, ". Attempting to parse from potential plain object or string.");
        try {
            let parsedDate: Date;
            if (typeof firestoreExpiresAt === 'object' && firestoreExpiresAt !== null && 'seconds' in firestoreExpiresAt && 'nanoseconds' in firestoreExpiresAt) {
                // Plain object resembling Firestore Timestamp
                parsedDate = new Timestamp((firestoreExpiresAt as any).seconds, (firestoreExpiresAt as any).nanoseconds).toDate();
            } else {
                // Attempt to parse as string or number
                parsedDate = new Date(firestoreExpiresAt as string | number);
            }
            
            if (!isNaN(parsedDate.getTime())) {
                expiresAtMillis = parsedDate.getTime();
                console.log(`verifyOtpAction: Successfully parsed 'expiresAt' fallback. Millis: ${expiresAtMillis}`);
            } else {
                console.error("verifyOtpAction: CRITICAL - 'expiresAt' field is an unparsable format after fallback attempts:", firestoreExpiresAt);
                return { success: false, message: "OTP record has an invalid expiry time format. Please contact support. (Code: TM_UNP_FALLBACK)" };
            }
        } catch (parseError: any) {
             console.error("verifyOtpAction: CRITICAL - Error during fallback parsing of 'expiresAt':", parseError.message, parseError.stack);
             return { success: false, message: "Error processing OTP expiry. Please contact support. (Code: TM_PARSE_ERR)" };
        }
    }
    // --- End Timestamp Validation ---

    if (expiresAtMillis < Date.now()) {
      console.log("verifyOtpAction: OTP has expired. ExpiresAt (ms):", expiresAtMillis, "Now (ms):", Date.now());
      try {
        await updateDoc(doc(db, "otpRecords", otpDoc.id), { 
          isUsed: true, 
          updatedAt: serverTimestamp() as FieldValue 
        });
      } catch (updateError: any) {
        console.error("verifyOtpAction: Failed to mark expired OTP as used:", updateError.message, updateError.stack);
      }
      return { success: false, message: "OTP has expired. Please request a new one. (Code: OTP_EXP)" };
    }

    // Mark OTP as used
    try {
      await updateDoc(doc(db, "otpRecords", otpDoc.id), {
        isUsed: true,
        updatedAt: serverTimestamp() as FieldValue, 
      });
      console.log("verifyOtpAction: OTP verified and marked as used successfully. Record ID:", otpDoc.id);
    } catch (updateError: any) {
      console.error("verifyOtpAction: Failed to mark OTP as used during verification:", updateError.message, updateError.stack);
      return { success: false, message: "Failed to finalize OTP verification. Please try again. (Code: UPD_FAIL)", error: updateError.message };
    }

    return { success: true, message: "OTP verified successfully." };

  } catch (error: any) {
    console.error("verifyOtpAction: EXCEPTION during OTP verification:", error.message, error.stack, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return {
      success: false,
      message: "Failed to verify OTP due to an unexpected server error. (Code: GEN_EXC)",
      error: error.message,
    };
  }
}

