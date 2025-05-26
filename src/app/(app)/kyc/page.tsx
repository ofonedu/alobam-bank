import { KycVerificationForm } from "@/components/kyc/kyc-form";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KYC Verification | VerifAI',
  description: 'Submit your documents for AI-powered KYC verification.',
};

export default function KycPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
        <p className="text-muted-foreground">
          Securely verify your identity using our AI-enhanced process.
        </p>
      </div>
      <KycVerificationForm />
    </div>
  );
}
