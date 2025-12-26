import { Suspense } from 'react';
import VerifyEmailForm from '@/components/auth/verify-email-form';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}


