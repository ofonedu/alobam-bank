
// src/lib/email-templates.tsx
import * as React from 'react';

interface WelcomeEmailTemplateProps {
  fullName?: string;
  bankName?: string;
  emailLogoImageUrl?: string; // Changed from iconChar
  accountNumber?: string;
  loginUrl?: string;
}

export function welcomeEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Wohana Funds", // Defaulted bank name
  emailLogoImageUrl,
  accountNumber = "N/A",
  loginUrl = "#", // Default login URL
}: WelcomeEmailTemplateProps): string {
  
  // Determine logo display: image if URL is provided, otherwise text
  const logoDisplay = emailLogoImageUrl
    ? `<img src="${emailLogoImageUrl}" alt="${bankName} Logo" style="max-height:50px; margin-bottom:10px; border:0;" />`
    : `<span style="font-size:24px; font-weight:bold; color:#002147; line-height:1.2;">${bankName}</span>`;

  // Inline styles for maximum email client compatibility
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
    <div style="${footerStyle}">
      <p>&copy; ${new Date().getFullYear()} ${bankName}. All rights reserved.</p>
      <p>123 Wohana Street, Finance City, FC 12345</p>
      <p>If you have questions, contact support at <a href="mailto:support@${bankName.toLowerCase().replace(/\s+/g, '')}.com" style="${footerLinkStyle}">support@${bankName.toLowerCase().replace(/\s+/g, '')}.com</a>.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// You can add more email template functions here.
// For example:
// export function passwordResetEmailTemplate({ userName, resetLink, bankName, emailLogoImageUrl }) { ... }

    