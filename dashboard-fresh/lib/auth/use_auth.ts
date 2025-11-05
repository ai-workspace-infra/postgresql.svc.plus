// React hook for authentication
import { useState, useEffect, useCallback } from 'preact/hooks';
import { tokenService, TokenPair, authFetch } from './token_service.ts';

export interface User {
  user_id: string;
  email: string;
  roles: string[];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tokens and user info on mount
  useEffect(() => {
    tokenService.loadTokens();
    loadUserInfo();
  }, []);

  /**
   * Load user information from access token
   */
  const loadUserInfo = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = tokenService.getAccessToken();

      if (!accessToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Decode token to get user info
      const claims = tokenService.decodeToken(accessToken);
      setUser({
        user_id: claims.user_id,
        email: claims.email,
        roles: claims.roles,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user info');
      setUser(null);
      tokenService.clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login with credentials
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data: TokenPair = await response.json();
      tokenService.setTokens(data);
      await loadUserInfo();

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadUserInfo]);

  /**
   * Logout
   */
  const logout = useCallback(() => {
    tokenService.clearTokens();
    setUser(null);
    setError(null);
  }, []);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const newToken = await tokenService.refreshAccessToken();
      if (newToken) {
        await loadUserInfo();
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token refresh failed');
      logout();
      return false;
    }
  }, [loadUserInfo, logout]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role: string): boolean => {
    return user?.roles.includes(role) ?? false;
  }, [user]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    refreshToken,
    hasRole,
    isAuthenticated: user !== null,
  };
}
