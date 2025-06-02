
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
  // Attempt to re-initialize only if not already successfully initialized
  // or if essential components are missing.
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

      // Critical checks for initialization success
      if (!apiKey) {
        console.error("Resend client initialization FAILED: Resend API Key is MISSING from settings.");
        platformNameForEmail = pName || "Wohana Funds"; // Still set for template if possible
        emailLogoImageUrlForEmail = emailLogoUrl;
        resendInitialized = false;
        resend = null;
        fromEmailAddress = null;
        return false;
      }
      if (!fromEmail) {
        console.error("Resend client initialization FAILED: Resend From Email is MISSING from settings.");
        platformNameForEmail = pName || "Wohana Funds";
        emailLogoImageUrlForEmail = emailLogoUrl;
        resendInitialized = false;
        resend = null;
        fromEmailAddress = null;
        return false;
      }
      if (!pName) {
        console.warn("Resend client initialization WARNING: Platform Name is MISSING from settings. Using default 'Wohana Funds' for email display name.");
      }

      platformNameForEmail = pName || "Wohana Funds";
      emailLogoImageUrlForEmail = emailLogoUrl;
      resend = new Resend(apiKey);
      fromEmailAddress = fromEmail;
      resendInitialized = true;
      console.log(`Resend client initialized successfully. From Email: ${fromEmailAddress}, Platform Name: ${platformNameForEmail}, Email Logo URL: ${emailLogoImageUrlForEmail || 'Not set'}`);
      return true;

    } else {
      console.error("Resend client initialization FAILED: Could not retrieve platform settings.", settingsResult.error);
      resendInitialized = false;
      resend = null;
      fromEmailAddress = null;
      platformNameForEmail = null;
      emailLogoImageUrlForEmail = undefined;
      return false;
    }
  } catch (error) {
    console.error("Resend client initialization EXCEPTION:", error);
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
  htmlBody: string;
  textBody?: string;
}

export async function sendTransactionalEmail(
  { to, subject, htmlBody, textBody }: SendEmailParams
): Promise<EmailServiceResult> {
  const isClientInitialized = await initializeResendClient();

  if (!isClientInitialized || !resend || !fromEmailAddress || !platformNameForEmail) {
    const errorMsg = "Resend client is not properly initialized or essential settings (API Key, From Email, Platform Name) are missing. Email sending aborted. Please check admin settings and server logs.";
    console.error(`sendTransactionalEmail: ${errorMsg}`);
    return {
      success: false,
      message: "Failed to send email: Email service not correctly configured.",
      error: errorMsg,
    };
  }

  // Defensive check for htmlBody
  if (!htmlBody || typeof htmlBody !== 'string' || htmlBody.trim() === '' || htmlBody.trim().toLowerCase().startsWith("<!doctype")) {
    const bodyIssueMsg = `sendTransactionalEmail: HTML body is empty, invalid, or only a DOCTYPE. This indicates a problem with email template generation. HTML received: "${htmlBody ? htmlBody.substring(0,100) + '...' : 'NULL or EMPTY'}"`;
    console.error(bodyIssueMsg);
    return { 
        success: false, 
        message: "Failed to send email: Email content generation failed.",
        error: bodyIssueMsg 
    };
  }
  
  console.log("sendTransactionalEmail: Valid HTML body received (first 100 chars):", htmlBody.substring(0, 100));

  const formattedFrom = `${platformNameForEmail} <${fromEmailAddress}>`;
  console.log(`sendTransactionalEmail: Constructed 'From' field for Resend: ${formattedFrom}`);

  try {
    console.log(`sendTransactionalEmail: Attempting to send email via Resend: To: ${to}, Subject: "${subject}", From: ${formattedFrom}`);
    const { data, error } = await resend.emails.send({
      from: formattedFrom,
      to: [to],
      subject: subject,
      html: htmlBody,
      text: textBody || subject,
    });

    if (error) {
      console.error(`sendTransactionalEmail: Resend API Error: Name: ${error.name}, Message: ${error.message}. Full Error:`, JSON.stringify(error));
      return {
        success: false,
        message: `Failed to send email via Resend API: ${error.name} - ${error.message}`,
        error: JSON.stringify(error),
      };
    }

    console.log("sendTransactionalEmail: Email sent successfully via Resend. ID:", data?.id);
    return {
      success: true,
      message: "Email sent successfully.",
    };
  } catch (exception: any) {
    console.error("sendTransactionalEmail: Exception during resend.emails.send():", exception);
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
): Promise<{ subject: string; html: string | null }> {
  
  // Ensure client is initialized to fetch platformName and emailLogoImageUrl for the template
  if (!resendInitialized) {
    console.log("getEmailTemplateAndSubject: Resend client not initialized, attempting initialization for template data...");
    await initializeResendClient();
  }
  
  const currentPlatformName = platformNameForEmail || "Wohana Funds"; // Fallback
  const currentEmailLogoUrl = emailLogoImageUrlForEmail; // Use the fetched one

  const templatePayload = {
    ...payload,
    bankName: currentPlatformName,
    emailLogoImageUrl: currentEmailLogoUrl, // Pass the potentially undefined URL
  };
  console.log("getEmailTemplateAndSubject: Payload for template function:", templatePayload);


  let htmlContent: string | null = null;
  let emailSubject = `Notification from ${currentPlatformName}`;

  try {
    switch (emailType) {
      case "WELCOME":
        emailSubject = `Welcome to ${currentPlatformName}!`;
        htmlContent = emailTemplates.welcomeEmailTemplate(templatePayload);
        break;
      // Add cases for other email types here
      // case "PASSWORD_RESET":
      //   subject = `Reset Your ${currentPlatformName} Password`;
      //   htmlContent = emailTemplates.passwordResetEmailTemplate({
      //     ...templatePayload, // spread common fields
      //     resetLink: templatePayload.resetLink || '#', // ensure specific fields are present
      //   });
      //   break;
      default:
        console.warn(`getEmailTemplateAndSubject: No specific HTML template defined for email type: ${emailType}. Using basic fallback.`);
        htmlContent = `<p>This is a generic notification from ${currentPlatformName}.</p>`;
    }
  } catch (templateError: any) {
    console.error(`getEmailTemplateAndSubject: Error generating HTML for email type ${emailType}:`, templateError.message, templateError);
    htmlContent = `<p>Error generating email content. Please contact support. Type: ${emailType}</p>`; // Error content
    emailSubject = `Important Notification from ${currentPlatformName}`;
  }
  
  console.log(`getEmailTemplateAndSubject: Generated HTML Content for type "${emailType}" (start):`, htmlContent ? htmlContent.substring(0, 200) + "..." : "HTML content is null/empty");

  return {
    subject: emailSubject,
    html: htmlContent,
  };
}

    