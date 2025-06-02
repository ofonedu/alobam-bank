
// src/lib/email-templates.tsx
import * as React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
  platformName: string;
  previewText?: string;
}

const EmailLayout: React.FC<EmailLayoutProps> = ({ children, platformName, previewText }) => (
  // This outermost div is what Resend will use as the direct content for its `react` prop.
  // Inline styles are generally more reliable for the immediate wrapper in HTML emails.
  <div style={{ margin: '0 auto', padding: '0', width: '100%', backgroundColor: '#f4f4f4', fontFamily: 'Arial, sans-serif' }}>
    {/* Preview text for email clients, hidden from view */}
    {previewText && <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>{previewText}</div>}
    
    {/* Styles for elements within the email body. Resend will process this. */}
    <style>{`
      .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .email-header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eeeeee; }
      .email-header h1 { color: #002147; margin:0; font-size: 24px; }
      .email-content { padding: 20px 0; color: #333333; line-height: 1.6; }
      .email-content p { margin: 0 0 10px; }
      .email-button { display: inline-block; padding: 10px 20px; background-color: #FFD700; color: #002147 !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
      .email-footer { text-align: center; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #777777; }
    `}</style>
    
    <div className="email-container">
      <div className="email-header">
        <h1>{platformName}</h1>
      </div>
      <div className="email-content">
        {children}
      </div>
      <div className="email-footer">
        <p>&copy; {new Date().getFullYear()} {platformName}. All rights reserved.</p>
        <p>If you did not request this email, please ignore it.</p>
      </div>
    </div>
  </div>
);


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
      <a href={loginLink} className="email-button">Log In to Your Account</a>
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
      <a href={resetLink} className="email-button">Reset Your Password</a>
    </p>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>If you're having trouble clicking the password reset button, copy and paste the URL below into your web browser:</p>
    <p><a href={resetLink} style={{wordBreak: 'break-all'}}>{resetLink}</a></p>
    <p>Thanks,<br />The {platformName} Team</p>
  </EmailLayout>
);
