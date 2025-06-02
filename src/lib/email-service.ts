
// src/lib/email-service.ts
"use server";

import { Resend } from 'resend';
import type { EmailServiceDataPayload, EmailServiceResult, PlatformSettings } from '@/types'; // EmailType is defined in types
import { EmailType } from '@/types'; // Import EmailType as a value if needed elsewhere, or rely on string for getEmailTemplateAndSubject
import { getPlatformSettingsAction } from './actions/admin-settings-actions';
import * as emailTemplates from './email-templates'; 

let resend: Resend | null = null;
let fromEmailAddress: string | null = null;
let resendInitialized = false; 

async function initializeResendClient(): Promise<boolean> {
  if (resendInitialized && resend && fromEmailAddress) {
    console.log("Resend client already initialized.");
    return true;
  }

  console.log("Attempting to initialize Resend client...");
  try {
    const settingsResult = await getPlatformSettingsAction(); 

    if (settingsResult.success && settingsResult.settings) {
      const apiKey = settingsResult.settings.resendApiKey;
      const fromEmail = settingsResult.settings.resendFromEmail;

      if (!apiKey) {
        console.error("Resend client initialization failed: Resend API Key is MISSING from settings.");
      }
      if (!fromEmail) {
        console.error("Resend client initialization failed: Resend From Email is MISSING from settings.");
      }

      if (apiKey && fromEmail) {
        resend = new Resend(apiKey);
        fromEmailAddress = fromEmail;
        resendInitialized = true;
        console.log(`Resend client initialized successfully. From Email: ${fromEmailAddress}`);
        return true;
      } else {
        resendInitialized = false;
        resend = null;
        fromEmailAddress = null;
        return false;
      }
    } else {
      console.error("Resend client initialization failed: Could not retrieve platform settings.", settingsResult.error);
      resendInitialized = false;
      resend = null;
      fromEmailAddress = null;
      return false;
    }
  } catch (error) {
    console.error("Exception during Resend client initialization:", error);
    resendInitialized = false;
    resend = null;
    fromEmailAddress = null;
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

  if (!isClientInitialized || !resend || !fromEmailAddress) {
    const errorMsg = "Resend client is not initialized. Check API key and From Email in admin settings or server logs for details.";
    console.error(`sendTransactionalEmail: Aborting send. ${errorMsg}`);
    return {
      success: false,
      message: "Failed to send email: Email service not configured.",
      error: errorMsg,
    };
  }

  try {
    console.log(`Attempting to send email via Resend: To: ${to}, Subject: "${subject}", From: ${fromEmailAddress}`);
    const { data, error } = await resend.emails.send({
      from: fromEmailAddress,
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
  emailType: string, // Changed from EmailType enum to string
  payload: EmailServiceDataPayload
): Promise<{ subject: string; template: React.ReactElement | null }> {
  let platformName = "Wohana Funds"; 
  try {
    const settingsResult = await getPlatformSettingsAction();
    if (settingsResult.success && settingsResult.settings?.platformName) {
      platformName = settingsResult.settings.platformName;
    }
  } catch (e) {
    console.warn("Could not fetch platform name for email template, using default.", e);
  }

  switch (emailType) {
    case "WELCOME": // Use string literal for case
      return {
        subject: `Welcome to ${platformName}!`,
        template: emailTemplates.WelcomeEmail({
          userName: payload.userName || "User",
          loginLink: payload.loginLink || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard`,
          platformName,
        }),
      };
    case "PASSWORD_RESET": // Use string literal for case
      return {
        subject: `Reset Your ${platformName} Password`,
        template: emailTemplates.PasswordResetEmail({
          userName: payload.userName || "User",
          resetLink: payload.resetLink || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/reset-password?token=xyz`,
          platformName,
        }),
      };
    default:
      console.warn(`No template defined for email type: ${emailType}`);
      return { subject: `Notification from ${platformName}`, template: null };
  }
}
