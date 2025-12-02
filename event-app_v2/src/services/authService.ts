import type { AuthCredentials, RegistrationData, VerificationData, User, UserProfile } from '@/types';

// 🔧 API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/v1/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// API Response Models (из Swagger)
interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: string;
  user: {
    id: string;
    email: string;
    phone?: string;
    verified: boolean;
    created_at: string;
    updated_at: string;
  };
}

interface ErrorResponse {
  code: number;
  error: string;
  message: string;
}

interface VerifyResponse {
  expires_at: string;
  user: {
    created_at: string;
    updated_at: string;
    id: string;
    email: string;
    phone: string;
    role: string;
  verified: boolean;
  };
  access_token: string;
  expires_in: number;
  message: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Парсинг JWT для извлечения данных
const parseJWT = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payloadPart = parts[1];
    if (!payloadPart) return null;
    
    const payload = JSON.parse(atob(payloadPart));
    
    // Проверка срока действия
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Токен истёк
    }
    
    return payload;
  } catch (error) {
    return null;
  }
};

class AuthService {

  /**
   * Проверить существование пользователя по email и/или телефону
   */
  static async checkUser(params: { 
    email?: string; 
    phone?: string; 
  }): Promise<ApiResponse<{ 
    exists: boolean; 
    conflict_type?: 'email' | 'phone' | 'both';
    message?: string;
  }>> {
    try {
      if (!params.email && !params.phone) {
        return {
          success: false,
          error: 'Email или телефон должны быть указаны',
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        return {
          success: false,
          error: errorData.message || 'Ошибка проверки',
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          exists: data.exists || false,
          conflict_type: data.conflict_type,
          message: data.message,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка сети',
      };
    }
  }

  /**
   * Регистрация нового пользователя
   */
  static async register(
    data: RegistrationData,
    verification_type?: 'email' | 'sms' | 'telegram'
  ): Promise<ApiResponse<{ user: User; verifyCode: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          phone: data.phone || '',
          verification_type: verification_type || 'email',
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        return {
          success: false,
          error: errorData.message || 'Ошибка регистрации',
        };
      }

      const responseData = await response.json();
      
      // API возвращает { user: User, verify_code: string }
      return {
        success: true,
        data: {
          user: {
            id: responseData.user.id,
            email: responseData.user.email,
            phone: responseData.user.phone || '',
            firstName: '',
            lastName: '',
            createdAt: responseData.user.created_at,
          },
          verifyCode: responseData.verify_code,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка регистрации',
      };
    }
  }

  /**
   * Повторная отправка кода верификации
   */
  static async resendCode(email: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        return {
          success: false,
          error: errorData.message || 'Ошибка отправки кода',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка отправки кода',
      };
    }
  }

