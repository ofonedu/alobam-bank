
// src/lib/actions/otp-actions.ts
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp, serverTimestamp, query, where, getDocs, limit, updateDoc, doc, orderBy } from "firebase/firestore";
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
  // console.log(`verifyOtpAction: Called for userId='${userId}', purpose='${purpose}', otpEntered='${otpEntered}'`);
  if (!userId || !purpose || !otpEntered) {
    return { success: false, message: "User ID, purpose, and OTP are required." };
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

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // console.log("verifyOtpAction: No matching, unused OTP found in Firestore for the provided details.");
      return { success: false, message: "Invalid or expired OTP. Please ensure you've entered the latest code." };
    }

    const otpDoc = querySnapshot.docs[0];
    const otpDataFromStore = otpDoc.data();
    // console.log("verifyOtpAction: Raw OTP record found:", JSON.stringify(otpDataFromStore));

    let expiresAtMillis: number;

    if (otpDataFromStore.expiresAt && typeof otpDataFromStore.expiresAt.toMillis === 'function') {
      // It's a Firestore Timestamp object
      expiresAtMillis = otpDataFromStore.expiresAt.toMillis();
    } else if (otpDataFromStore.expiresAt && typeof otpDataFromStore.expiresAt === 'object' && 'seconds' in otpDataFromStore.expiresAt && 'nanoseconds' in otpDataFromStore.expiresAt) {
      // It's a plain object that looks like a Firestore Timestamp (e.g., from JSON serialization/deserialization)
      // This can happen if data is passed around and loses its Firestore Timestamp type.
      const plainTimestamp = otpDataFromStore.expiresAt as { seconds: number, nanoseconds: number };
      expiresAtMillis = (plainTimestamp.seconds * 1000) + (plainTimestamp.nanoseconds / 1000000);
    } else if (otpDataFromStore.expiresAt && (typeof otpDataFromStore.expiresAt === 'string' || typeof otpDataFromStore.expiresAt === 'number')) {
      // It might be an ISO string or a number (milliseconds epoch)
      const parsedDate = new Date(otpDataFromStore.expiresAt);
      if (!isNaN(parsedDate.getTime())) {
        expiresAtMillis = parsedDate.getTime();
      } else {
        // console.error("verifyOtpAction: CRITICAL - expiresAt field is an unparsable string/number:", otpDataFromStore.expiresAt);
        return { success: false, message: "OTP record has an invalid expiry time format. Please contact support. (Code: TM_UNP)" };
      }
    } else {
      // console.error("verifyOtpAction: CRITICAL - expiresAt field is missing or not a recognized Timestamp format from OTP record:", otpDataFromStore.expiresAt);
      return { success: false, message: "OTP record is malformed. Cannot verify expiry. Please contact support. (Code: TM_MAL)" };
    }
    // console.log(`verifyOtpAction: Parsed expiresAtMillis: ${expiresAtMillis}, Current time: ${Date.now()}`);


    if (expiresAtMillis < Date.now()) {
      // console.log("verifyOtpAction: OTP has expired. ExpiresAt (ms):", expiresAtMillis, "Now (ms):", Date.now());
      // Optionally mark as used even if expired to prevent replay if clocks are off
      try {
        await updateDoc(doc(db, "otpRecords", otpDoc.id), { isUsed: true, updatedAt: serverTimestamp() as Timestamp });
      } catch (updateError) {
        console.error("verifyOtpAction: Failed to mark expired OTP as used:", updateError);
      }
      return { success: false, message: "OTP has expired. Please request a new one." };
    }

    // Mark OTP as used
    try {
      await updateDoc(doc(db, "otpRecords", otpDoc.id), {
        isUsed: true,
        updatedAt: serverTimestamp() as Timestamp,
      });
      // console.log("verifyOtpAction: OTP verified and marked as used successfully. Record ID:", otpDoc.id);
    } catch (updateError: any) {
      console.error("verifyOtpAction: Failed to mark OTP as used during verification:", updateError);
      return { success: false, message: "Failed to finalize OTP verification. Please try again. (Code: UPD_FAIL)" , error: updateError.message };
    }

    return { success: true, message: "OTP verified successfully." };

  } catch (error: any) {
    // console.error("verifyOtpAction: EXCEPTION during OTP verification:", error.message, error.stack, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return {
      success: false,
      message: "Failed to verify OTP due to an unexpected server error. (Code: GEN_EXC)",
      error: error.message,
    };
  }
}
