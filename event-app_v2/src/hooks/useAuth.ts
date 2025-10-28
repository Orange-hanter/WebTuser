import { useState, useCallback } from 'react';
import AuthService from '@/services/authService';
import type { User, AuthCredentials, RegistrationData, UserProfile } from '@/types';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  verify: (code: string, method: 'sms' | 'email') => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState('');
  const [currentToken, setCurrentToken] = useState(AuthService.getAuthToken() || '');

  const login = useCallback(async (credentials: AuthCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.login(credentials);
      
      if (!response.success) {
        throw new Error(response.error || 'Ошибка входа');
      }

      if (response.data) {
        setUser(response.data.user);
        setCurrentToken(response.data.token);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка входа';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegistrationData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.register(data);
      
      if (!response.success) {
        throw new Error(response.error || 'Ошибка регистрации');
      }

      setTempEmail(data.email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка регистрации';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verify = useCallback(async (code: string, method: 'sms' | 'email') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.verify({ email: tempEmail, code, method });
      
      if (!response.success) {
        throw new Error(response.error || 'Ошибка верификации');
      }

      if (response.data) {
        setUser(response.data.user);
        setCurrentToken(response.data.token);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка верификации';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [tempEmail]);

  const updateProfile = useCallback(async (profile: Partial<UserProfile>) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!currentToken) {
        throw new Error('Нет активной сессии');
      }

      const response = await AuthService.updateProfile(currentToken, profile);
      
      if (!response.success) {
        throw new Error(response.error || 'Ошибка обновления профиля');
      }

      if (response.data) {
        setUser(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления профиля';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentToken]);

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setCurrentToken('');
      setTempEmail('');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: user !== null && AuthService.isTokenValid(),
    login,
    register,
    verify,
    updateProfile,
    logout,
  };
};
