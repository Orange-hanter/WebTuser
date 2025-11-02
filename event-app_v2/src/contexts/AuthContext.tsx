import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import AuthService from '@/services/authService';
import type { User, AuthCredentials, RegistrationData, UserProfile } from '@/types';

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

  const logStatus = () => {
    console.log('🔐 AuthContext: user=', user?.id, 'isAuthenticated=', isAuthenticated, 'tokenValid=', AuthService.isTokenValid());
  };

  const login = async (credentials: AuthCredentials) => {
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
  };

  const register = async (data: RegistrationData) => {
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
  };

  const verify = async (code: string, method: 'sms' | 'email') => {
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
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Если нет токена, но есть tempCredentials - сначала логинимся
      if (!currentToken && tempCredentials) {
        console.log('🔐 AuthContext.updateProfile: Logging in first with stored credentials');
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
        console.log('🔐 AuthContext.updateProfile: Profile updated successfully', response.data);
        setUser(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления профиля';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🔐 AuthContext.logout: Starting logout...');
      await AuthService.logout();
      setUser(null);
      setCurrentToken('');
      setTempEmail('');
      setTempCredentials(null);
      console.log('🔐 AuthContext.logout: Logout successful');
      logStatus();
    } catch (err) {
      console.error('🔐 AuthContext.logout: Error', err);
    }
  };

  // Логируем изменения состояния авторизации
  useEffect(() => {
    console.log('🔐 AuthContext: Auth state changed', { 
      isAuthenticated, 
      userId: user?.id,
      hasToken: !!currentToken 
    });
  }, [isAuthenticated, user, currentToken]);

  useEffect(() => {
    console.log('👤 user changed:', user);
  }, [user]);

  useEffect(() => {
    console.log('🔒 isAuthenticated changed:', isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    console.log('⏳ isLoading changed:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    console.log('❌ error changed:', error);
  }, [error]);

  useEffect(() => {
    console.log('🎫 currentToken changed:', currentToken ? 'exists' : 'empty');
  }, [currentToken]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    verify,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
