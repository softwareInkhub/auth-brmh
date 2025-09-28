'use client';

import { useEffect } from 'react';
import { AuthService } from '@/lib/auth-service';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function CognitoLoginPage() {
  useEffect(() => {
    // Redirect to Cognito hosted UI immediately
    AuthService.initiateOAuthLogin('cognito');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-effect rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <LoadingSpinner size="lg" message="Redirecting to Cognito..." />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">
          Redirecting to Authentication
        </h1>
        <p className="text-blue-100/70 mb-6">
          You will be redirected to AWS Cognito for secure authentication.
        </p>
      </div>
    </div>
  );
}
