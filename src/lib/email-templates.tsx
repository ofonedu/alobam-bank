
// src/lib/email-templates.tsx
import * as React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
  platformName: string;
  previewText?: string;
}

const EmailLayout: React.FC<EmailLayoutProps> = ({ children, platformName, previewText }) => {
  const bodyStyles: React.CSSProperties = {
    margin: 0,
    padding: 0,
    width: '100%',
    backgroundColor: '#f4f4f4',
    fontFamily: 'Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };
  const containerStyles: React.CSSProperties = {
    maxWidth: '600px',
    margin: '20px auto',
    backgroundColor: '#ffffff',
    padding: '30px', // Increased padding
    borderRadius: '10px', // Slightly larger radius
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)', // Softer shadow
  };
  const headerStyles: React.CSSProperties = {
    textAlign: 'center',
    paddingBottom: '25px', // Increased padding
    borderBottom: '1px solid #e0e0e0', // Lighter border
    marginBottom: '25px', // Added margin for spacing
  };
  const headerH1Styles: React.CSSProperties = {
    color: '#002147', 
    margin: 0,
    fontSize: '28px', // Larger font size
    fontWeight: 'bold',
  };
  const contentStyles: React.CSSProperties = {
    color: '#333333',
    lineHeight: 1.7, // Increased line height
    fontSize: '16px', // Slightly larger base font size
  };
  const pStyles: React.CSSProperties = {
    margin: '0 0 15px 0', // Increased bottom margin
  };
  const buttonContainerStyles: React.CSSProperties = {
    textAlign: 'center',
    margin: '25px 0', // Increased margin
  };
  const buttonStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: '12px 25px', // Increased padding
    backgroundColor: '#FFD700', 
    color: '#002147', 
    textDecoration: 'none',
    borderRadius: '6px', // Slightly larger radius
    fontWeight: 'bold',
    fontSize: '16px',
    border: 'none', // Ensure no default border
    cursor: 'pointer',
  };
  const footerStyles: React.CSSProperties = {
    textAlign: 'center',
    paddingTop: '25px', // Increased padding
    borderTop: '1px solid #e0e0e0', // Lighter border
    marginTop: '25px', // Added margin
    fontSize: '12px',
    color: '#888888', // Slightly lighter footer text
  };
  const linkStyles: React.CSSProperties = {
    color: '#0056b3', // A standard link blue
    textDecoration: 'underline',
  };


  // Resend expects the direct child to be the content it renders.
  // It wraps this in its own DOCTYPE, html, head, body.
  return (
    <div style={bodyStyles}>
      {previewText && (
        <div style={{ display: 'none', fontSize: '1px', color: '#ffffff', lineHeight: '1px', maxHeight: 0, maxWidth: 0, opacity: 0, overflow: 'hidden' }}>
          {previewText}
        </div>
      )}
      <div style={containerStyles}>
        <div style={headerStyles}>
          <h1 style={headerH1Styles}>{platformName}</h1>
        </div>
        <div style={contentStyles}>
          {children}
        </div>
        <div style={footerStyles}>
          <p style={pStyles}>&copy; {new Date().getFullYear()} {platformName}. All rights reserved.</p>
          <p style={pStyles}>123 Finance Street, Banking City, World.</p>
          <p style={pStyles}>
            If you have any questions, please contact our support team at <a href={`mailto:support@${platformName.toLowerCase().replace(/\s+/g, '')}.com`} style={linkStyles}>support@{(platformName.toLowerCase().replace(/\s+/g, ''))}.com</a>.
          </p>
          <p style={pStyles}>You are receiving this email because you signed up on {platformName}.</p>
        </div>
      </div>
    </div>
  );
};


interface WelcomeEmailProps {
  userName: string;
  loginLink: string;
  platformName: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ userName, loginLink, platformName }) => (
  <EmailLayout platformName={platformName} previewText={`Welcome to ${platformName}, ${userName}!`}>
    <p style={{fontSize: '18px', fontWeight: 'bold', color: '#002147' }}>Hello {userName},</p>
    <p>Welcome to {platformName}! We're thrilled to have you join our community.</p>
    <p>With {platformName}, you can manage your finances effectively, perform secure transactions, and access a world of financial tools designed to empower you.</p>
    <p>To get started, please log in to your account. We recommend completing your profile and KYC verification at your earliest convenience to unlock all features.</p>
    <div style={{textAlign: 'center', margin: '25px 0'}}>
      <a href={loginLink} style={{ display: 'inline-block', padding: '12px 25px', backgroundColor: '#FFD700', color: '#002147', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px' }}>Go to Your Dashboard</a>
    </div>
    <p>If you have any questions or need assistance, don't hesitate to reach out to our dedicated support team.</p>
    <p>Thank you for choosing {platformName}. We look forward to serving you!</p>
    <p>Best regards,<br />The {platformName} Team</p>
  </EmailLayout>
);

interface PasswordResetEmailProps {
  userName: string;
  resetLink: string;
  platformName: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({ userName, resetLink, platformName }) => (
  <EmailLayout platformName={platformName} previewText="Reset your password">
    <p style={{fontSize: '18px', fontWeight: 'bold', color: '#002147' }}>Hello {userName},</p>
    <p>We received a request to reset your password for your {platformName} account. If you did not make this request, you can safely ignore this email.</p>
    <p>To reset your password, please click the button below:</p>
    <div style={{textAlign: 'center', margin: '25px 0'}}>
      <a href={resetLink} style={{ display: 'inline-block', padding: '12px 25px', backgroundColor: '#FFD700', color: '#002147', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px' }}>Reset Your Password</a>
    </div>
    <p>This password reset link is valid for the next 1 hour for security reasons.</p>
    <p>If you're having trouble clicking the button, you can also copy and paste the following URL into your web browser:</p>
    <p><a href={resetLink} style={{wordBreak: 'break-all', color: '#0056b3', textDecoration: 'underline'}}>{resetLink}</a></p>
    <p>If you did not request a password reset, please contact our support team immediately.</p>
    <p>Thanks,<br />The {platformName} Team</p>
  </EmailLayout>
);

// You can add more email templates here following the same pattern.
// For example:
// interface TransactionNotificationProps { ... }
// export const TransactionNotification: React.FC<TransactionNotificationProps> = ({ ... }) => ( ... );
