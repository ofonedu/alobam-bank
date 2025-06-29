
// src/lib/email-templates.tsx
import * as React from 'react';
import { formatCurrency } from './utils'; // Assuming you have this utility

interface EmailTemplateProps {
  fullName?: string;
  bankName?: string;
  emailLogoImageUrl?: string;
  loginUrl?: string;
  accountNumber?: string;
  // KYC Specific
  kycSubmissionDate?: string;
  kycRejectionReason?: string;
  // For Admin KYC Notification
  adminReviewUrl?: string;
  userId?: string;
  // Transaction Specific
  transactionAmount?: string; // Formatted amount with currency
  transactionType?: string;
  transactionDate?: string;
  transactionTime?: string;
  transactionId?: string;
  transactionDescription?: string;
  recipientName?: string;
  currentBalance?: string; // Formatted new balance with currency
  // Password Changed Specific
  passwordChangedDate?: string;
  supportEmail?: string;
  // OTP Specific
  otp?: string;
  // Account Suspension
  suspensionReason?: string; 
}

// Common styles
const bodyStyle = "font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;";
const containerStyle = "max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);";
const headerStyle = "text-align: center; padding-bottom: 25px; border-bottom: 1px solid #e0e0e0; margin-bottom: 25px;";
const contentStyle = "font-size: 16px;";
const pStyle = "margin: 0 0 15px 0;";
const strongStyle = "color: #002147;"; // Wohana Deep Blue
const buttonContainerStyle = "text-align: center; margin: 25px 0;";
const buttonStyle = "display: inline-block; padding: 12px 25px; background-color: #FFD700; color: #002147; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; border:none; cursor: pointer;"; // Wohana Gold and Deep Blue
const footerStyle = "text-align: center; padding-top: 25px; border-top: 1px solid #e0e0e0; margin-top: 25px; font-size: 12px; color: #888888;";
const footerLinkStyle = "color: #0056b3; text-decoration: underline;";
const capitalizeStyle = "text-transform: capitalize;";
const otpCodeStyle = "font-size: 24px; font-weight: bold; color: #002147; letter-spacing: 2px; margin: 10px 0; padding: 10px; background-color: #f0f0f0; border-radius: 5px; display: inline-block;";


function getLogoDisplay(bankName: string = "Wohana Funds", emailLogoImageUrl?: string): string {
  if (emailLogoImageUrl) {
    return `<img src="${emailLogoImageUrl}" alt="${bankName} Logo" style="max-height:50px; margin-bottom:10px; border:0;" />`;
  }
  // Fallback to text if no image URL
  const firstChar = bankName ? bankName.charAt(0).toUpperCase() : "WF";
  return `<div style="width:50px; height:50px; line-height:50px; text-align:center; background-color:#002147; color:#FFD700; font-size:24px; font-weight:bold; border-radius:50%; margin:0 auto 10px auto;">${firstChar}</div><span style="font-size:24px;font-weight:bold;color:#002147;line-height:1.2;">${bankName}</span>`;
}

function getFooter(bankName: string = "Wohana Funds", supportEmail?: string): string {
  const effectiveSupportEmail = supportEmail || `support@${bankName.toLowerCase().replace(/\s+/g, '')}.com`;
  return `
    <div style="${footerStyle}">
      <p>&copy; ${new Date().getFullYear()} ${bankName}. All rights reserved.</p>
      <p>123 Wohana Street, Finance City, FC 12345</p>
      <p>If you have questions, contact support at <a href="mailto:${effectiveSupportEmail}" style="${footerLinkStyle}">${effectiveSupportEmail}</a>.</p>
    </div>
  `;
}

