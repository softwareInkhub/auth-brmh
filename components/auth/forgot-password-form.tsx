'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Shield } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { AuthService } from '@/lib/auth-service';
import { cn } from '@/lib/utils';

export default function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Detect if identifier is email or phone
  const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return /^[\+]?[1-9]\d{9,14}$/.test(digits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError('Please enter your email address or phone number');
      return;
    }

    const trimmed = identifier.trim();
    if (!isEmail(trimmed) && !isPhone(trimmed)) {
      setError('Please enter a valid email address or phone number');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Determine if it's email or phone
      const emailValue = isEmail(trimmed) ? trimmed : undefined;
      const phoneValue = isPhone(trimmed) ? trimmed : undefined;
      
      const resp = await AuthService.forgotPassword(emailValue, phoneValue);
      if (resp.success) {
        setSuccess(true);
        // Store identifier for reset password page
        localStorage.setItem('reset_password_identifier', trimmed);
        localStorage.setItem('reset_password_type', isEmail(trimmed) ? 'email' : 'phone');
        // Redirect to reset password page after a delay
        setTimeout(() => {
          const param = isEmail(trimmed) ? 'email' : 'phoneNumber';
          router.push(`/reset-password?${param}=${encodeURIComponent(trimmed)}`);
        }, 2000);
      } else {
        setError(resp.error || 'Failed to send password reset code. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
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
              Forgot Password?
            </h1>
            <p className="text-blue-100/70 text-sm">
              Enter your email address or phone number and we&apos;ll send you a code to reset your password.
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
                ✓ Password reset code sent successfully! Redirecting to reset page...
              </p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="identifier" className="block text-blue-100/90 font-medium mb-2 text-sm">
                  Email or Phone Number
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className={cn('input-field')}
                  placeholder="email@example.com or +919876543210"
                  required
                  autoFocus
                />
                <p className="mt-1 text-xs text-blue-100/50">
                  Phone format: 10+ digits (e.g., 9876543210 or +919876543210)
                </p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group btn-primary w-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" message="Sending code..." className="py-1" />
                  ) : (
                    'Send Reset Code'
                  )}
                </span>
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-600/30">
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

