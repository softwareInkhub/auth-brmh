'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Github, Lock, Shield } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { AuthService } from '@/lib/auth-service';
import { cn } from '@/lib/utils';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await AuthService.login(data.email, data.password);
      
      if (response.success && response.result) {
        AuthService.storeTokens({
          accessToken: response.result.accessToken?.jwtToken,
          idToken: response.result.idToken?.jwtToken,
          refreshToken: response.result.refreshToken?.token,
        }, rememberMe);
        
        // Get redirect URL from query params or default to main frontend
        const searchParams = new URLSearchParams(window.location.search);
        // Priority: query param > env variable > default localhost:3001 (main frontend)
        const MAIN_FRONTEND_URL = process.env.NEXT_PUBLIC_MAIN_FRONTEND_URL || 'http://localhost:3001';
        let nextUrl = searchParams.get('next') || `${MAIN_FRONTEND_URL}/dashboard`;
        
        // For localhost or cross-domain redirects, pass tokens in URL hash
        const isLocalhostTarget = nextUrl.includes('localhost') || nextUrl.includes('127.0.0.1');
        const isCrossDomain = !nextUrl.includes('brmh.in');
        
        if (isLocalhostTarget || isCrossDomain) {
          // Pass tokens in URL hash for cross-domain transfer
          const tokens = {
            access_token: response.result.accessToken?.jwtToken,
            id_token: response.result.idToken?.jwtToken,
            refresh_token: response.result.refreshToken?.token,
          };
          
          const hashParams = new URLSearchParams();
          if (tokens.access_token) hashParams.set('access_token', tokens.access_token);
          if (tokens.id_token) hashParams.set('id_token', tokens.id_token);
          if (tokens.refresh_token) hashParams.set('refresh_token', tokens.refresh_token);
          
          // Append tokens to target URL as hash
          nextUrl = `${nextUrl}#${hashParams.toString()}`;
          console.log('[Auth] Cross-domain redirect, tokens added to URL hash');
        }
        
        // Redirect to the target URL (cookies will be shared across subdomains for brmh.in domains)
        console.log('[Auth] Login successful, redirecting to:', nextUrl.split('#')[0]); // Log without tokens
        
        // Small delay to ensure tokens are stored
        setTimeout(() => {
          window.location.href = nextUrl;
        }, 300);
      } else {
        const message = response.error || 'Login failed';
        // If account is not confirmed, send user to verification page
        if (message.toLowerCase().includes('account not confirmed')) {
          const emailParam = encodeURIComponent(data.email);
          router.push(`/verify-email?email=${emailParam}`);
          return;
        }
        setError(message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="flex flex-col lg:flex-row min-h-[500px]">
            {/* Left Side - Form */}
            <div className="lg:w-3/5 p-4 lg:p-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-blue-900/20 rounded-3xl"></div>
              <div className="relative max-w-lg mx-auto h-full flex flex-col">
                {/* Logo */}
                <Link
                  href="/"
                  className="group inline-flex items-center space-x-3 text-blue-300 hover:text-blue-200 transition-all duration-300 mb-6 w-fit"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold">BRMH.ai</span>
                </Link>

                <div className="mb-6 text-center">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 gradient-text">
                    Welcome back
                  </h1>
                  <p className="text-blue-100/70 text-lg">Sign in to your secure account</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Social Login */}
                <div className="mb-6">
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    {/* Google */}
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('google')}
                      className="group social-btn"
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
                      className="group social-btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Github className="w-5 h-5 relative z-10" />
                    </button>

                    {/* Facebook */}
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('facebook')}
                      className="group social-btn"
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

                  {/* BRMH Sign In Button */}
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('brmh')}
                    className="group w-full inline-flex justify-center items-center py-3 px-4 rounded-xl border border-slate-600/30 bg-gradient-to-r from-indigo-600/20 to-blue-600/20 backdrop-blur-xl text-white hover:bg-gradient-to-r hover:from-indigo-600/30 hover:to-blue-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 mb-4"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="w-5 h-5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center mr-3 relative z-10">
                      <span className="text-white text-xs font-bold">B</span>
                    </div>
                    <span className="relative z-10 font-semibold">Login with BRMH</span>
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-600/30"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-slate-800/80 text-blue-100/60 font-medium rounded-full backdrop-blur-sm">
                        Or continue with Email
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
                  <div className="group">
                    <label htmlFor="email" className="block text-blue-100/90 font-medium mb-2 text-sm">
                      Email, Username, or Phone Number
                    </label>
                    <input
                      {...register('email')}
                      type="text"
                      id="email"
                      autoComplete="username"
                      className={cn(
                        'input-field',
                        errors.email && 'input-field-error'
                      )}
                      placeholder="email@example.com, username, or +919876543210"
                    />
                    {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>}
                    {!errors.email && (
                      <p className="mt-1 text-xs text-blue-100/50">
                        Phone format: 10+ digits (e.g., 9876543210 or +919876543210)
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label htmlFor="password" className="block text-blue-100/90 font-medium mb-2 text-sm">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="current-password"
                        className={cn(
                          'input-field pr-12',
                          errors.password && 'input-field-error'
                        )}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-100/60 hover:text-blue-100 transition-colors duration-200 hover:scale-110"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>}
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600/50 bg-slate-700/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 transition-all duration-200"
                      />
                      <span className="text-blue-100/70 text-sm group-hover:text-blue-100/90 transition-colors">
                        Remember me
                      </span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-blue-300/80 hover:text-blue-200 transition-colors underline text-sm hover:no-underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group btn-primary"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">
                      {isSubmitting ? <LoadingSpinner size="sm" message="Signing in..." className="py-1" /> : 'Sign In'}
                    </span>
                  </button>

                  <div className="text-center text-sm pt-2">
                    <span className="text-blue-100/70">Don&apos;t have an account? </span>
                    <Link
                      href="/register"
                      className="text-blue-300 font-semibold hover:text-blue-200 transition-colors hover:underline"
                    >
                      Create Account
                    </Link>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Side - Security Features */}
            <div className="lg:w-2/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 to-blue-950/60 backdrop-blur-xl"></div>
              <div className="relative p-4 lg:p-6 h-full flex flex-col justify-center border-l border-slate-700/30">
                <div className="text-white">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold gradient-text">
                      Secure by Design
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="group feature-card">
                      <div className="feature-icon bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                        <div className="w-5 h-5 bg-green-400 rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2 text-lg">End-to-End Encryption</h3>
                        <p className="text-blue-100/70 text-sm leading-relaxed">
                          Your data is protected with military-grade encryption standards
                        </p>
                      </div>
                    </div>

                    <div className="group feature-card">
                      <div className="feature-icon bg-gradient-to-r from-blue-500/20 to-indigo-500/20">
                        <div className="w-5 h-5 bg-blue-400 rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2 text-lg">Multi-Factor Authentication</h3>
                        <p className="text-blue-100/70 text-sm leading-relaxed">
                          Additional security layers to protect your account
                        </p>
                      </div>
                    </div>

                    <div className="group feature-card">
                      <div className="feature-icon bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                        <div className="w-5 h-5 bg-purple-400 rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2 text-lg">Zero-Trust Security</h3>
                        <p className="text-blue-100/70 text-sm leading-relaxed">
                          Every request is verified and authenticated
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 glass-effect rounded-2xl glass-border transition-all duration-300 group">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-6 h-6 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full border border-slate-700 hover:scale-110 transition-transform duration-200"></div>
                      <h3 className="font-semibold text-lg">Trusted by 10,000+ companies</h3>
                    </div>
                    <p className="text-blue-100/70 text-sm mb-4 leading-relaxed">
                      Join the growing community of businesses that trust AuthVerse for their security needs.
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full border-2 border-slate-700 hover:scale-110 transition-transform duration-200"></div>
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full border-2 border-slate-700 hover:scale-110 transition-transform duration-200"></div>
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full border-2 border-slate-700 hover:scale-110 transition-transform duration-200"></div>
                      </div>
                      <div className="w-8 h-8 bg-slate-600/80 rounded-full border-2 border-slate-700 flex items-center justify-center hover:scale-110 transition-transform duration-200">
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


