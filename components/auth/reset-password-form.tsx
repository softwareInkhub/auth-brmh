'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Lock, Shield } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { AuthService } from '@/lib/auth-service';
import { cn } from '@/lib/utils';

export default function ResetPasswordForm() {
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Detect if identifier is email or phone
  const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return /^[\+]?[1-9]\d{9,14}$/.test(digits);
  };

  useEffect(() => {
    // Check for email or phoneNumber in query params
    const emailFromQuery = searchParams.get('email');
    const phoneFromQuery = searchParams.get('phoneNumber');
    
    if (emailFromQuery) {
      setIdentifier(emailFromQuery);
    } else if (phoneFromQuery) {
      setIdentifier(phoneFromQuery);
    } else {
      // Fallback: check localStorage for reset password identifier
      const resetIdentifier = localStorage.getItem('reset_password_identifier');
      if (resetIdentifier) {
        setIdentifier(resetIdentifier);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier || !code || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    const trimmed = identifier.trim();
    if (!isEmail(trimmed) && !isPhone(trimmed)) {
      setError('Please enter a valid email address or phone number');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Determine if it's email or phone
      const emailValue = isEmail(trimmed) ? trimmed : undefined;
      const phoneValue = isPhone(trimmed) ? trimmed : undefined;
      
      const resp = await AuthService.confirmForgotPassword(code, newPassword, emailValue, phoneValue);
      if (resp.success) {
        setSuccess(true);
        // Clear reset password data from localStorage
        localStorage.removeItem('reset_password_identifier');
        localStorage.removeItem('reset_password_type');
        // Redirect to login page after a delay
        setTimeout(() => {
          router.push('/login?password_reset=1');
        }, 2000);
      } else {
        setError(resp.error || 'Failed to reset password. Please check your code and try again.');
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
              <Lock className="w-8 h-8 text-blue-300" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 gradient-text">
              Reset Password
            </h1>
            <p className="text-blue-100/70 text-sm">
              Enter the code from your {isEmail(identifier) ? 'email' : 'phone'} and your new password.
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
                ✓ Password reset successfully! Redirecting to login...
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
                />
              </div>

              <div>
                <label htmlFor="code" className="block text-blue-100/90 font-medium mb-2 text-sm">
                  Reset Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  className={cn('input-field')}
                  placeholder="Enter the 6-digit code"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-blue-100/90 font-medium mb-2 text-sm">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={cn('input-field pr-12')}
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-100/60 hover:text-blue-100 transition-colors duration-200 hover:scale-110"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-blue-100/90 font-medium mb-2 text-sm">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn('input-field pr-12')}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-100/60 hover:text-blue-100 transition-colors duration-200 hover:scale-110"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group btn-primary w-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" message="Resetting password..." className="py-1" />
                  ) : (
                    'Reset Password'
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

