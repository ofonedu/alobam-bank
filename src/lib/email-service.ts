
// src/lib/email-service.ts
"use server";

import { Resend } from 'resend';
import type { EmailServiceDataPayload, EmailServiceResult } from '@/types';
import { getPlatformSettingsAction } from './actions/admin-settings-actions';
import * as emailTemplates from './email-templates';

let resend: Resend | null = null;
let fromEmailAddress: string | null = null;
let platformNameForEmail: string | null = null; // To store the platform name
let resendInitialized = false;

async function initializeResendClient(): Promise<boolean> {
  if (resendInitialized && resend && fromEmailAddress && platformNameForEmail) {
    // console.log("Resend client already initialized with all necessary details.");
    return true;
  }

  console.log("Attempting to initialize Resend client...");
  try {
    const settingsResult = await getPlatformSettingsAction();

    if (settingsResult.success && settingsResult.settings) {
      const apiKey = settingsResult.settings.resendApiKey;
      const fromEmail = settingsResult.settings.resendFromEmail;
      const pName = settingsResult.settings.platformName;

      if (!apiKey) {
        console.error("Resend client initialization failed: Resend API Key is MISSING from settings.");
        platformNameForEmail = pName || "Wohana Funds";
        resendInitialized = false;
        resend = null;
        fromEmailAddress = null;
        return false;
      }
      if (!fromEmail) {
        console.error("Resend client initialization failed: Resend From Email is MISSING from settings.");
        platformNameForEmail = pName || "Wohana Funds";
        resendInitialized = false;
        resend = null;
        fromEmailAddress = null;
        return false;
      }
      if (!pName) {
        console.warn("Platform Name is MISSING from settings. Using default 'Wohana Funds' for email display name.");
      }

      platformNameForEmail = pName || "Wohana Funds";
      resend = new Resend(apiKey);
      fromEmailAddress = fromEmail;
      resendInitialized = true;
      console.log(`Resend client initialized successfully. From Email: ${fromEmailAddress}, Platform Name: ${platformNameForEmail}`);
      return true;

    } else {
      console.error("Resend client initialization failed: Could not retrieve platform settings.", settingsResult.error);
      resendInitialized = false;
      resend = null;
      fromEmailAddress = null;
      platformNameForEmail = null; // Ensure this is null if settings fail
      return false;
    }
  } catch (error) {
    console.error("Exception during Resend client initialization:", error);
    resendInitialized = false;
    resend = null;
    fromEmailAddress = null;
    platformNameForEmail = null;
    return false;
  }
}

interface SendEmailParams {
  to: string;
  subject: string;
  reactElement: React.ReactElement;
}

export async function sendTransactionalEmail(
  { to, subject, reactElement }: SendEmailParams
): Promise<EmailServiceResult> {
  const isClientInitialized = await initializeResendClient();

  if (!isClientInitialized || !resend || !fromEmailAddress || !platformNameForEmail) {
    const errorMsg = "Resend client is not initialized or platform name/from email is missing. Check API key, From Email, and Platform Name in admin settings or server logs for details.";
    console.error(`sendTransactionalEmail: Aborting send. ${errorMsg}`);
    return {
      success: false,
      message: "Failed to send email: Email service not configured.",
      error: errorMsg,
    };
  }

  // Format "From" to "\"Display Name\" <email@example.com>" with quotes around the display name
  const displayName = platformNameForEmail.replace(/"/g, '\\"'); // Escape any existing quotes in the platform name
  const formattedFrom = `"${displayName}" <${fromEmailAddress}>`;
  console.log(`Constructed 'From' field for Resend: ${formattedFrom}`);
  
  // Log the type and props of the React element
  console.log("React element to be sent to Resend (typeof):", typeof reactElement);
  if (reactElement && typeof reactElement === 'object' && reactElement.props) {
    console.log("React element props:", JSON.stringify(reactElement.props, null, 2));
  } else {
    console.log("React element is null, undefined, or has no props.");
  }


  try {
    console.log(`Attempting to send email via Resend: To: ${to}, Subject: "${subject}", From: ${formattedFrom}`);
    const { data, error } = await resend.emails.send({
      from: formattedFrom,
      to: [to],
      subject: subject,
      react: reactElement,
    });

    if (error) {
      console.error(`Resend API Error: Name: ${error.name}, Message: ${error.message}. Full Error:`, JSON.stringify(error));
      return {
        success: false,
        message: `Failed to send email via Resend API: ${error.name} - ${error.message}`,
        error: JSON.stringify(error),
      };
    }

    console.log("Email sent successfully via Resend. ID:", data?.id);
    return {
      success: true,
      message: "Email sent successfully.",
    };
  } catch (exception: any) {
    console.error("Exception during resend.emails.send():", exception);
    return {
      success: false,
      message: `An unexpected error occurred while sending email: ${exception.message || 'Unknown exception'}`,
      error: JSON.stringify(exception, Object.getOwnPropertyNames(exception)),
    };
  }
}

export async function getEmailTemplateAndSubject(
  emailType: string, 
  payload: EmailServiceDataPayload
): Promise<{ subject: string; template: React.ReactElement | null }> {
  let currentPlatformName = platformNameForEmail;
  if (!currentPlatformName) {
    // Attempt to initialize/fetch if not already done (e.g., if this function is called independently)
    console.log("getEmailTemplateAndSubject: Platform name not pre-available, attempting to fetch via initializeResendClient...");
    await initializeResendClient(); // This will set platformNameForEmail
    currentPlatformName = platformNameForEmail; // Use the potentially updated value
    if (!currentPlatformName) {
      currentPlatformName = "Wohana Funds"; // Fallback if still not set
      console.warn("getEmailTemplateAndSubject: Could not fetch platform name, using default:", currentPlatformName);
    }
  }


  switch (emailType) {
    case "WELCOME":
      return {
        subject: `Welcome to ${currentPlatformName}!`,
        template: emailTemplates.WelcomeEmail({
          userName: payload.userName || "User",
          loginLink: payload.loginLink || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard`,
          platformName: currentPlatformName,
        }),
      };
    case "PASSWORD_RESET":
      return {
        subject: `Reset Your ${currentPlatformName} Password`,
        template: emailTemplates.PasswordResetEmail({
          userName: payload.userName || "User",
          resetLink: payload.resetLink || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/reset-password?token=xyz`,
          platformName: currentPlatformName,
        }),
      };
    default:
      console.warn(`No template defined for email type: ${emailType}`);
      return { subject: `Notification from ${currentPlatformName}`, template: null };
  }
}
