
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
  };
  const containerStyles: React.CSSProperties = {
    maxWidth: '600px',
    margin: '20px auto',
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  };
  const headerStyles: React.CSSProperties = {
    textAlign: 'center',
    paddingBottom: '20px',
    borderBottom: '1px solid #eeeeee',
  };
  const headerH1Styles: React.CSSProperties = {
    color: '#002147', // Deep Blue - primary color
    margin: 0,
    fontSize: '24px',
  };
  const contentStyles: React.CSSProperties = {
    padding: '20px 0',
    color: '#333333',
    lineHeight: 1.6,
  };
  const pStyles: React.CSSProperties = {
    margin: '0 0 10px 0',
  };
  const buttonStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#FFD700', // Gold - secondary/accent color
    color: '#002147', // Deep Blue text on gold button
    textDecoration: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
  };
  const footerStyles: React.CSSProperties = {
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #eeeeee',
    fontSize: '12px',
    color: '#777777',
  };

  return (
    // The direct child of the component passed to Resend's `react` prop.
    // It's common to use a simple wrapper div here, or even directly the email's main table/container.
    // Resend handles the DOCTYPE, html, head, body tags.
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
          <p style={pStyles}>If you did not request this email, please ignore it.</p>
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
    <p>Hello {userName},</p>
    <p>Welcome to {platformName}! We're thrilled to have you join our community. Get started by exploring your new account and the features we offer.</p>
    <p style={{ textAlign: 'center', margin: '20px 0' }}>
      <a href={loginLink} style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#FFD700', color: '#002147', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>Log In to Your Account</a>
    </p>
    <p>If you have any questions, feel free to contact our support team.</p>
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
    <p>Hello {userName},</p>
    <p>We received a request to reset your password for your {platformName} account. If you did not make this request, please ignore this email.</p>
    <p>To reset your password, click the link below:</p>
    <p style={{ textAlign: 'center', margin: '20px 0' }}>
      <a href={resetLink} style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#FFD700', color: '#002147', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>Reset Your Password</a>
    </p>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>If you're having trouble clicking the password reset button, copy and paste the URL below into your web browser:</p>
    <p><a href={resetLink} style={{wordBreak: 'break-all'}}>{resetLink}</a></p>
    <p>Thanks,<br />The {platformName} Team</p>
  </EmailLayout>
);
