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
    console.log("Resend client already initialized and essential settings are present.");
    return true;
  }

  console.log("Attempting to initialize Resend client...");
  try {
    const settingsResult = await getPlatformSettingsAction();

    if (settingsResult.success && settingsResult.settings) {
      const apiKey = settingsResult.settings.resendApiKey;
      const fromEmail = settingsResult.settings.resendFromEmail;
      const pName = settingsResult.settings.platformName;
      emailLogoImageUrlForEmail = settingsResult.settings.emailLogoImageUrl; // Capture this for use in templates

      if (!apiKey) {
        console.error("Resend client initialization FAILED: Resend API Key is MISSING from settings.");
        resendInitialized = false; resend = null; fromEmailAddress = null; platformNameForEmail = pName || "Wohana Funds";
        return false;
      }
      if (!fromEmail) {
        console.error("Resend client initialization FAILED: Resend From Email is MISSING from settings.");
        resendInitialized = false; resend = null; fromEmailAddress = null; platformNameForEmail = pName || "Wohana Funds";
        return false;
      }
      if (!pName) {
        console.warn("Resend client initialization WARNING: Platform Name is MISSING from settings. Using default 'Wohana Funds' for email display name.");
        platformNameForEmail = "Wohana Funds";
      } else {
        platformNameForEmail = pName;
      }

      resend = new Resend(apiKey);
      fromEmailAddress = fromEmail;
      resendInitialized = true;
      console.log(`Resend client initialized successfully. From Email: ${fromEmailAddress}, Platform Name: ${platformNameForEmail}, Email Logo: ${emailLogoImageUrlForEmail || 'Not set'}`);
      return true;

    } else {
      console.error("Resend client initialization FAILED: Could not retrieve platform settings.", settingsResult.error);
      resendInitialized = false; resend = null; fromEmailAddress = null; platformNameForEmail = "Wohana Funds"; emailLogoImageUrlForEmail = undefined;
      return false;
    }
  } catch (error) {
    console.error("Resend client initialization EXCEPTION:", error);
    resendInitialized = false; resend = null; fromEmailAddress = null; platformNameForEmail = "Wohana Funds"; emailLogoImageUrlForEmail = undefined;
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
  console.log("sendTransactionalEmail: Called.");
  const isClientInitialized = await initializeResendClient();

  if (!isClientInitialized || !resend || !fromEmailAddress || !platformNameForEmail) {
    const errorMsg = "Resend client is not properly initialized or essential settings (API Key, From Email, Platform Name) are missing. Email sending aborted. Please check admin settings and server logs.";
    console.error(`sendTransactionalEmail: Initialization check failed: ${errorMsg}`);
    return {
      success: false,
      message: "Failed to send email: Email service not correctly configured.",
      error: errorMsg,
    };
  }
  
  console.log(`sendTransactionalEmail: Client initialized. From: ${fromEmailAddress}, Platform Name: ${platformNameForEmail}`);

  // Check if htmlBody is just DOCTYPE or empty
  if (!htmlBody || typeof htmlBody !== 'string' || htmlBody.trim() === '' || htmlBody.trim().toLowerCase().startsWith("<!doctype html public")) {
    const bodyIssueMsg = `sendTransactionalEmail: CRITICAL - HTML body is empty, invalid, or only a DOCTYPE. This indicates a problem with email template generation. HTML received (first 100 chars): "${htmlBody ? htmlBody.substring(0,100) + '...' : 'NULL or EMPTY'}"`;
    console.error(bodyIssueMsg);
    return { 
        success: false, 
        message: "Failed to send email: Email content generation failed (HTML body was empty or invalid).",
        error: bodyIssueMsg 
    };
  }
  
  console.log("sendTransactionalEmail: Valid HTML body received (first 200 chars):", htmlBody.substring(0, 200) + "...");

  const formattedFrom = `${platformNameForEmail} <${fromEmailAddress}>`;
  console.log(`sendTransactionalEmail: Constructed 'From' field for Resend: ${formattedFrom}`);

  const emailPayloadToResend = {
      from: formattedFrom,
      to: [to],
      subject: subject,
      html: htmlBody,
      text: textBody || subject, // Fallback text body
  };

  console.log("sendTransactionalEmail: Payload being sent to Resend (HTML/Text truncated):", JSON.stringify(emailPayloadToResend, (key, value) => (key === 'html' || key === 'text') && typeof value === 'string' ? value.substring(0, 100) + '...' : value));


  try {
    console.log(`sendTransactionalEmail: Attempting to send email via Resend: To: ${to}, Subject: "${subject}", From: ${formattedFrom}`);
    const { data, error } = await resend.emails.send(emailPayloadToResend);

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
    console.error("sendTransactionalEmail: Exception during resend.emails.send():", JSON.stringify(exception, Object.getOwnPropertyNames(exception)));
    return {
      success: false,
      message: `An unexpected error occurred while sending email: ${exception.message || 'Unknown exception'}`,
      error: JSON.stringify(exception, Object.getOwnPropertyNames(exception)),
    };
  }
}

