
// src/lib/email-templates.tsx
import * as React from 'react';

interface EmailTemplateProps {
  fullName?: string;
  bankName?: string;
  emailLogoImageUrl?: string;
  loginUrl?: string;
  accountNumber?: string;
  kycSubmissionDate?: string;
  kycRejectionReason?: string;
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


function getLogoDisplay(bankName: string = "Wohana Funds", emailLogoImageUrl?: string): string {
  return emailLogoImageUrl
    ? `<img src="${emailLogoImageUrl}" alt="${bankName} Logo" style="max-height:50px; margin-bottom:10px; border:0;" />`
    : `<span style="font-size:24px; font-weight:bold; color:#002147; line-height:1.2;">${bankName}</span>`;
}

function getFooter(bankName: string = "Wohana Funds"): string {
  return `
    <div style="${footerStyle}">
      <p>&copy; ${new Date().getFullYear()} ${bankName}. All rights reserved.</p>
      <p>123 Wohana Street, Finance City, FC 12345</p>
      <p>If you have questions, contact support at <a href="mailto:support@${bankName.toLowerCase().replace(/\s+/g, '')}.com" style="${footerLinkStyle}">support@${bankName.toLowerCase().replace(/\s+/g, '')}.com</a>.</p>
    </div>
  `;
}

export function welcomeEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Wohana Funds",
  emailLogoImageUrl,
  accountNumber = "N/A",
  loginUrl = "#",
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName);

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
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName);
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
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName);

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
}: EmailTemplateProps): string {
  const logoDisplay = getLogoDisplay(bankName, emailLogoImageUrl);
  const footerHtml = getFooter(bankName);

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
