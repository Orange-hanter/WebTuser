import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode, FC } from 'react';
import AuthService from '@/services/authService';
import TelegramService from '@/services/telegramService';
import type { User, AuthCredentials, RegistrationData, UserProfile, TelegramBindingLink } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  verify: (code: string, method: 'sms' | 'email') => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  refreshTelegramStatus: () => Promise<void>;
  bindTelegram: () => Promise<TelegramBindingLink | null>;
  unbindTelegram: () => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  tempEmail: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState('');
  const [tempCredentials, setTempCredentials] = useState<AuthCredentials | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // Инициализация при запуске
  useEffect(() => {
    const initAuth = async () => {
      try {
        await AuthService.init();
        const token = AuthService.getAuthToken();
        
        if (token && AuthService.isTokenValid()) {
          const savedUser = await AuthService.getCurrentUser();
          if (savedUser) {
            setUser(savedUser);
            setCurrentToken(token);
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const isAuthenticated = user !== null && currentToken !== null && AuthService.isTokenValid();

  const login = useCallback(async (credentials: AuthCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔐 AuthContext.login: Starting login...', credentials.email);
      const response = await AuthService.login(credentials);

      if (!response.success) {
        throw new Error(response.error || 'Ошибка входа');
      }

      if (response.data) {
        setUser(response.data.user);
        setCurrentToken(response.data.token);
      }

      console.log('🔐 AuthContext.login: Login successful!');
    } catch (err) {
      console.error('🔐 AuthContext.login: Error', err);
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
      setTempCredentials({ email: data.email, password: data.password });
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

  const resendCode = useCallback(async (email: string) => {
    setError(null);
    try {
      const response = await AuthService.resendCode(email);
      if (!response.success) {
        throw new Error(response.error || 'Ошибка отправки кода');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка отправки кода';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (profile: Partial<UserProfile>) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!currentToken && tempCredentials) {
        await login(tempCredentials);
        setTempCredentials(null);
      }

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
  }, [currentToken, tempCredentials, login]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      setCurrentToken(null);
      setTempCredentials(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshTelegramStatus = useCallback(async () => {
    if (!currentToken) return;
    try {
      const response = await TelegramService.getStatus(currentToken);
      if (response.success && user) {
        setUser({
          ...user,
          telegram_registered: response.data.status === 'active',
          telegram_info: {
            chat_id: response.data.chat_id || 0,
            status: response.data.status,
            updated_at: response.data.updated_at || new Date().toISOString(),
            username: response.data.username,
          },
        });
      }
    } catch (err) {
      console.error('Refresh telegram status error:', err);
    }
  }, [currentToken, user]);

  const bindTelegram = useCallback(async (): Promise<TelegramBindingLink | null> => {
    if (!currentToken) return null;
    try {
      const response = await TelegramService.getBindingLink(currentToken);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Bind telegram error:', err);
      return null;
    }
  }, [currentToken]);

  const unbindTelegram = useCallback(async () => {
    if (!currentToken) return;
    try {
      await TelegramService.unbind(currentToken);
      if (user) {
        setUser({
          ...user,
          telegram_registered: false,
          telegram_info: undefined,
        });
      }
    } catch (err) {
      console.error('Unbind telegram error:', err);
    }
  }, [currentToken, user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      register,
      verify,
      updateProfile,
      logout,
      refreshTelegramStatus,
      bindTelegram,
      unbindTelegram,
      resendCode,
      tempEmail,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      register,
      verify,
      updateProfile,
      logout,
      refreshTelegramStatus,
      bindTelegram,
      unbindTelegram,
      resendCode,
      tempEmail,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
