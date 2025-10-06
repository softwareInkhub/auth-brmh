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

          // Get the 'next' URL from localStorage (stored before OAuth flow) or URL param
          const storedNextUrl = localStorage.getItem('oauth_next_url');
          const nextParam = new URLSearchParams(window.location.search).get('next');
          let target = storedNextUrl || nextParam || 'https://app.brmh.in';

          // Clean up stored next URL
          localStorage.removeItem('oauth_next_url');
          
          console.log('[OAuth Callback] Redirecting to:', target);
          
          // For localhost or cross-domain redirects, pass tokens in URL hash
          const isLocalhostTarget = target.includes('localhost') || target.includes('127.0.0.1');
          const isCrossDomain = !target.includes('brmh.in');
          
          if (isLocalhostTarget || isCrossDomain) {
            // Pass tokens in URL hash for cross-domain transfer
            const tokens = {
              access_token: response.result?.accessToken?.jwtToken,
              id_token: response.result?.idToken?.jwtToken,
              refresh_token: response.result?.refreshToken?.token,
            };
            
            const hashParams = new URLSearchParams();
            if (tokens.access_token) hashParams.set('access_token', tokens.access_token);
            if (tokens.id_token) hashParams.set('id_token', tokens.id_token);
            if (tokens.refresh_token) hashParams.set('refresh_token', tokens.refresh_token);
            
            // Append tokens to target URL as hash (more secure than query params)
            target = `${target}#${hashParams.toString()}`;
            console.log('[OAuth Callback] Cross-domain redirect, tokens added to URL hash');
          }

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
