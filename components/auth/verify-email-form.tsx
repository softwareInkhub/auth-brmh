'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { AuthService } from '@/lib/auth-service';
import { cn } from '@/lib/utils';

export default function VerifyEmailForm() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds remaining before next resend
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    } else {
      // Fallback: check localStorage for pending verification email (from signup)
      const pendingEmail = localStorage.getItem('pending_verification_email');
      if (pendingEmail) {
        setEmail(pendingEmail);
      }
    }
  }, [searchParams]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      setError('Please enter both email and verification code');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const resp = await AuthService.verifyEmail(email, code);
      if (resp.success) {
        setSuccess(true);
        // Clear pending verification email from localStorage
        localStorage.removeItem('pending_verification_email');
        setTimeout(() => {
          router.push('/login?verified=1');
        }, 1500);
      } else {
        setError(resp.error || 'Verification failed. Please check the code and try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email before resending the code.');
      return;
    }
    if (cooldown > 0) {
      return;
    }
    try {
      setIsResending(true);
      setError(null);
      const resp = await AuthService.resendEmailVerification(email);
      if (!resp.success) {
        setError(resp.error || 'Failed to resend verification code. Please try again.');
      } else {
        // Start a 60-second cooldown
        setCooldown(60);
      }
    } catch (err) {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        <div className="glass-effect rounded-3xl shadow-2xl overflow-hidden glass-border transition-all duration-500 p-6 lg:p-8">
          <Link
            href="/login"
            className="group inline-flex items-center space-x-3 text-blue-300 hover:text-blue-200 transition-all duration-300 mb-6 w-fit"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">BRMH.ai</span>
          </Link>

          <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-300" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 gradient-text">
              Verify Your Email
            </h1>
            <p className="text-blue-100/70 text-sm">
              Enter the verification code you received in your email.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">
                ✓ Email verified successfully! Redirecting to login...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-blue-100/90 font-medium mb-2 text-sm">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn('input-field')}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="code" className="block text-blue-100/90 font-medium mb-2 text-sm">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                className={cn('input-field')}
                placeholder="Enter the 6-digit code"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group btn-primary w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">
                {isSubmitting ? (
                  <LoadingSpinner size="sm" message="Verifying..." className="py-1" />
                ) : (
                  'Verify Email'
                )}
              </span>
            </button>
          </form>

          <div className="mt-4 flex flex-col space-y-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="text-blue-300/80 hover:text-blue-200 transition-colors text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending
                ? 'Sending code...'
                : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Didn't receive code? Resend"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-600/30 flex justify-between items-center">
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-blue-300/80 hover:text-blue-200 transition-colors text-sm group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