export function welcomeEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Wohana Funds",
  emailLogoImageUrl,
  accountNumber = "N/A",
  loginUrl = "#",
  supportEmail,
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName, supportEmail);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${bankName}</title>
</head>
<body style="${bodyStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      ${logoDisplay}
    </div>
    <div style="${contentStyle}">
      <p style="${pStyle} font-size:18px; font-weight:bold; color:#002147;">Welcome, <span style="${capitalizeStyle}">${fullName}</span>!</p>
      <p style="${pStyle}">We're excited to have you on board with <strong style="${strongStyle}">${bankName}</strong>.</p>
      <p style="${pStyle}">Your account has been successfully created. Your account number is <strong style="${strongStyle}">${accountNumber}</strong>.</p>
      <div style="${buttonContainerStyle}">
        <a href="${loginUrl}" style="${buttonStyle}">Log In to Your Account</a>
      </div>
      <p style="${pStyle}">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p style="${pStyle}">Thanks for choosing <strong style="${strongStyle}">${bankName}</strong>.</p>
      <p style="${pStyle}">Best regards,<br>The ${bankName} Team</p>
    </div>
    ${footerHtml}
  </div>
</body>
</html>
  `;
}

export function kycSubmittedEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Wohana Funds",
  emailLogoImageUrl,
  kycSubmissionDate,
  loginUrl = "#",
  supportEmail,
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName, supportEmail);
  const submissionDateDisplay = kycSubmissionDate ? new Date(kycSubmissionDate).toLocaleDateString() : "recently";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Submission Received - ${bankName}</title>
</head>
<body style="${bodyStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      ${logoDisplay}
    </div>
    <div style="${contentStyle}">
      <p style="${pStyle} font-size:18px; font-weight:bold; color:#002147;">Dear <span style="${capitalizeStyle}">${fullName}</span>,</p>
      <p style="${pStyle}">We have successfully received your KYC (Know Your Customer) documents submitted on <strong style="${strongStyle}">${submissionDateDisplay}</strong>.</p>
      <p style="${pStyle}">Your submission is now under review by our team. This process typically takes 1-3 business days. We will notify you via email as soon as your KYC status is updated.</p>
      <p style="${pStyle}">You can check your KYC status by logging into your account:</p>
      <div style="${buttonContainerStyle}">
        <a href="${loginUrl}" style="${buttonStyle}">View KYC Status</a>
      </div>
      <p style="${pStyle}">Thank you for your cooperation in helping us maintain a secure platform.</p>
      <p style="${pStyle}">Best regards,<br>The ${bankName} Team</p>
    </div>
    ${footerHtml}
  </div>
</body>
</html>
  `;
}

export function kycApprovedEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Wohana Funds",
  emailLogoImageUrl,
  loginUrl = "#",
  supportEmail,
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName, supportEmail);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Approved! - ${bankName}</title>
</head>
<body style="${bodyStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      ${logoDisplay}
    </div>
    <div style="${contentStyle}">
      <p style="${pStyle} font-size:18px; font-weight:bold; color:#002147;">Congratulations, <span style="${capitalizeStyle}">${fullName}</span>!</p>
      <p style="${pStyle}">Your KYC (Know Your Customer) verification has been <strong style="color:green;">APPROVED</strong>.</p>
      <p style="${pStyle}">You now have full access to all features and services offered by <strong style="${strongStyle}">${bankName}</strong>.</p>
      <p style="${pStyle}">Thank you for completing the verification process.</p>
      <div style="${buttonContainerStyle}">
        <a href="${loginUrl}" style="${buttonStyle}">Access Your Account</a>
      </div>
      <p style="${pStyle}">Best regards,<br>The ${bankName} Team</p>
    </div>
    ${footerHtml}
  </div>