export async function getEmailTemplateAndSubject(
  emailType: string, // Changed from EmailType to string
  payload: EmailServiceDataPayload
): Promise<{ subject: string; html: string | null }> {
  
  console.log(`getEmailTemplateAndSubject: Called with emailType: "${emailType}"`);

  if (!resendInitialized) {
    console.log("getEmailTemplateAndSubject: Resend client not initialized, attempting initialization for template data...");
    await initializeResendClient(); // Ensures platformNameForEmail and emailLogoImageUrlForEmail are populated
  }
  
  // Use the globally available platformNameForEmail and emailLogoImageUrlForEmail
  // These are set by initializeResendClient
  const currentPlatformName = platformNameForEmail || "Wohana Funds"; // Fallback if still not set
  const currentEmailLogoUrl = emailLogoImageUrlForEmail; // This can be undefined if not set

  // Ensure essential fields for templates are passed along with any type-specific payload
  const templatePayload = {
    ...payload,
    bankName: currentPlatformName,
    emailLogoImageUrl: currentEmailLogoUrl, // Pass the potentially undefined logo URL
  };
  console.log("getEmailTemplateAndSubject: Payload for template function:", templatePayload);


  let htmlContent: string | null = null;
  let emailSubject = `Notification from ${currentPlatformName}`; // Default subject

  try {
    switch (emailType) { // Use string literals for cases
      case "WELCOME":
        emailSubject = `Welcome to ${currentPlatformName}!`;
        htmlContent = emailTemplates.welcomeEmailTemplate(templatePayload);
        break;
      case "KYC_SUBMITTED":
        emailSubject = `KYC Submission Received - ${currentPlatformName}`;
        htmlContent = emailTemplates.kycSubmittedEmailTemplate(templatePayload);
        break;
      case "KYC_APPROVED":
        emailSubject = `KYC Approved! - ${currentPlatformName}`;
        htmlContent = emailTemplates.kycApprovedEmailTemplate(templatePayload);
        break;
      case "KYC_REJECTED":
        emailSubject = `KYC Submission Update - ${currentPlatformName}`;
        htmlContent = emailTemplates.kycRejectedEmailTemplate(templatePayload);
        break;
      case "ADMIN_KYC_SUBMITTED":
        emailSubject = `New KYC Submission Requires Review - ${currentPlatformName}`;
        htmlContent = emailTemplates.adminKycSubmittedEmailTemplate(templatePayload);
        break;
      case "DEBIT_NOTIFICATION":
        emailSubject = `Debit Transaction Alert - ${currentPlatformName}`;
        htmlContent = emailTemplates.debitNotificationEmailTemplate(templatePayload);
        break;
      case "CREDIT_NOTIFICATION":
        emailSubject = `Credit Transaction Alert - ${currentPlatformName}`;
        htmlContent = emailTemplates.creditNotificationEmailTemplate(templatePayload);
        break;
      // Add other cases as needed
      default:
        console.warn(`getEmailTemplateAndSubject: No specific HTML template defined for email type: ${emailType}. Using basic fallback.`);
        htmlContent = `<p>This is a generic notification from ${currentPlatformName}.</p><p>Details: ${JSON.stringify(payload)}</p>`;
    }
  } catch (templateError: any) {
    console.error(`getEmailTemplateAndSubject: Error generating HTML for email type ${emailType}:`, templateError.message, JSON.stringify(templateError, Object.getOwnPropertyNames(templateError)));
    htmlContent = `<p>Error generating email content. Please contact support. Type: ${emailType}</p>`; // Error content
    emailSubject = `Important Notification from ${currentPlatformName}`; // More generic subject on error
  }
  
  const generatedHtmlSnippet = htmlContent ? htmlContent.substring(0, 200) + "..." : "HTML content is null/empty";
  console.log(`getEmailTemplateAndSubject: Generated HTML Content for type "${emailType}" (first 200 chars):`, generatedHtmlSnippet);

  return {
    subject: emailSubject,
    html: htmlContent,
  };
}

// Removed the old React-based getEmailTemplateAndSubject function if it was still here.
// Ensure this file only exports the string-based one.
