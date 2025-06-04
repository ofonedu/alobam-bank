
// src/lib/actions/otp-actions.ts
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp, serverTimestamp, query, where, getDocs, limit, updateDoc, doc } from "firebase/firestore";
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
      const emailResult = await sendTransactionalEmail({
        to: userEmail,
        subject: emailContent.subject,
        htmlBody: emailContent.html,
        textBody: `Your One-Time Password (OTP) for ${platformName} is ${otpValue}. It will expire in 10 minutes.`,
      });

      if (!emailResult.success) {
        console.error("Failed to send OTP email:", emailResult.error);
      }
    } else {
        console.warn("OTP email HTML content was null or empty. OTP email not sent.");
    }

    return {
      success: true,
      message: "OTP generated and sent successfully.",
      otpId: docRef.id,
    };
  } catch (error: any) {
    console.error("Error generating and sending OTP:", error);
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
  if (!userId || !purpose || !otpEntered) {
    return { success: false, message: "User ID, purpose, and OTP are required." };
  }

  try {
    const otpCollectionRef = collection(db, "otpRecords");
    const q = query(
      otpCollectionRef,
      where("userId", "==", userId),
      where("purpose", "==", purpose),
      where("otp", "==", otpEntered), // Direct comparison (consider hashing in production)
      where("isUsed", "==", false),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: "Invalid or expired OTP." };
    }

    const otpDoc = querySnapshot.docs[0];
    const otpData = otpDoc.data() as OtpRecord;

    if (otpData.expiresAt.toMillis() < Date.now()) {
      // Optionally mark as used even if expired to prevent replay if clocks are off
      // await updateDoc(doc(db, "otpRecords", otpDoc.id), { isUsed: true, updatedAt: serverTimestamp() });
      return { success: false, message: "OTP has expired." };
    }

    // Mark OTP as used
    await updateDoc(doc(db, "otpRecords", otpDoc.id), {
      isUsed: true,
      updatedAt: serverTimestamp() as Timestamp,
    });

    return { success: true, message: "OTP verified successfully." };
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return {
      success: false,
      message: "Failed to verify OTP due to a server error.",
      error: error.message,
    };
  }
}

    