</body>
</html>
  `;
}

export function kycRejectedEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Wohana Funds",
  emailLogoImageUrl,
  kycRejectionReason = "Please review your submission and ensure all information is accurate and documents are clear.",
  loginUrl = "#",
  supportEmail,
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName, supportEmail);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Submission Update - ${bankName}</title>
</head>
<body style="${bodyStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      ${logoDisplay}
    </div>
    <div style="${contentStyle}">
      <p style="${pStyle} font-size:18px; font-weight:bold; color:#002147;">Dear <span style="${capitalizeStyle}">${fullName}</span>,</p>
      <p style="${pStyle}">We have reviewed your KYC (Know Your Customer) submission and unfortunately, it could not be approved at this time. Your KYC status has been marked as <strong style="color:red;">REJECTED</strong>.</p>
      <p style="${pStyle}"><strong style="${strongStyle}">Reason for rejection:</strong> ${kycRejectionReason}</p>
      <p style="${pStyle}">Please review the feedback, make any necessary corrections, and resubmit your KYC information through your account dashboard.</p>
      <div style="${buttonContainerStyle}">
        <a href="${loginUrl}" style="${buttonStyle}">Resubmit KYC Information</a>
      </div>
      <p style="${pStyle}">If you have any questions or believe this is an error, please contact our support team.</p>
      <p style="${pStyle}">Best regards,<br>The ${bankName} Team</p>
    </div>
    ${footerHtml}
  </div>
</body>
</html>
  `;
}


export function adminKycSubmittedEmailTemplate({
  fullName = "N/A",
  userId = "N/A",
  bankName = "Wohana Funds",
  emailLogoImageUrl,
  kycSubmissionDate,
  adminReviewUrl = "#",
  supportEmail,
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName, supportEmail);
  const submissionDateDisplay = kycSubmissionDate ? new Date(kycSubmissionDate).toLocaleDateString() : "recently";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New KYC Submission - ${bankName} Admin</title>
</head>
<body style="${bodyStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      ${logoDisplay}
    </div>
    <div style="${contentStyle}">
      <p style="${pStyle} font-size:18px; font-weight:bold; color:#002147;">Admin Notification: New KYC Submission</p>
      <p style="${pStyle}">A new KYC submission has been received and requires your review.</p>
      <p style="${pStyle}"><strong style="${strongStyle}">User Name:</strong> <span style="${capitalizeStyle}">${fullName}</span></p>
      <p style="${pStyle}"><strong style="${strongStyle}">User ID:</strong> ${userId}</p>
      <p style="${pStyle}"><strong style="${strongStyle}">Submission Date:</strong> ${submissionDateDisplay}</p>
      <div style="${buttonContainerStyle}">
        <a href="${adminReviewUrl}" style="${buttonStyle}">Review Submission</a>
      </div>
      <p style="${pStyle}">Please log in to the admin panel to review the details and take appropriate action.</p>
      <p style="${pStyle}">Thank you,<br>The ${bankName} System</p>
    </div>
    ${footerHtml}
  </div>
</body>
</html>
  `;
}

export function debitNotificationEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Wohana Funds",
  emailLogoImageUrl,
  transactionAmount,
  transactionType,
  transactionDate,
  transactionId,
  transactionDescription,
  recipientName,
  currentBalance,
  loginUrl = "#",
  supportEmail,
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName, supportEmail);
  const dateDisplay = transactionDate ? new Date(transactionDate).toLocaleString() : "Recently";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debit Notification - ${bankName}</title>
</head>
<body style="${bodyStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      ${logoDisplay}
    </div>
    <div style="${contentStyle}">
      <p style="${pStyle} font-size:18px; font-weight:bold; color:#002147;">Debit Transaction Alert</p>
      <p style="${pStyle}">Dear <span style="${capitalizeStyle}">${fullName}</span>,</p>
      <p style="${pStyle}">This email confirms that a debit transaction has occurred on your account:</p>
      <ul style="list-style-type: none; padding-left: 0;">
        <li style="${pStyle}"><strong style="${strongStyle}">Amount:</strong> <span style="color: #D32F2F; font-weight:bold;">${transactionAmount || 'N/A'}</span></li>
        <li style="${pStyle}"><strong style="${strongStyle}">Type:</strong> ${transactionType || 'N/A'}</li>
        <li style="${pStyle}"><strong style="${strongStyle}">Date:</strong> ${dateDisplay}</li>
        ${transactionDescription ? `<li style="${pStyle}"><strong style="${strongStyle}">Description:</strong> ${transactionDescription}</li>` : ''}
        ${recipientName ? `<li style="${pStyle}"><strong style="${strongStyle}">Recipient:</strong> ${recipientName}</li>` : ''}
        <li style="${pStyle}"><strong style="${strongStyle}">Transaction ID:</strong> ${transactionId || 'N/A'}</li>
      </ul>
      <p style="${pStyle}">Your new account balance is <strong style="${strongStyle}">${currentBalance || 'N/A'}</strong>.</p>
      <p style="${pStyle}">If you did not authorize this transaction, please contact our support team immediately.</p>
      <div style="${buttonContainerStyle}">
        <a href="${loginUrl}" style="${buttonStyle}">View Account Activity</a>
      </div>
      <p style="${pStyle}">Best regards,<br>The ${bankName} Team</p>
    </div>
    ${footerHtml}
  </div>
</body>
</html>
  `;
}

