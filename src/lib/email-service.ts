
// src/lib/email-service.ts
"use server";

import { Resend } from 'resend';
import type { EmailServiceDataPayload, EmailServiceResult } from '@/types';
import { getPlatformSettingsAction } from './actions/admin-settings-actions';
import * as emailTemplates from './email-templates';

let resend: Resend | null = null;
let fromEmailAddress: string | null = null;
let platformNameForEmail: string | null = null;
let emailLogoImageUrlForEmail: string | undefined = undefined;
let resendInitialized = false;

async function initializeResendClient(): Promise<boolean> {
  if (resendInitialized && resend && fromEmailAddress && platformNameForEmail) {
    return true;
  }

  console.log("Attempting to initialize Resend client...");
  try {
    const settingsResult = await getPlatformSettingsAction();

    if (settingsResult.success && settingsResult.settings) {
      const apiKey = settingsResult.settings.resendApiKey;
      const fromEmail = settingsResult.settings.resendFromEmail;
      const pName = settingsResult.settings.platformName;
      const emailLogoUrl = settingsResult.settings.emailLogoImageUrl;

      if (!apiKey) {
        console.error("Resend client initialization failed: Resend API Key is MISSING from settings.");
        platformNameForEmail = pName || "Wohana Funds"; // Still set platform name for template
        emailLogoImageUrlForEmail = emailLogoUrl;
        resendInitialized = false;
        resend = null;
        fromEmailAddress = null;
        return false;
      }
      if (!fromEmail) {
        console.error("Resend client initialization failed: Resend From Email is MISSING from settings.");
        platformNameForEmail = pName || "Wohana Funds";
        emailLogoImageUrlForEmail = emailLogoUrl;
        resendInitialized = false;
        resend = null;
        fromEmailAddress = null;
        return false;
      }
      if (!pName) {
        console.warn("Platform Name is MISSING from settings. Using default 'Wohana Funds' for email display name.");
      }

      platformNameForEmail = pName || "Wohana Funds";
      emailLogoImageUrlForEmail = emailLogoUrl;
      resend = new Resend(apiKey);
      fromEmailAddress = fromEmail;
      resendInitialized = true;
      console.log(`Resend client initialized successfully. From Email: ${fromEmailAddress}, Platform Name: ${platformNameForEmail}, Email Logo URL: ${emailLogoImageUrlForEmail}`);
      return true;

    } else {
      console.error("Resend client initialization failed: Could not retrieve platform settings.", settingsResult.error);
      resendInitialized = false;
      resend = null;
      fromEmailAddress = null;
      platformNameForEmail = null;
      emailLogoImageUrlForEmail = undefined;
      return false;
    }
  } catch (error) {
    console.error("Exception during Resend client initialization:", error);
    resendInitialized = false;
    resend = null;
    fromEmailAddress = null;
    platformNameForEmail = null;
    emailLogoImageUrlForEmail = undefined;
    return false;
  }
}

interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string; // Changed from reactElement to htmlBody
  textBody?: string; // Optional text version
}

export async function sendTransactionalEmail(
  { to, subject, htmlBody, textBody }: SendEmailParams
): Promise<EmailServiceResult> {
  const isClientInitialized = await initializeResendClient();

  if (!isClientInitialized || !resend || !fromEmailAddress || !platformNameForEmail) {
    const errorMsg = "Resend client is not initialized or platform name/from email is missing. Check API key, From Email, Platform Name, and Email Logo URL in admin settings or server logs for details.";
    console.error(`sendTransactionalEmail: Aborting send. ${errorMsg}`);
    return {
      success: false,
      message: "Failed to send email: Email service not configured.",
      error: errorMsg,
    };
  }

  const displayName = platformNameForEmail.replace(/"/g, '\\"');
  const formattedFrom = `"${displayName}" <${fromEmailAddress}>`;
  console.log(`Constructed 'From' field for Resend: ${formattedFrom}`);

  if (!htmlBody || typeof htmlBody !== 'string' || htmlBody.trim() === '') {
    console.error("sendTransactionalEmail: HTML body is empty or invalid.");
    return { success: false, message: "Email content is empty.", error: "HTML body generation failed." };
  }
  console.log("HTML body to be sent (first 100 chars):", htmlBody.substring(0, 100));


  try {
    console.log(`Attempting to send email via Resend: To: ${to}, Subject: "${subject}", From: ${formattedFrom}`);
    const { data, error } = await resend.emails.send({
      from: formattedFrom,
      to: [to],
      subject: subject,
      html: htmlBody, // Use html property for HTML string
      text: textBody || subject, // Basic text fallback
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
): Promise<{ subject: string; html: string | null }> { // Changed template to html
  
  // Ensure client is initialized to fetch platformName and emailLogoImageUrl
  if (!resendInitialized) {
    await initializeResendClient();
  }
  
  const currentPlatformName = platformNameForEmail || "Wohana Funds"; // Fallback
  const currentEmailLogoUrl = emailLogoImageUrlForEmail; // Use the fetched one

  const templatePayload = {
    ...payload,
    bankName: currentPlatformName,
    emailLogoImageUrl: currentEmailLogoUrl,
  };

  switch (emailType) {
    case "WELCOME":
      return {
        subject: `Welcome to ${currentPlatformName}!`,
        html: emailTemplates.welcomeEmailTemplate(templatePayload),
      };
    // Add cases for other email types, e.g., PASSWORD_RESET
    // case "PASSWORD_RESET":
    //   return {
    //     subject: `Reset Your ${currentPlatformName} Password`,
    //     html: emailTemplates.passwordResetEmailTemplate({ // Assuming you create this
    //       userName: payload.userName || "User",
    //       resetLink: payload.resetLink || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/reset-password?token=xyz`,
    //       bankName: currentPlatformName,
    //       emailLogoImageUrl: currentEmailLogoUrl,
    //     }),
    //   };
    default:
      console.warn(`No HTML template defined for email type: ${emailType}`);
      return { subject: `Notification from ${currentPlatformName}`, html: `<p>This is a notification from ${currentPlatformName}.</p>` }; // Basic fallback HTML
  }
}
