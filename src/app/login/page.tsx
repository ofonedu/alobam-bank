import { LoginForm } from '@/components/auth/auth-forms';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | VerifAI',
  description: 'Login to your VerifAI account.',
};

export default function LoginPage() {
  return <LoginForm />;
}
