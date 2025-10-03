'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthService } from '@/lib/auth-service';
import LoadingSpinner from '@/components/ui/loading-spinner';

function CallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(`Authentication Error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback: Missing authorization code or state parameter.');
        return;
      }

      try {
        setMessage('Processing authentication...');
        
        // Verify state parameter (check both oauthState and cognitoState for backwards compatibility)
        const storedState = localStorage.getItem('oauthState') || localStorage.getItem('cognitoState');
        if (state !== storedState) {
          setStatus('error');
          setMessage('Invalid state parameter. Security verification failed.');
          return;
        }

        // Get the provider that initiated the OAuth flow
        const provider = localStorage.getItem('oauthProvider');
        console.log('[OAuth Callback] Processing authentication for provider:', provider || 'default');

        // Exchange code for tokens using backend
        const response = await AuthService.exchangeCodeForTokens(code, state);

        if (response.success) {
          // Store tokens from the response
          if (response.result) {
            const tokens = {
              accessToken: response.result.accessToken?.jwtToken,
              idToken: response.result.idToken?.jwtToken,
              refreshToken: response.result.refreshToken?.token,
            };
            
            AuthService.storeTokens(tokens);
          }

          // Clean up OAuth state
          localStorage.removeItem('oauthState');
          localStorage.removeItem('oauthProvider');
          localStorage.removeItem('cognitoState');
          localStorage.removeItem('cognitoNonce');

          setStatus('success');
          setMessage('Authentication successful! Redirecting...');

          console.log('[OAuth Callback] Authentication successful, redirecting...');

          // Redirect to next param (if passed through the flow), else to app
          const nextParam = new URLSearchParams(window.location.search).get('next');
          const target = nextParam || 'https://app.brmh.in' || 'https://projectmngnt.vercel.app'|| 'https://projectmanagement.brmh.in';

          setTimeout(() => { window.location.href = target; }, 600);
        } else {
          setStatus('error');
          setMessage(response.error || 'Authentication failed');
        }
      } catch (error) {
        console.error('[OAuth Callback] Error:', error);
        setStatus('error');
        setMessage('Network error during authentication');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-effect rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <LoadingSpinner size="lg" message="Processing Authentication" />
          )}
          {status === 'success' && (
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          {status === 'loading' && 'Processing Authentication'}
          {status === 'success' && 'Authentication Successful'}
          {status === 'error' && 'Authentication Error'}
        </h1>

        <p className="text-blue-100/70 mb-6">
          {message}
        </p>

        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:from-indigo-700 hover:to-blue-700"
            >
              Back to Login
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-slate-700/50 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:bg-slate-600/50"
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-effect rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <LoadingSpinner size="lg" message="Loading..." />
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
