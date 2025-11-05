// Token service for Public + Refresh + JWT access_token dual-layer authentication
// Using Deno crypto API

export interface TokenPair {
  public_token: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface TokenClaims {
  user_id: string;
  email: string;
  roles: string[];
  service?: string;
  exp: number;
  iat: number;
  iss: string;
  aud: string | string[];
}

/**
 * TokenService handles token generation and validation in the frontend
 */
export class TokenService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private publicToken: string | null = null;
  private accessSecret: string;
  private refreshSecret: string;

  constructor(config: {
    publicToken: string;
    refreshSecret: string;
    accessSecret: string;
  }) {
    this.publicToken = config.publicToken;
    this.refreshSecret = config.refreshSecret;
    this.accessSecret = config.accessSecret;
  }

  /**
   * Set the public token from configuration
   */
  setPublicToken(token: string): void {
    this.publicToken = token;
  }

  /**
   * Set tokens after successful authentication
   */
  setTokens(tokenPair: TokenPair): void {
    this.accessToken = tokenPair.access_token;
    this.refreshToken = tokenPair.refresh_token;
    this.publicToken = tokenPair.public_token;
    this.storeTokens();
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get the current refresh token
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Get the public token
   */
  getPublicToken(): string | null {
    return this.publicToken;
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.accessToken;
    if (!tokenToCheck) return true;

    try {
      const claims = this.decodeToken(tokenToCheck);
      const currentTime = Math.floor(Date.now() / 1000);
      return claims.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Decode JWT token without verification (for inspection only)
   */
  decodeToken(token: string): TokenClaims {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(): void {
    if (typeof window === 'undefined') return;

    if (this.accessToken) {
      localStorage.setItem('access_token', this.accessToken);
    }
    if (this.refreshToken) {
      localStorage.setItem('refresh_token', this.refreshToken);
    }
    if (this.publicToken) {
      localStorage.setItem('public_token', this.publicToken);
    }
  }

  /**
   * Load tokens from localStorage
   */
  loadTokens(): void {
    if (typeof window === 'undefined') return;

    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.publicToken = localStorage.getItem('public_token');
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.publicToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('public_token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.storeTokens();

      return this.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Create authorization header
   */
  createAuthHeader(token?: string): Record<string, string> {
    const tokenToUse = token || this.accessToken;
    if (!tokenToUse) {
      return {};
    }

    return {
      'Authorization': `Bearer ${tokenToUse}`,
    };
  }

  /**
   * Automatically refresh token if expired
   */
  async ensureValidToken(): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }

    if (this.isTokenExpired()) {
      const newToken = await this.refreshAccessToken();
      return newToken !== null;
    }

    return true;
  }
}

// Default instance
export const tokenService = new TokenService({
  publicToken: 'xcontrol-public-token-2024',
  refreshSecret: 'xcontrol-refresh-secret-2024',
  accessSecret: 'xcontrol-access-secret-2024',
});

/**
 * Fetch wrapper with automatic token management
 */
export async function authFetch(
  url: string,
  options: RequestInit = {},
  autoRefresh: boolean = true
): Promise<Response> {
  // Ensure token is valid
  if (autoRefresh) {
    await tokenService.ensureValidToken();
  }

  // Add auth header
  const headers = new Headers(options.headers);
  const authHeader = tokenService.createAuthHeader();
  Object.entries(authHeader).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (response.status === 401 && autoRefresh) {
    const newToken = await tokenService.refreshAccessToken();
    if (newToken) {
      const newHeaders = new Headers(options.headers);
      const newAuthHeader = tokenService.createAuthHeader(newToken);
      Object.entries(newAuthHeader).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      return fetch(url, {
        ...options,
        headers: newHeaders,
      });
    }
  }

  return response;
}