export function creditNotificationEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Wohana Funds",
  emailLogoImageUrl,
  transactionAmount,
  transactionType,
  transactionDate,
  transactionId,
  transactionDescription,
  currentBalance,
  loginUrl = "#",
  supportEmail,
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName, supportEmail);
  const dateDisplay = transactionDate ? new Date(transactionDate).toLocaleString() : "Recently";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credit Notification - ${bankName}</title>
</head>
<body style="${bodyStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      ${logoDisplay}
    </div>
    <div style="${contentStyle}">
      <p style="${pStyle} font-size:18px; font-weight:bold; color:#002147;">Credit Transaction Alert</p>
      <p style="${pStyle}">Dear <span style="${capitalizeStyle}">${fullName}</span>,</p>
      <p style="${pStyle}">This email confirms that a credit transaction has occurred on your account:</p>
      <ul style="list-style-type: none; padding-left: 0;">
        <li style="${pStyle}"><strong style="${strongStyle}">Amount:</strong> <span style="color: #388E3C; font-weight:bold;">${transactionAmount || 'N/A'}</span></li>
        <li style="${pStyle}"><strong style="${strongStyle}">Type:</strong> ${transactionType || 'N/A'}</li>
        <li style="${pStyle}"><strong style="${strongStyle}">Date:</strong> ${dateDisplay}</li>
        ${transactionDescription ? `<li style="${pStyle}"><strong style="${strongStyle}">Description:</strong> ${transactionDescription}</li>` : ''}
        <li style="${pStyle}"><strong style="${strongStyle}">Transaction ID:</strong> ${transactionId || 'N/A'}</li>
      </ul>
      <p style="${pStyle}">Your new account balance is <strong style="${strongStyle}">${currentBalance || 'N/A'}</strong>.</p>
      <div style="${buttonContainerStyle}">
        <a href="${loginUrl}" style="${buttonStyle}">View Account Activity</a>
      </div>
      <p style="${pStyle}">Best regards,<br>The ${bankName} Team</p>
    </div>
    ${footerHtml}
  </div>
</body>
</html>
  `;
}

export function passwordChangedEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Wohana Funds",
  emailLogoImageUrl,
  passwordChangedDate,
  loginUrl = "#",
  supportEmail,
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName, supportEmail);
  const dateDisplay = passwordChangedDate ? new Date(passwordChangedDate).toLocaleString() : "Recently";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully - ${bankName}</title>
</head>
<body style="${bodyStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      ${logoDisplay}
    </div>
    <div style="${contentStyle}">
      <p style="${pStyle} font-size:18px; font-weight:bold; color:#002147;">Password Change Confirmation</p>
      <p style="${pStyle}">Dear <span style="${capitalizeStyle}">${fullName}</span>,</p>
      <p style="${pStyle}">This email confirms that the password for your <strong style="${strongStyle}">${bankName}</strong> account was successfully changed on <strong style="${strongStyle}">${dateDisplay}</strong>.</p>
      <p style="${pStyle}">If you did not make this change, please contact our support team immediately at <a href="mailto:${supportEmail || 'support@example.com'}" style="${footerLinkStyle}">${supportEmail || 'support@example.com'}</a> or by replying to this email.</p>
      <p style="${pStyle}">If you made this change, no further action is required.</p>
      <div style="${buttonContainerStyle}">
        <a href="${loginUrl}" style="${buttonStyle}">Log In to Your Account</a>
      </div>
      <p style="${pStyle}">Best regards,<br>The ${bankName} Team</p>
    </div>
    ${footerHtml}
  </div>
</body>
</html>
  `;
}

