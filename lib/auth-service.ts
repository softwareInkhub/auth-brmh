const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://brmh.in';

// Cognito Configuration - Replace with your actual values
const COGNITO_CONFIG = {
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'YOUR_USER_POOL_ID',
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || 'YOUR_CLIENT_ID',
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || 'auth.brmh.in',
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'https://auth.brmh.in/callback',
  logoutUri: process.env.NEXT_PUBLIC_LOGOUT_URI || 'https://auth.brmh.in/'
};

export interface AuthResponse {
  success: boolean;
  result?: {
    accessToken?: { jwtToken: string };
    idToken?: { jwtToken: string };
    refreshToken?: { token: string };
  };
  error?: string;
  message?: string;
}

export interface OAuthResponse {
  authUrl?: string;
  state?: string;
  error?: string;
}

export class AuthService {
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Detect if it's a phone number and format it properly
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(email.trim());
      let username = email;
      
      // If it's a phone number, format it to E.164
      if (!isEmail) {
        const phoneDigits = email.trim().replace(/[\s\-\(\)\.]/g, '');
        const phoneRegex = /^[\+]?[1-9]\d{9,14}$/;
        
        if (phoneRegex.test(phoneDigits)) {
          // It's a phone number, format it
          if (!phoneDigits.startsWith('+')) {
            if (phoneDigits.length === 10) {
              // Assume India for 10-digit numbers
              username = '+91' + phoneDigits;
            } else if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
              // Indian number with country code but no +
              username = '+' + phoneDigits;
            } else if (phoneDigits.length === 11 && phoneDigits.startsWith('1')) {
              // US/Canada format
              username = '+' + phoneDigits;
            } else {
              username = '+' + phoneDigits;
            }
          } else {
            username = phoneDigits;
          }
          console.log('[Auth] Logging in with phone number:', username);
        }
      } else {
        console.log('[Auth] Logging in with email:', username);
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'Login failed' };
      }
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  static async register(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      // Prepare the request body
      const requestBody: any = {
        username: `${data.firstName} ${data.lastName}`,
        password: data.password,
      };
      
      // Add email if provided
      if (data.email && data.email.trim() !== '') {
        requestBody.email = data.email;
      }
      
      // Add phone number if provided
      if (data.phoneNumber && data.phoneNumber.trim() !== '') {
        // Format phone number to E.164 format
        let phoneNumber = data.phoneNumber.trim().replace(/[\s\-\(\)\.]/g, '');
        
        // Add country code if missing
        if (!phoneNumber.startsWith('+')) {
          if (phoneNumber.length === 10) {
            // Assume India for 10-digit numbers
            phoneNumber = '+91' + phoneNumber;
          } else if (phoneNumber.length === 12 && phoneNumber.startsWith('91')) {
            // Indian number with country code but no +
            phoneNumber = '+' + phoneNumber;
          } else if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
            // US/Canada format
            phoneNumber = '+' + phoneNumber;
          } else {
            phoneNumber = '+' + phoneNumber;
          }
        }
        
        requestBody.phone_number = phoneNumber;
      }
      
      // At least one of email or phone must be provided
      if (!requestBody.email && !requestBody.phone_number) {
        return {
          success: false,
          error: 'Email or phone number is required',
        };
      }
      
      console.log('[Auth] Registering:', { 
        email: requestBody.email || 'none', 
        phone: requestBody.phone_number || 'none' 
      });

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  static async getOAuthUrl(): Promise<OAuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/oauth-url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      return {
        error: 'Failed to initiate OAuth login',
      };
    }
  }

  static async exchangeCodeForTokens(code: string, state: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code, state }),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Network error during OAuth callback',
      };
    }
  }

  static async verifyEmail(email: string, code: string, username?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, username }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'Failed to verify email' };
      }
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  static async resendEmailVerification(email: string, username?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-email-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'Failed to resend verification code' };
      }
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  static async forgotPassword(email?: string, phoneNumber?: string, username?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phoneNumber, username }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'Failed to send password reset code' };
      }
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  static async confirmForgotPassword(
    code: string,
    newPassword: string,
    email?: string,
    phoneNumber?: string,
    username?: string
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/confirm-forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phoneNumber, code, newPassword, username }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'Failed to reset password' };
      }
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  static async resendOtp(phoneNumber: string, username?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, username }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'Failed to resend OTP' };
      }
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  static async verifyPhone(phoneNumber: string, code: string, username?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, code, username }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'Failed to verify phone number' };
      }
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  static async checkUserExists(email?: string, phoneNumber?: string): Promise<{ success: boolean; exists: boolean; type?: string; message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-user-exists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phoneNumber }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        exists: false,
        error: 'Network error. Please try again.',
      };
    }
  }

  static async initiateOAuthLogin(provider: string): Promise<void> {
    try {
      // Store the 'next' parameter before OAuth flow so we can redirect after login
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const nextUrl = searchParams.get('next');
        if (nextUrl) {
          localStorage.setItem('oauth_next_url', nextUrl);
          console.log('[Auth Service] Stored next URL for OAuth flow:', nextUrl);
        }
      }
      
      // Use backend OAuth URL generation with PKCE for better security
      const response = await fetch(`${API_BASE_URL}/auth/oauth-url?provider=${provider}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data: OAuthResponse = await response.json();
      
      if (data.authUrl && data.state) {
        // Store state for verification during callback
        if (typeof window !== 'undefined') {
          localStorage.setItem('oauthState', data.state);
          localStorage.setItem('oauthProvider', provider);
          
          // Redirect to OAuth URL
          window.location.href = data.authUrl;
        }
      } else {
        throw new Error(data.error || 'Failed to generate OAuth URL');
      }
    } catch (error) {
      console.error('OAuth initiation error:', error);
      throw error;
    }
  }

  static getCognitoHostedUIUrl(provider?: string): string {
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);
    
    // Store state and nonce for verification
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognitoState', state);
      localStorage.setItem('cognitoNonce', nonce);
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: COGNITO_CONFIG.clientId,
      redirect_uri: COGNITO_CONFIG.redirectUri,
      scope: 'openid email profile',
      state: state,
      nonce: nonce,
      ...(provider && { identity_provider: provider })
    });

    // Normalize domain: allow either 'login.brmh.in' or full 'https://login.brmh.in'
    const rawDomain = (COGNITO_CONFIG.domain || '').replace(/\/$/, '');
    const base = /^https?:\/\//i.test(rawDomain) ? rawDomain : `https://${rawDomain}`;
    return `${base}/oauth2/authorize?${params.toString()}`;
  }

  static generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  static storeTokens(tokens: {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
  }, rememberMe: boolean = true): void {
    if (typeof window !== 'undefined') {
      // Choose storage based on rememberMe preference
      // rememberMe = true: localStorage (persists across browser sessions)
      // rememberMe = false: sessionStorage (cleared when browser closes)
      const storage = rememberMe ? localStorage : sessionStorage;
      
      // Store tokens with consistent naming for cross-app compatibility
      if (tokens.accessToken) {
        storage.setItem('accessToken', tokens.accessToken);
        storage.setItem('access_token', tokens.accessToken); // For projectmngnt compatibility
      }
      if (tokens.idToken) {
        storage.setItem('idToken', tokens.idToken);
        storage.setItem('id_token', tokens.idToken); // For projectmngnt compatibility
      }
      if (tokens.refreshToken) {
        storage.setItem('refreshToken', tokens.refreshToken);
        storage.setItem('refresh_token', tokens.refreshToken); // For projectmngnt compatibility
      }
      
      // Store rememberMe preference
      storage.setItem('rememberMe', rememberMe.toString());
      
      // Also set cookies for cross-domain SSO (client-side fallback)
      const domain = '.brmh.in';
      const secure = window.location.protocol === 'https:';
      const sameSite = 'None';
      
      // Set cookie expiration based on rememberMe
      // rememberMe = true: 30 days for refresh token, 1 hour for access/id tokens
      // rememberMe = false: Session cookies (no max-age, cleared on browser close)
      const accessTokenMaxAge = rememberMe ? 3600 : undefined; // 1 hour or session
      const refreshTokenMaxAge = rememberMe ? 2592000 : undefined; // 30 days or session
      
      if (tokens.accessToken) {
        const maxAgePart = accessTokenMaxAge ? `max-age=${accessTokenMaxAge};` : '';
        document.cookie = `access_token=${tokens.accessToken}; domain=${domain}; path=/; ${secure ? 'secure;' : ''} samesite=${sameSite}; ${maxAgePart}`;
      }
      if (tokens.idToken) {
        const maxAgePart = accessTokenMaxAge ? `max-age=${accessTokenMaxAge};` : '';
        document.cookie = `id_token=${tokens.idToken}; domain=${domain}; path=/; ${secure ? 'secure;' : ''} samesite=${sameSite}; ${maxAgePart}`;
      }
      if (tokens.refreshToken) {
        const maxAgePart = refreshTokenMaxAge ? `max-age=${refreshTokenMaxAge};` : '';
        document.cookie = `refresh_token=${tokens.refreshToken}; domain=${domain}; path=/; ${secure ? 'secure;' : ''} samesite=${sameSite}; ${maxAgePart}`;
      }
      
      // Also extract user info from ID token and store it
      if (tokens.idToken) {
        try {
          const payload = JSON.parse(atob(tokens.idToken.split('.')[1]));
          if (payload.sub) localStorage.setItem('user_id', payload.sub);
          if (payload.email) localStorage.setItem('user_email', payload.email);
          if (payload.name || payload.given_name) {
            localStorage.setItem('user_name', payload.name || payload.given_name);
          }
          console.log('[AuthService] Stored user info from ID token:', {
            userId: payload.sub,
            email: payload.email,
            name: payload.name || payload.given_name
          });
        } catch (error) {
          console.error('[AuthService] Error extracting user info from ID token:', error);
        }
      }
    }
  }

  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      // Clear all token formats from both localStorage and sessionStorage
      const tokenKeys = [
        'accessToken', 'idToken', 'refreshToken',
        'access_token', 'id_token', 'refresh_token',
        'user_id', 'user_email', 'user_name',
        'rememberMe',
        'oauthState', 'oauthProvider',
        'cognitoState', 'cognitoNonce'
      ];
      
      tokenKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Clear cookies
      const domain = '.brmh.in';
      document.cookie = `access_token=; domain=${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `id_token=; domain=${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `refresh_token=; domain=${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }

  static getStoredTokens(): {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
  } {
    if (typeof window === 'undefined') {
      return {};
    }

    // Check rememberMe preference to determine which storage to use
    const rememberMe = localStorage.getItem('rememberMe') === 'true' || sessionStorage.getItem('rememberMe') === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Fallback: if not found in preferred storage, check the other one
    const getToken = (key: string) => {
      return storage.getItem(key) || (rememberMe ? sessionStorage.getItem(key) : localStorage.getItem(key)) || undefined;
    };
    
    return {
      accessToken: getToken('accessToken'),
      idToken: getToken('idToken'),
      refreshToken: getToken('refreshToken'),
    };
  }

  static isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!(tokens.accessToken && tokens.idToken);
  }

  // Check if user is authenticated via cookies (for SSO)
  static isAuthenticatedViaCookies(): boolean {
    if (typeof document === 'undefined') return false;
    
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return !!(cookies.access_token || cookies.id_token);
  }

  // Get tokens from cookies
  static getTokensFromCookies(): {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
  } {
    if (typeof document === 'undefined') return {};
    
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return {
      accessToken: cookies.access_token,
      idToken: cookies.id_token,
      refreshToken: cookies.refresh_token,
    };
  }

  // Sync tokens from cookies to localStorage (for apps that expect localStorage)
  static syncTokensFromCookies(): void {
    const tokens = this.getTokensFromCookies();
    if (tokens.accessToken || tokens.idToken || tokens.refreshToken) {
      this.storeTokens(tokens);
    }
  }
}
