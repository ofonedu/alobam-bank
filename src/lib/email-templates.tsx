
// src/lib/email-templates.tsx
import * as React from 'react';

interface WelcomeEmailTemplateProps {
  fullName?: string;
  bankName?: string;
  emailLogoImageUrl?: string;
  accountNumber?: string;
  loginUrl?: string;
}

export function welcomeEmailTemplate({
  fullName = "Valued Customer",
  bankName = "Our Bank",
  emailLogoImageUrl,
  accountNumber = "N/A",
  loginUrl = "#",
}: WelcomeEmailTemplateProps): string {
  const logoDisplay = emailLogoImageUrl
    ? `<img src="${emailLogoImageUrl}" alt="${bankName} Logo" style="max-height:50px;margin-bottom:10px;" />`
    : `<span style="font-size:24px;font-weight:bold;color:#1a1a1a;">${bankName}</span>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${bankName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .email-header { text-align: center; padding-bottom: 25px; border-bottom: 1px solid #e0e0e0; margin-bottom: 25px; }
        .email-header-logo { margin-bottom: 10px; }
        .email-content { font-size: 16px; }
        .email-content p { margin: 0 0 15px 0; }
        .email-content strong { color: #002147; }
        .email-button-container { text-align: center; margin: 25px 0; }
        .email-button { display: inline-block; padding: 12px 25px; background-color: #FFD700; color: #002147; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; border: none; cursor: pointer; }
        .email-footer { text-align: center; padding-top: 25px; border-top: 1px solid #e0e0e0; margin-top: 25px; font-size: 12px; color: #888888; }
        .email-footer a { color: #0056b3; text-decoration: underline; }
        .capitalize { text-transform: capitalize; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="email-header-logo">${logoDisplay}</div>
        </div>
        <div class="email-content">
          <p style="font-size:18px;font-weight:bold;color:#002147;">Welcome, <span class="capitalize">${fullName}</span>!</p>
          <p>We're excited to have you on board with <strong>${bankName}</strong>.</p>
          <p>Your account has been successfully created. Your account number is <strong>${accountNumber}</strong>.</p>
          <div class="email-button-container">
            <a href="${loginUrl}" class="email-button">Log In to Your Account</a>
          </div>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Thanks for choosing <strong>${bankName}</strong>.</p>
          <p>Best regards,<br>The ${bankName} Team</p>
        </div>
        <div class="email-footer">
          <p>&copy; ${new Date().getFullYear()} ${bankName}. All rights reserved.</p>
          <p>123 Wohana Street, Finance City, FC 12345</p>
          <p>If you have questions, contact support at <a href="mailto:support@${bankName.toLowerCase().replace(/\s+/g, '')}.com">support@${bankName.toLowerCase().replace(/\s+/g, '')}.com</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// You can add more email template functions here.
// For example:
// export function passwordResetEmailTemplate({ userName, resetLink, bankName, emailLogoImageUrl }) { ... }
