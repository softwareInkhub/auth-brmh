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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
           credentials: 'include',
        body: JSON.stringify({ username: email, password }),
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
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: `${data.firstName} ${data.lastName}`,
          email: data.email,
          password: data.password,
        }),
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

  static async initiateOAuthLogin(provider: string): Promise<void> {
    try {
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
  }): void {
    if (typeof window !== 'undefined') {
      // Store tokens with consistent naming for cross-app compatibility
      if (tokens.accessToken) {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('access_token', tokens.accessToken); // For projectmngnt compatibility
      }
      if (tokens.idToken) {
        localStorage.setItem('idToken', tokens.idToken);
        localStorage.setItem('id_token', tokens.idToken); // For projectmngnt compatibility
      }
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('refresh_token', tokens.refreshToken); // For projectmngnt compatibility
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
      // Clear all token formats
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      localStorage.removeItem('oauthState');
      localStorage.removeItem('oauthProvider');
      localStorage.removeItem('cognitoState');
      localStorage.removeItem('cognitoNonce');
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

    return {
      accessToken: localStorage.getItem('accessToken') || undefined,
      idToken: localStorage.getItem('idToken') || undefined,
      refreshToken: localStorage.getItem('refreshToken') || undefined,
    };
  }

  static isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!(tokens.accessToken && tokens.idToken);
  }
}