export function otpEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Wohana Funds",
  emailLogoImageUrl,
  otp,
  supportEmail,
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName, supportEmail);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your One-Time Password (OTP) - ${bankName}</title>
</head>
<body style="${bodyStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      ${logoDisplay}
    </div>
    <div style="${contentStyle}">
      <p style="${pStyle} font-size:18px; font-weight:bold; color:#002147;">One-Time Password (OTP) Verification</p>
      <p style="${pStyle}">Dear <span style="${capitalizeStyle}">${fullName}</span>,</p>
      <p style="${pStyle}">Your One-Time Password (OTP) for completing your transaction/action with <strong style="${strongStyle}">${bankName}</strong> is:</p>
      <div style="text-align:center; margin: 20px 0;">
        <span style="${otpCodeStyle}">${otp || "N/A"}</span>
      </div>
      <p style="${pStyle}">This OTP is valid for a short period (typically 5-10 minutes). Please do not share this code with anyone.</p>
      <p style="${pStyle}">If you did not request this OTP, please contact our support team immediately at <a href="mailto:${supportEmail || 'support@example.com'}" style="${footerLinkStyle}">${supportEmail || 'support@example.com'}</a>.</p>
      <p style="${pStyle}">Best regards,<br>The ${bankName} Team</p>
    </div>
    ${footerHtml}
  </div>
</body>
</html>
  `;
}

export function accountSuspendedEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Wohana Funds",
  emailLogoImageUrl,
  suspensionReason, // Optional: specific reason for suspension
  supportEmail,
  loginUrl = "#", // Link to login page or support page
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName, supportEmail);
  const effectiveSupportEmail = supportEmail || `support@${bankName.toLowerCase().replace(/\s+/g, '')}.com`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Important: Your Account Has Been Suspended - ${bankName}</title>
</head>
<body style="${bodyStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      ${logoDisplay}
    </div>
    <div style="${contentStyle}">
      <p style="${pStyle} font-size:18px; font-weight:bold; color:#D32F2F;">Account Suspension Notice</p>
      <p style="${pStyle}">Dear <span style="${capitalizeStyle}">${fullName}</span>,</p>
      <p style="${pStyle}">We are writing to inform you that your account with <strong style="${strongStyle}">${bankName}</strong> has been temporarily suspended.</p>
      ${suspensionReason ? `<p style="${pStyle}">Reason for suspension: ${suspensionReason}</p>` : ''}
      <p style="${pStyle}">During this suspension, your access to certain services may be restricted. We understand this may cause inconvenience and we appreciate your understanding.</p>
      <p style="${pStyle}">To learn more about this suspension or to seek resolution, please contact our support team immediately at <a href="mailto:${effectiveSupportEmail}" style="${footerLinkStyle}">${effectiveSupportEmail}</a>.</p>
      <p style="${pStyle}">You may still be able to log in to view your account status or basic information:</p>
      <div style="${buttonContainerStyle}">
        <a href="${loginUrl}" style="${buttonStyle}">Log In to Your Account</a>
      </div>
      <p style="${pStyle}">We are committed to resolving this matter with you. Please reach out to our support team at your earliest convenience.</p>
      <p style="${pStyle}">Sincerely,<br>The ${bankName} Team</p>
    </div>
    ${footerHtml}
  </div>
</body>
</html>
  `;
}

    