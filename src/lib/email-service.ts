
// src/lib/email-service.ts
"use server";

import type { UserProfile } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type EmailType =
  | "WELCOME_EMAIL"
  | "TRANSFER_SUCCESS"
  | "TRANSFER_FAILED"
  | "LOAN_APPROVED"
  | "LOAN_REJECTED"
  | "MANUAL_DEBIT_NOTIFICATION"
  | "MANUAL_CREDIT_NOTIFICATION"
  | "SUPPORT_REPLY" // Placeholder, not yet fully triggered
  | "SUSPICIOUS_TRANSACTION_FLAGGED" // Placeholder, not yet fully triggered
  | "KYC_APPROVED"
  | "KYC_REJECTED";

interface EmailDetails {
  recipientEmail: string;
  emailType: EmailType;
  data: Record<string, any>; // e.g., { firstName: "John", appName: "Wohana Funds" }
}

// Simple placeholder replacement for hardcoded strings
function renderTemplate(templateString: string, data: Record<string, any>): string {
  let rendered = templateString;
  for (const key in data) {
    const regex = new RegExp(`{{${key}}}`, "g");
    rendered = rendered.replace(regex, String(data[key] ?? '')); // Ensure data is stringified, fallback for undefined
  }
  return rendered;
}

export async function sendTransactionalEmail({
  recipientEmail,
  emailType,
  data,
}: EmailDetails): Promise<{ success: boolean; message: string }> {
  if (!recipientEmail) {
    console.warn("EmailService: No recipient email provided for type:", emailType);
    return { success: false, message: "No recipient email." };
  }

  let subject = `Notification from ${data.appName || 'Wohana Funds'}`;
  let body = `This is a notification regarding ${emailType}.\nDetails: ${JSON.stringify(data, null, 2)}`;
  const appName = data.appName || "Wohana Funds";

  switch (emailType) {
    case "WELCOME_EMAIL":
      subject = renderTemplate("Welcome to {{appName}}, {{firstName}}!", {...data, appName});
      body = renderTemplate(
`Hi {{firstName}},

Welcome to {{appName}} – your smart business banking platform.

To get started, please complete your KYC verification.
Access your dashboard here: {{loginLink}}

Need help? Our team is one click away.

Cheers,
The {{appName}} Team`, {...data, appName}
      );
      break;
    case "TRANSFER_SUCCESS":
      subject = renderTemplate("Transfer Successful - {{appName}}", {...data, appName});
      body = renderTemplate(
`Hi {{userName}},

Your transfer of {{currency}} {{amount}} to {{recipientName}} (Transaction ID: {{transactionId}}) was successful.
Your new approximate balance is {{currency}} {{newBalance}}.

Thank you for banking with {{appName}}.`, {...data, appName}
      );
      break;
    case "TRANSFER_FAILED":
       subject = renderTemplate("Transfer Failed - {{appName}}", {...data, appName});
       body = renderTemplate(
`Hi {{userName}},

Unfortunately, your transfer of {{currency}} {{amount}} to {{recipientName}} could not be processed.
Reason: {{reason}}

Please contact support if you need further assistance.

Regards,
The {{appName}} Team`, {...data, appName}
       );
      break;
    case "LOAN_APPROVED":
      subject = renderTemplate("Loan Application Approved - {{appName}}", {...data, appName});
      body = renderTemplate(
`Hi {{userName}},

Great news! Your loan application (ID: {{loanId}}) for {{currency}} {{loanAmount}} has been approved on {{approvalDate}}.
Funds will be disbursed shortly.

Regards,
The {{appName}} Team`, {...data, appName}
      );
      break;
    case "LOAN_REJECTED":
      subject = renderTemplate("Loan Application Update - {{appName}}", {...data, appName});
      body = renderTemplate(
`Hi {{userName}},

We regret to inform you that your loan application (ID: {{loanId}}) for {{currency}} {{loanAmount}} was not approved at this time.
If you have questions, please contact our support team.

Regards,
The {{appName}} Team`, {...data, appName}
      );
      break;
    case "MANUAL_DEBIT_NOTIFICATION":
      subject = renderTemplate("Account Debit Notification - {{appName}}", {...data, appName});
      body = renderTemplate(
`Hi {{userName}},

This email confirms a manual debit of {{currency}} {{amount}} from your account.
Reason: {{description}}
Transaction ID: {{transactionId}}
Your new balance is approximately: {{currency}} {{newBalance}}.

If you have any questions, please contact support.

Regards,
The {{appName}} Team`, {...data, appName}
      );
      break;
    case "MANUAL_CREDIT_NOTIFICATION":
       subject = renderTemplate("Account Credit Notification - {{appName}}", {...data, appName});
       body = renderTemplate(
`Hi {{userName}},

This email confirms a manual credit of {{currency}} {{amount}} to your account.
Reason: {{description}}
Transaction ID: {{transactionId}}
Your new balance is approximately: {{currency}} {{newBalance}}.

Regards,
The {{appName}} Team`, {...data, appName}
       );
      break;
    case "KYC_APPROVED":
      subject = renderTemplate("KYC Verification Successful - {{appName}}", {...data, appName});
      body = renderTemplate(
`Hi {{userName}},

Congratulations! Your KYC verification has been successfully approved.
You now have full access to all features on {{appName}}.

Regards,
The {{appName}} Team`, {...data, appName}
      );
      break;
    case "KYC_REJECTED":
      subject = renderTemplate("KYC Verification Update - {{appName}}", {...data, appName});
      body = renderTemplate(
`Hi {{userName}},

There was an issue with your recent KYC submission for {{appName}}.
Reason: {{rejectionReason}}

Please log in to your dashboard to review the details and resubmit if necessary, or contact support for assistance.

Regards,
The {{appName}} Team`, {...data, appName}
      );
      break;
    // Add more cases for other EmailTypes like SUPPORT_REPLY, SUSPICIOUS_TRANSACTION_FLAGGED
    // For now, they'll use the default generic message
  }

  console.log("--- Sending Transactional Email (Mock - Hardcoded Templates) ---");
  console.log("Recipient:", recipientEmail);
  console.log("Email Type:", emailType);
  console.log("Subject:", subject);
  console.log("Body:\n", body);
  console.log("-----------------------------------------------------------------");

  return { success: true, message: "Email processed by mock service using hardcoded templates." };
}

export async function getUserEmail(userId: string, firestoreDb: any): Promise<string | null> {
    if (!userId) return null;
    try {
        const userDocRef = doc(firestoreDb, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserProfile;
            return userData.email;
        }
        console.warn(`EmailService (getUserEmail): User document not found for UID: ${userId}`);
        return null;
    } catch (error) {
        console.error(`EmailService (getUserEmail): Error fetching user email for UID ${userId}:`, error);
        return null;
    }
}

    