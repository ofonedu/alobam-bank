import { SignupForm } from '@/components/auth/auth-forms';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | VerifAI',
  description: 'Create a new VerifAI account.',
};

export default function SignupPage() {
  return <SignupForm />;
}