  /**
   * Верификация кода подтверждения
   */
  static async verify(data: VerificationData): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      console.log('🔐 AuthService.verify: Sending verification request', data);
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          code: data.code,
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        console.error('🔐 AuthService.verify: Verification failed', errorData);
        return {
          success: false,
          error: errorData.message || 'Неверный код подтверждения',
        };
      }

      const verifyResponse: VerifyResponse = await response.json();
      console.log('🔐 AuthService.verify: Response received', JSON.stringify(verifyResponse, null, 2));

      // Проверяем что verified точно boolean true, а не truthy значение
      if (verifyResponse.user.verified !== true) {
        console.log(
          "🔐 AuthService.verify: Verification failed, verified=",
          verifyResponse.user.verified,
          "type=",
          typeof verifyResponse.user.verified
        );
        return {
          success: false,
          error: verifyResponse.message || 'Верификация не прошла',
        };
      }

      // Сохраняем токен, который возвращает API при успешной верификации
      if (verifyResponse.access_token) {
        this.setAuthCookie(verifyResponse.access_token);
        console.log('🔐 AuthService.verify: Token saved from verify response');
      }

      return {
        success: true,
        data: {
          token: verifyResponse.access_token || '',
          user: {
            id: verifyResponse.user.id,
            email: verifyResponse.user.email,
            phone: verifyResponse.user.phone || '',
            firstName: '',
            lastName: '',
            createdAt: verifyResponse.user.created_at,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка верификации',
      };
    }
  }

  /**
   * Вход в систему
   */
  static async login(credentials: AuthCredentials): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        return {
          success: false,
          error: errorData.message || 'Неверные учетные данные',
        };
      }

      const authResponse: AuthResponse = await response.json();

      // Сохраняем токен в sessionStorage
      this.setAuthCookie(authResponse.access_token);

      return {
        success: true,
        data: {
          token: authResponse.access_token, // TODO: удалить обязательно и не испольщовать
          user: {
            id: authResponse.user.id,
            email: authResponse.user.email,
            phone: authResponse.user.phone || '',
            firstName: '',
            lastName: '',
            createdAt: authResponse.user.created_at,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка входа',
      };
    }
  }

  /**
   * Обновление профиля
   */
  static async updateProfile(
    token: string,
    profile: Partial<UserProfile>
  ): Promise<ApiResponse<User>> {
    try {

      const payload = parseJWT(token);
      if (!payload) {
        return {
          success: false,
          error: 'Неверный или истёкший токен',
        };
      }

      // TODO: не реализован функционал обновления профиля на бэкенде
      // Временная заглушка - возвращаем успех с частичными данными
      return {
        success: true,
        data: {
          id: payload.userId,
          email: payload.email,
          phone: '',
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          city: profile.city || '',
          bio: profile.bio || '',
          interests: profile.interests || [],
          avatar: profile.avatar || '',
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка обновления профиля',
      };
    }
  }

  /**
   * Получение текущего пользователя
   */
  static async getCurrentUser(token: string): Promise<ApiResponse<User>> {
    try {
      const payload = parseJWT(token);
      if (!payload) {
        return {
          success: false,
          error: 'Неверный или истёкший токен',
        };
      }

      // Call actual /me endpoint to get user profile with telegram info
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        // Fallback to token data if endpoint not ready
        return {
          success: true,
          data: {
            id: payload.userId,
            email: payload.email,
            phone: '',
            firstName: '',
            lastName: '',
            createdAt: new Date().toISOString(),
          },
        };
      }

      const userData = await response.json();

      return {
        success: true,
        data: {
          id: userData.id || payload.userId,
          email: userData.email || payload.email,
          phone: userData.phone || '',
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          city: userData.city || '',
          bio: userData.bio || '',
          interests: userData.interests || [],
          avatar: userData.avatar || '',
          createdAt: userData.createdAt || userData.created_at || new Date().toISOString(),
          telegram_registered: userData.telegram_registered || false,
          telegram_info: userData.telegram_info || undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка получения данных пользователя',
      };
    }
  }

  /**
   * Выход из системы
   */
  static async logout(): Promise<ApiResponse<null>> {
    try {
      const token = this.getAuthToken();
      
      if (token) {
        // Вызываем API logout
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });
      }

      // Очищаем локальный токен независимо от результата API
      this.clearAuthCookie();
      return { success: true };
    } catch (error) {
      // Даже при ошибке очищаем токен
      this.clearAuthCookie();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка выхода',
      };
    }
  }

  /**
   * Сохранение токена в "HTTPOnly cookie" (имитация)
   * В реальном приложении это делается через HTTP заголов Set-Cookie на сервере
   */
  private static setAuthCookie(token: string): void {
    // Имитация HTTPOnly cookie
    // В реальности: Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Strict;
    try {
      // Сохраняем в sessionStorage как демонстрация (в реальности это делается на уровне браузера)
      sessionStorage.setItem('_auth_token', token);
      localStorage.setItem('_token_hint', token.substring(0, 20) + '...'); // Только для логирования
    } catch (e) {
      console.warn('Failed to set auth cookie');
    }
  }

  /**
   * Удаление токена из "HTTPOnly cookie" (имитация)
   */
  private static clearAuthCookie(): void {
    try {
      sessionStorage.removeItem('_auth_token');
      localStorage.removeItem('_token_hint');
    } catch (e) {
      console.warn('Failed to clear auth cookie');
    }
  }

  /**
   * Получение текущего токена из "HTTPOnly cookie" (имитация)
   */
  static getAuthToken(): string | null {
    try {
      return sessionStorage.getItem('_auth_token');
    } catch (e) {
      return null;
    }
  }

  /**
   * Проверка, валиден ли текущий токен
   */
  static isTokenValid(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;
    return parseJWT(token) !== null;
  }
}

export default AuthService;
export { parseJWT, type JwtPayload };
