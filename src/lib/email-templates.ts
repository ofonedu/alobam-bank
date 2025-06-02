// src/lib/email-service.ts
"use server";

import { Resend } from 'resend';
import type { EmailType, EmailServiceDataPayload, EmailServiceResult, PlatformSettings } from '@/types';
import { getPlatformSettingsAction } from './actions/admin-settings-actions';
import * as emailTemplates from './email-templates'; // Import all templates

// Placeholder for a more robust configuration loading mechanism
let resend: Resend | null = null;
let fromEmailAddress: string | null = null;

async function initializeResendClient(): Promise<boolean> {
  if (resend && fromEmailAddress) {
    return true; // Already initialized
  }
  try {
    const settingsResult = await getPlatformSettingsAction();
    if (settingsResult.success && settingsResult.settings?.resendApiKey && settingsResult.settings?.resendFromEmail) {
      resend = new Resend(settingsResult.settings.resendApiKey);
      fromEmailAddress = settingsResult.settings.resendFromEmail;
      console.log("Resend client initialized successfully.");
      return true;
    } else {
      console.error("Failed to initialize Resend client: API key or From Email missing in platform settings.", settingsResult.error);
      resend = null;
      fromEmailAddress = null;
      return false;
    }
  } catch (error) {
    console.error("Error initializing Resend client from platform settings:", error);
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
    const errorMsg = "Resend client is not initialized. Check API key and From Email in admin settings.";
    console.error(`sendTransactionalEmail: ${errorMsg}`);
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
      to: [to], // Resend expects an array of strings for 'to'
      subject: subject,
      react: reactElement,
    });

    if (error) {
      console.error(`Resend API Error: ${error.name} - ${error.message}`, error);
      return {
        success: false,
        message: `Failed to send email: ${error.message}`,
        error: JSON.stringify(error),
      };
    }

    console.log("Email sent successfully via Resend. ID:", data?.id);
    return {
      success: true,
      message: "Email sent successfully.",
    };
  } catch (exception: any) {
    console.error("Exception during email sending:", exception);
    return {
      success: false,
      message: `An unexpected error occurred: ${exception.message || 'Unknown error'}`,
      error: JSON.stringify(exception),
    };
  }
}

// Helper function to select template and subject based on EmailType
// This would eventually be used by a Cloud Function or a more abstracted service
export async function getEmailTemplateAndSubject(
  emailType: EmailType,
  payload: EmailServiceDataPayload
): Promise<{ subject: string; template: React.ReactElement | null }> {
  const platformName = "Wohana Funds"; // Or fetch from settings

  switch (emailType) {
    case EmailType.WELCOME:
      return {
        subject: `Welcome to ${platformName}!`,
        template: emailTemplates.WelcomeEmail({
          userName: payload.userName || "User",
          loginLink: payload.loginLink || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login`,
          platformName,
        }),
      };
    case EmailType.PASSWORD_RESET:
      return {
        subject: `Reset Your ${platformName} Password`,
        template: emailTemplates.PasswordResetEmail({
          userName: payload.userName || "User",
          resetLink: payload.resetLink || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=xyz`, // Placeholder token
          platformName,
        }),
      };
    // Add more cases for other email types later
    default:
      console.warn(`No template defined for email type: ${emailType}`);
      return { subject: "Notification", template: null };
  }
}