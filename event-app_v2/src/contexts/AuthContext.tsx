import { createContext, useContext, useState, useCallback, useMemo, ReactNode, FC } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  // Инициализируем user из токена если он существует
  const [user, setUser] = useState<User | null>(() => {
    const token = AuthService.getAuthToken();
    if (token && AuthService.isTokenValid()) {
      // Возвращаем временного пользователя если токен валиден
      return {
        id: 'temp',
        email: '',
        phone: '',
        firstName: '',
        lastName: '',
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState('');
  const [tempCredentials, setTempCredentials] = useState<AuthCredentials | null>(null);
  const [currentToken, setCurrentToken] = useState(AuthService.getAuthToken() || '');

  // Вычисляемое значение isAuthenticated
  const isAuthenticated = user !== null && AuthService.isTokenValid();

  const logStatus = useCallback(() => {
    console.log('🔐 AuthContext: user=', user?.id, 'isAuthenticated=', isAuthenticated, 'tokenValid=', AuthService.isTokenValid());
  }, [user, isAuthenticated]);

  const login = useCallback(async (credentials: AuthCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔐 AuthContext.login: Starting login...', credentials.email);
      const response = await AuthService.login(credentials);

      console.log('🔐 AuthContext.login: Response received', response);

      if (!response.success) {
        throw new Error(response.error || 'Ошибка входа');
      }

      if (response.data) {
        console.log('🔐 AuthContext.login: Setting user and token', response.data.user, response.data.token);
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
    logStatus();
  }, [logStatus]);

  const register = useCallback(async (data: RegistrationData) => {
    console.log('🟢 AuthContext: Showing main app, isAuthenticated=', isAuthenticated);
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
  }, [isAuthenticated]);

  const verify = useCallback(async (code: string, method: 'sms' | 'email') => {
    setError(null);
    try {
      const response = await AuthService.verify({ email: tempEmail, code, method });

      if (!response.success) {
        throw new Error(response.error || 'Ошибка верификации');
      }

      // После верификации НЕ логинимся автоматически - пользователь сначала заполнит профиль
      console.log('🔐 AuthContext.verify: Verification successful, waiting for profile completion');
      
      // Сохраняем временные данные для последующей авторизации после заполнения профиля
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
      let token = currentToken;

      // Если нет токена, но есть tempCredentials - сначала логинимся
      if (!token && tempCredentials) {
        console.log('🔐 AuthContext.updateProfile: Logging in first with stored credentials');
        await login(tempCredentials);
        setTempCredentials(null);
        // Получаем токен напрямую из сервиса, так как стейт еще не обновился
        token = AuthService.getAuthToken() || '';
      }

      if (!token) {
        throw new Error('Нет активной сессии');
      }

      const response = await AuthService.updateProfile(token, profile);

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
      setCurrentToken('');
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
      const response = await AuthService.getCurrentUser(currentToken);
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error refreshing telegram status:', error);
    }
  }, [currentToken]);

  const bindTelegram = useCallback(async (): Promise<TelegramBindingLink | null> => {
    if (!currentToken) return null;
    try {
      const response = await TelegramService.requestBindingLink();
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error binding telegram:', error);
      return null;
    }
  }, [currentToken]);

  const unbindTelegram = useCallback(async () => {
    if (!currentToken) return;
    try {
      await TelegramService.unbind();
      await refreshTelegramStatus();
    } catch (error) {
      console.error('Error unbinding telegram:', error);
      throw error;
    }
  }, [currentToken, refreshTelegramStatus]);

  const contextValue = useMemo(() => ({
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
    resendCode
  }), [
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
    resendCode
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
