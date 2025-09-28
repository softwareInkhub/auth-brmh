const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://brmh.in';

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
        body: JSON.stringify({ username: email, password }),
      });

      return await response.json();
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
      const { authUrl, state, error } = await this.getOAuthUrl();
      
      if (error || !authUrl) {
        throw new Error(error || 'Failed to initiate OAuth login');
      }

      // Store state for callback verification
      if (typeof window !== 'undefined') {
        localStorage.setItem('oauthState', state || '');
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('OAuth initiation error:', error);
      throw error;
    }
  }

  static storeTokens(tokens: {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
  }): void {
    if (typeof window !== 'undefined') {
      if (tokens.accessToken) {
        localStorage.setItem('accessToken', tokens.accessToken);
      }
      if (tokens.idToken) {
        localStorage.setItem('idToken', tokens.idToken);
      }
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
    }
  }

  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('oauthState');
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
