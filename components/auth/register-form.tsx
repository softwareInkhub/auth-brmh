'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Github, Shield, Sparkles, UserPlus } from 'lucide-react';
import { registerSchema, getPasswordStrength, type RegisterFormData } from '@/lib/validations';
import { AuthService } from '@/lib/auth-service';
import { cn } from '@/lib/utils';

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Email verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerifyError, setEmailVerifyError] = useState<string | null>(null);
  
  // Phone verification state
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [phoneVerifyError, setPhoneVerifyError] = useState<string | null>(null);
  
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');
  const email = watch('email', '');
  const phoneNumber = watch('phoneNumber', '');
  const passwordStrength = getPasswordStrength(password);

  // Check sessionStorage on mount for verified email/phone
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const verified = sessionStorage.getItem('email_verified');
      const verifiedEmail = sessionStorage.getItem('verified_email');
      if (verified === 'true' && verifiedEmail) {
        // Set verified if email matches
        if (email && email === verifiedEmail) {
          setEmailVerified(true);
          setEmailOtpSent(true);
        }
      }
      
      const verifiedPhone = sessionStorage.getItem('phone_verified');
      const verifiedPhoneNum = sessionStorage.getItem('verified_phone');
      if (verifiedPhone === 'true' && verifiedPhoneNum) {
        // Set verified if phone matches
        if (phoneNumber && phoneNumber === verifiedPhoneNum) {
          setPhoneVerified(true);
          setPhoneOtpSent(true);
        }
      }
    }
  }, [email, phoneNumber]);

  const getStrengthColor = (score: number) => {
    if (score < 25) return 'bg-red-500';
    if (score < 50) return 'bg-yellow-500';
    if (score < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number) => {
    if (score < 25) return 'Weak';
    if (score < 50) return 'Fair';
    if (score < 75) return 'Good';
    return 'Strong';
  };

  // Handle email OTP send - Check if exists first, then create account with temp password and send OTP
  const handleSendEmailOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailVerifyError('Please enter a valid email address');
      return;
    }
    
    try {
      setIsSendingEmailOtp(true);
      setEmailVerifyError(null);
      
      // First, check if user already exists
      const checkResp = await AuthService.checkUserExists(email);
      
      if (checkResp.exists) {
        // User exists - try to resend OTP (this will work if user is unverified)
        // If user is already verified, resendEmailVerification will fail and we'll show appropriate error
        const resendResp = await AuthService.resendEmailVerification(email);
        if (resendResp.success) {
          setEmailOtpSent(true);
          setSuccess('Verification code resent to your email!');
          setTimeout(() => {
            setSuccess(null);
          }, 2000);
        } else {
          // If resend fails, user might be already verified
          // Check if error indicates user is already confirmed
          if (resendResp.error?.toLowerCase().includes('already') || 
              resendResp.error?.toLowerCase().includes('confirmed') ||
              resendResp.error?.toLowerCase().includes('verified')) {
            setEmailVerifyError('Email already registered and verified, choose different email');
          } else {
            setEmailVerifyError(resendResp.error || 'Failed to resend verification code');
          }
        }
        setIsSendingEmailOtp(false);
        return;
      }
      
      // User doesn't exist, create account with temporary password to send verification code
      // Generate a temporary password (will be updated later during final registration)
      const tempPassword = `Temp${Math.random().toString(36).slice(-12)}!@#`;
      const tempFirstName = email.split('@')[0]; // Use email prefix as temp name
      const tempLastName = 'User';
      
      // Create the account (this will send verification code automatically)
      const registerResp = await AuthService.register({
        firstName: tempFirstName,
        lastName: tempLastName,
        email: email,
        password: tempPassword,
      });
      
      if (registerResp.success) {
        // Account created, OTP should be sent automatically
        setEmailOtpSent(true);
        setSuccess('Verification code sent to your email!');
        // Auto-hide success message after 2 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
        // Store temp password in sessionStorage (will be updated on final submission)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('temp_email_password', tempPassword);
          sessionStorage.setItem('pending_email', email);
        }
      } else {
        setEmailVerifyError(registerResp.error || 'Failed to create account');
      }
    } catch (err) {
      setEmailVerifyError('Failed to send verification code');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  // Handle email OTP verify
  const handleVerifyEmail = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      setEmailVerifyError('Please enter a valid 6-digit code');
      return;
    }
    
    try {
      setIsVerifyingEmail(true);
      setEmailVerifyError(null);
      const resp = await AuthService.verifyEmail(email, emailOtp);
      if (resp.success) {
        setEmailVerified(true);
        setEmailVerifyError(null);
        setSuccess('Email verified successfully!');
        // Auto-hide success message after 2 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
        // Store verification status in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('email_verified', 'true');
          sessionStorage.setItem('verified_email', email);
        }
      } else {
        setEmailVerifyError(resp.error || 'Invalid verification code');
      }
    } catch (err) {
      setEmailVerifyError('Verification failed');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Handle phone OTP send - Check if exists first, then create account or resend OTP
  const handleSendPhoneOtp = async () => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      setPhoneVerifyError('Please enter a phone number');
      return;
    }
    
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (!/^[\+]?[1-9]\d{9,14}$/.test(phoneDigits)) {
      setPhoneVerifyError('Please enter a valid phone number');
      return;
    }
    
    // Format phone number to E.164 format
    let formattedPhone = phoneNumber.trim().replace(/[\s\-\(\)\.]/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      } else if (formattedPhone.length === 12 && formattedPhone.startsWith('91')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+' + formattedPhone;
      }
    }
    
    try {
      setIsSendingPhoneOtp(true);
      setPhoneVerifyError(null);
      
      // First, check if phone already exists
      const checkResp = await AuthService.checkUserExists(undefined, phoneNumber);
      
      if (checkResp.exists) {
        // User exists - try to resend OTP (this will work if user is unverified)
        // If user is already verified, resendOtp will fail and we'll show appropriate error
        const resendResp = await AuthService.resendOtp(formattedPhone);
        if (resendResp.success) {
          setPhoneOtpSent(true);
          setSuccess('Verification code resent to your phone!');
          setTimeout(() => {
            setSuccess(null);
          }, 2000);
        } else {
          // If resend fails, user might be already verified
          // Check if error indicates user is already confirmed
          if (resendResp.error?.toLowerCase().includes('already') || 
              resendResp.error?.toLowerCase().includes('confirmed') ||
              resendResp.error?.toLowerCase().includes('verified')) {
            setPhoneVerifyError('Phone number already registered and verified, choose different phone number');
          } else {
            setPhoneVerifyError(resendResp.error || 'Failed to resend verification code');
          }
        }
        setIsSendingPhoneOtp(false);
        return;
      }
      
      // User doesn't exist, create account with temporary password to send verification code
      // Generate a temporary password (will be updated later during final registration)
      const tempPassword = `Temp${Math.random().toString(36).slice(-12)}!@#`;
      const tempFirstName = phoneNumber.replace(/\D/g, '').slice(-4); // Use last 4 digits as temp name
      const tempLastName = 'User';
      
      // Create the account (this will send verification code automatically)
      const registerResp = await AuthService.register({
        firstName: tempFirstName,
        lastName: tempLastName,
        email: '', // Phone-only registration
        phoneNumber: formattedPhone,
        password: tempPassword,
      });
      
      if (registerResp.success) {
        // Account created, OTP should be sent automatically
        setPhoneOtpSent(true);
        setSuccess('Verification code sent to your phone!');
        // Auto-hide success message after 2 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
        // Store temp password in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('temp_phone_password', tempPassword);
          sessionStorage.setItem('pending_phone', formattedPhone);
        }
      } else {
        setPhoneVerifyError(registerResp.error || 'Failed to create account');
      }
    } catch (err) {
      setPhoneVerifyError('Failed to send verification code');
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  // Handle phone OTP verify
  const handleVerifyPhone = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      setPhoneVerifyError('Please enter a valid 6-digit code');
      return;
    }
    
    if (!phoneNumber) {
      setPhoneVerifyError('Phone number is required');
      return;
    }
    
    try {
      setIsVerifyingPhone(true);
      setPhoneVerifyError(null);
      const resp = await AuthService.verifyPhone(phoneNumber, phoneOtp);
      if (resp.success) {
        setPhoneVerified(true);
        setPhoneVerifyError(null);
        setSuccess('Phone number verified successfully!');
        // Auto-hide success message after 2 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
        // Store verification status in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('phone_verified', 'true');
          sessionStorage.setItem('verified_phone', phoneNumber);
        }
      } else {
        setPhoneVerifyError(resp.error || 'Invalid verification code');
      }
    } catch (err) {
      setPhoneVerifyError('Verification failed');
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    // Check sessionStorage for verified email
    let isEmailVerifiedInStorage = false;
    let verifiedEmailFromStorage = '';
    if (typeof window !== 'undefined') {
      isEmailVerifiedInStorage = sessionStorage.getItem('email_verified') === 'true';
      verifiedEmailFromStorage = sessionStorage.getItem('verified_email') || '';
    }
    
    // Check if email is verified (either in state or sessionStorage)
    const emailIsVerified = emailVerified || (isEmailVerifiedInStorage && verifiedEmailFromStorage === data.email);
    
    // Check if phone is verified (if provided)
    let isPhoneVerifiedInStorage = false;
    let verifiedPhoneFromStorage = '';
    if (typeof window !== 'undefined' && data.phoneNumber) {
      isPhoneVerifiedInStorage = sessionStorage.getItem('phone_verified') === 'true';
      verifiedPhoneFromStorage = sessionStorage.getItem('verified_phone') || '';
    }
    
    const phoneIsVerified = phoneVerified || (isPhoneVerifiedInStorage && verifiedPhoneFromStorage === data.phoneNumber);
    
    // At least one of email or phone must be verified
    if (!emailIsVerified && !phoneIsVerified) {
      setError('Please verify your email address or phone number before completing registration');
      return;
    }
    
    // If email is provided but not verified
    if (data.email && data.email.trim() !== '' && !emailIsVerified) {
      setError('Please verify your email address before completing registration');
      return;
    }
    
    // If phone is provided but not verified
    if (data.phoneNumber && data.phoneNumber.trim() !== '' && !phoneIsVerified) {
      setError('Please verify your phone number before completing registration');
      return;
    }
    
    // Account is already created during email/phone verification (with temp password)
    // Since account is already created and verified, just redirect to login
    setSuccess('Registration complete! Redirecting to login...');
    // Auto-hide success message after 2 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 2000);
    
    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('email_verified');
      sessionStorage.removeItem('verified_email');
      sessionStorage.removeItem('phone_verified');
      sessionStorage.removeItem('verified_phone');
      sessionStorage.removeItem('temp_email_password');
      sessionStorage.removeItem('pending_email');
      sessionStorage.removeItem('temp_phone_password');
      sessionStorage.removeItem('pending_phone');
    }
    
    setTimeout(() => {
      router.push('/login?registered=1');
    }, 1500);
  };

  const handleOAuthLogin = async (provider: string) => {
    try {
      await AuthService.initiateOAuthLogin(provider);
    } catch (err) {
      setError('Failed to initiate OAuth login');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">

      <div className="w-full max-w-6xl relative">
        <div className="glass-effect rounded-3xl shadow-2xl overflow-hidden glass-border transition-all duration-500">
          <div className="flex flex-col lg:flex-row min-h-[520px]">
            {/* Left Side - Form */}
            <div className="lg:w-3/5 p-4 lg:p-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-blue-900/20 rounded-3xl"></div>
              <div className="relative max-w-lg mx-auto h-full flex flex-col">
                {/* Logo */}
                <Link
                  href="/"
                  className="group inline-flex items-center space-x-3 text-blue-300 hover:text-blue-200 transition-all duration-300 mb-5 w-fit"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold">BRMH.ai</span>
                </Link>

                <div className="mb-4 text-center">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 gradient-text">
                    Create Account
                  </h1>
                  <p className="text-blue-100/70 text-base">Join the secure authentication platform</p>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Social Login */}
                <div className="mb-4">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {/* Google */}
                      <button
                        type="button"
                        onClick={() => handleOAuthLogin('google')}
                        className="group social-btn py-2.5 px-3"
                      >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </button>

                    {/* GitHub */}
                      <button
                        type="button"
                        onClick={() => handleOAuthLogin('github')}
                        className="group social-btn py-2.5 px-3"
                      >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Github className="w-5 h-5 relative z-10" />
                    </button>

                    {/* Facebook */}
                      <button
                        type="button"
                        onClick={() => handleOAuthLogin('facebook')}
                        className="group social-btn py-2.5 px-3"
                      >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                        <path
                          fill="#1877F2"
                          d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                        />
                      </svg>
                    </button>
                    </div>

                    {/* BRMH Sign Up Button */}
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('brmh')}
                      className="group w-full inline-flex justify-center items-center py-3 px-4 rounded-xl border border-slate-600/30 bg-gradient-to-r from-indigo-600/20 to-blue-600/20 backdrop-blur-xl text-white hover:bg-gradient-to-r hover:from-indigo-600/30 hover:to-blue-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 mb-4"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="w-5 h-5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center mr-3 relative z-10">
                        <span className="text-white text-xs font-bold">B</span>
                      </div>
                      <span className="relative z-10 font-semibold">Sign up with BRMH</span>
                    </button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-600/30"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-slate-800/80 text-blue-100/60 font-medium rounded-full backdrop-blur-sm">
                          Or continue with email
                        </span>
                      </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 flex-1">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="group">
                      <label htmlFor="firstName" className="block text-blue-100/90 font-medium mb-1 text-sm">
                        First Name
                      </label>
                      <input
                        {...register('firstName')}
                        type="text"
                        id="firstName"
                        autoComplete="given-name"
                        className={cn(
                          'w-full bg-slate-700/40 backdrop-blur-xl border rounded-xl px-4 py-2.5 text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 transition-all duration-300 text-sm hover:bg-slate-700/50',
                          errors.firstName
                            ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20'
                            : 'border-slate-600/30 focus:border-indigo-400/60 focus:ring-indigo-400/20 group-hover:border-slate-500/50'
                        )}
                        placeholder="First name"
                      />
                      {errors.firstName && <p className="mt-1 text-sm text-red-400">{errors.firstName.message}</p>}
                    </div>
                    <div className="group">
                      <label htmlFor="lastName" className="block text-blue-100/90 font-medium mb-1 text-sm">
                        Last Name
                      </label>
                      <input
                        {...register('lastName')}
                        type="text"
                        id="lastName"
                        autoComplete="family-name"
                        className={cn(
                          'w-full bg-slate-700/40 backdrop-blur-xl border rounded-xl px-4 py-2.5 text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 transition-all duration-300 text-sm hover:bg-slate-700/50',
                          errors.lastName
                            ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20'
                            : 'border-slate-600/30 focus:border-indigo-400/60 focus:ring-indigo-400/20 group-hover:border-slate-500/50'
                        )}
                        placeholder="Last name"
                      />
                      {errors.lastName && <p className="mt-1 text-sm text-red-400">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  {/* Email Field - Required */}
                  <div className="group">
                    <label htmlFor="email" className="block text-blue-100/90 font-medium mb-1 text-sm">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register('email')}
                        type="email"
                        id="email"
                        autoComplete="email"
                        disabled={emailVerified}
                        className={cn(
                          'w-full bg-slate-700/40 backdrop-blur-xl border rounded-xl px-4 py-2.5 pr-24 text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 transition-all duration-300 text-sm hover:bg-slate-700/50',
                          errors.email
                            ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20'
                            : emailVerified
                            ? 'border-green-400/50 bg-green-500/10'
                            : 'border-slate-600/30 focus:border-indigo-400/60 focus:ring-indigo-400/20 group-hover:border-slate-500/50',
                          emailVerified && 'opacity-75'
                        )}
                        placeholder="email@example.com"
                      />
                      {/* Verify Button Inside Email Field */}
                      {email && !errors.email && !emailVerified && !emailOtpSent && (
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={isSendingEmailOtp}
                          className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-indigo-500/50",
                            !isSendingEmailOtp && "hover:scale-105 active:scale-95"
                          )}
                          title="Verify email"
                        >
                          {isSendingEmailOtp ? '...' : 'Verify'}
                        </button>
                      )}
                      {emailVerified && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                      )}
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
                    {emailVerifyError && <p className="mt-1 text-sm text-red-400">{emailVerifyError}</p>}
                    
                    {/* Email OTP Input - Show below field */}
                    {email && !errors.email && emailOtpSent && !emailVerified && (
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={emailOtp}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setEmailOtp(value);
                              setEmailVerifyError(null);
                            }}
                            placeholder="Enter 6-digit code"
                            className="flex-1 bg-slate-700/40 backdrop-blur-xl border border-slate-600/30 rounded-xl px-4 py-2 text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 focus:border-indigo-400/60 text-sm text-center tracking-widest"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleVerifyEmail}
                            disabled={isVerifyingEmail || emailOtp.length !== 6}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isVerifyingEmail ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={isSendingEmailOtp}
                          className="text-xs text-blue-300 hover:text-blue-200 underline disabled:opacity-50"
                        >
                          {isSendingEmailOtp ? 'Sending...' : 'Resend code'}
                        </button>
                      </div>
                    )}
                    {emailVerified && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Email verified</span>
                      </div>
                    )}
                  </div>

                  {/* Phone Number Field - Optional */}
                  <div className="group">
                    <label htmlFor="phoneNumber" className="block text-blue-100/90 font-medium mb-1 text-sm">
                      Phone Number <span className="text-blue-100/50 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register('phoneNumber')}
                        type="text"
                        id="phoneNumber"
                        autoComplete="tel"
                        disabled={phoneVerified && phoneNumber ? true : false}
                        className={cn(
                          'w-full bg-slate-700/40 backdrop-blur-xl border rounded-xl px-4 py-2.5 pr-24 text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 transition-all duration-300 text-sm hover:bg-slate-700/50',
                          errors.phoneNumber
                            ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20'
                            : phoneVerified && phoneNumber
                            ? 'border-green-400/50 bg-green-500/10'
                            : 'border-slate-600/30 focus:border-indigo-400/60 focus:ring-indigo-400/20 group-hover:border-slate-500/50',
                          phoneVerified && phoneNumber && 'opacity-75'
                        )}
                        placeholder="+919876543210"
                      />
                      {/* Verify Button Inside Phone Field */}
                      {phoneNumber && phoneNumber.trim() !== '' && !errors.phoneNumber && !phoneVerified && !phoneOtpSent && (
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          disabled={isSendingPhoneOtp}
                          className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-indigo-500/50",
                            !isSendingPhoneOtp && "hover:scale-105 active:scale-95"
                          )}
                          title="Verify phone number"
                        >
                          {isSendingPhoneOtp ? '...' : 'Verify'}
                        </button>
                      )}
                      {phoneVerified && phoneNumber && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                      )}
                    </div>
                    {errors.phoneNumber && <p className="mt-1 text-sm text-red-400">{errors.phoneNumber.message}</p>}
                    {phoneVerifyError && <p className="mt-1 text-sm text-red-400">{phoneVerifyError}</p>}
                    {!errors.phoneNumber && !phoneVerifyError && (
                      <p className="mt-1 text-xs text-blue-100/50">
                        Phone format: 10+ digits (e.g., 9876543210 or +919876543210)
                      </p>
                    )}
                    
                    {/* Phone OTP Input - Show below field */}
                    {phoneNumber && phoneNumber.trim() !== '' && !errors.phoneNumber && phoneOtpSent && !phoneVerified && (
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={phoneOtp}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setPhoneOtp(value);
                              setPhoneVerifyError(null);
                            }}
                            placeholder="Enter 6-digit code"
                            className="flex-1 bg-slate-700/40 backdrop-blur-xl border border-slate-600/30 rounded-xl px-4 py-2 text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 focus:border-indigo-400/60 text-sm text-center tracking-widest"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleVerifyPhone}
                            disabled={isVerifyingPhone || phoneOtp.length !== 6}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isVerifyingPhone ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          disabled={isSendingPhoneOtp}
                          className="text-xs text-blue-300 hover:text-blue-200 underline disabled:opacity-50"
                        >
                          {isSendingPhoneOtp ? 'Sending...' : 'Resend code'}
                        </button>
                      </div>
                    )}
                    {phoneVerified && phoneNumber && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Phone verified</span>
                      </div>
                    )}
                  </div>

                  <div className="group">
                    <label htmlFor="password" className="block text-blue-100/90 font-medium mb-1 text-sm">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="new-password"
                        className={cn(
                          'w-full bg-slate-700/40 backdrop-blur-xl border rounded-xl px-4 py-2.5 pr-12 text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 transition-all duration-300 text-sm hover:bg-slate-700/50',
                          errors.password
                            ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20'
                            : 'border-slate-600/30 focus:border-indigo-400/60 focus:ring-indigo-400/20 group-hover:border-slate-500/50'
                        )}
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-100/60 hover:text-blue-100 transition-colors duration-200 hover:scale-110"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-1 p-2 bg-slate-800/40 backdrop-blur-xl rounded-lg border border-slate-700/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-blue-100/70 font-medium">Password strength:</span>
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              passwordStrength.score < 25
                                ? 'text-red-400'
                                : passwordStrength.score < 50
                                  ? 'text-yellow-400'
                                  : passwordStrength.score < 75
                                    ? 'text-blue-400'
                                    : 'text-green-400'
                            )}
                          >
                            {getStrengthText(passwordStrength.score)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-600/40 rounded-full h-1.5 mb-1">
                          <div
                            className={cn(
                              'h-1.5 rounded-full transition-all duration-500',
                              getStrengthColor(passwordStrength.score)
                            )}
                            style={{ width: `${passwordStrength.score}%` }}
                          ></div>
                        </div>
                        {passwordStrength.feedback.length > 0 && (
                          <p className="text-xs text-blue-100/60 leading-relaxed">
                            Missing: {passwordStrength.feedback.join(', ')}
                          </p>
                        )}
                      </div>
                    )}

                    {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
                  </div>

                  <div className="group">
                    <label htmlFor="confirmPassword" className="block text-blue-100/90 font-medium mb-1 text-sm">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        autoComplete="new-password"
                        className={cn(
                          'w-full bg-slate-700/40 backdrop-blur-xl border rounded-xl px-4 py-2.5 pr-12 text-white placeholder-blue-100/40 focus:outline-none focus:ring-2 transition-all duration-300 text-sm hover:bg-slate-700/50',
                          errors.confirmPassword
                            ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20'
                            : 'border-slate-600/30 focus:border-indigo-400/60 focus:ring-indigo-400/20 group-hover:border-slate-500/50'
                        )}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-100/60 hover:text-blue-100 transition-colors duration-200 hover:scale-110"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !emailVerified}
                    className={cn(
                      "group btn-primary mt-3",
                      (!emailVerified || isSubmitting) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">
                      {isSubmitting 
                        ? 'Completing Registration...' 
                        : emailVerified 
                        ? 'Complete Registration' 
                        : 'Verify Email to Continue'}
                    </span>
                  </button>

                  <div className="text-center text-sm pt-1">
                    <span className="text-blue-100/70">Already have an account? </span>
                    <Link
                      href="/login"
                      className="text-blue-300 font-semibold hover:text-blue-200 transition-colors hover:underline"
                    >
                      Sign In
                    </Link>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Side - Benefits */}
            <div className="lg:w-2/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 to-blue-950/60 backdrop-blur-xl"></div>
              <div className="relative p-4 lg:p-6 h-full flex flex-col justify-center border-l border-slate-700/30">
                <div className="text-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl lg:text-2xl font-bold gradient-text">
                      Why Choose BRMH.ai?
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <div className="group feature-card">
                      <div className="feature-icon bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 text-base">Enterprise Security</h3>
                        <p className="text-blue-100/70 text-sm leading-relaxed">
                          Bank-level security with advanced encryption standards
                        </p>
                      </div>
                    </div>

                    <div className="group feature-card">
                      <div className="feature-icon bg-gradient-to-r from-blue-500/20 to-indigo-500/20">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 text-base">Easy Integration</h3>
                        <p className="text-blue-100/70 text-sm leading-relaxed">
                          Simple APIs and comprehensive documentation
                        </p>
                      </div>
                    </div>

                    <div className="group feature-card">
                      <div className="feature-icon bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 text-base">24/7 Support</h3>
                        <p className="text-blue-100/70 text-sm leading-relaxed">
                          Round-the-clock technical assistance when you need it
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 glass-effect rounded-xl glass-border transition-all duration-300 group">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-base">Join 10,000+ developers</h3>
                    </div>
                    <p className="text-blue-100/70 text-sm mb-3 leading-relaxed">
                      Start building secure applications with our trusted platform today.
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full border-2 border-slate-700 hover:scale-110 transition-transform duration-200"></div>
                        <div className="w-7 h-7 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full border-2 border-slate-700 hover:scale-110 transition-transform duration-200"></div>
                        <div className="w-7 h-7 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full border-2 border-slate-700 hover:scale-110 transition-transform duration-200"></div>
                      </div>
                      <div className="w-7 h-7 bg-slate-600/80 rounded-full border-2 border-slate-700 flex items-center justify-center hover:scale-110 transition-transform duration-200">
                        <span className="text-xs font-bold">10K+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
