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
  verified: boolean;
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
  private static MOCK_USERS: Map<string, User & { password: string; verified: boolean }> = new Map();

  // Инициализация mock данных
  static {
    // Добавляем тестового пользователя
    this.MOCK_USERS.set("test@example.com", {
      id: "1",
      email: "test@example.com",
      password: "password123", // В реальности это был бы хеш
      firstName: "Test",
      lastName: "User",
      verified: true,
      createdAt: new Date().toISOString(),
    });
    this.MOCK_USERS.set("admin@example.com", {
      id: "2",
      email: "admin@example.com",
      password: "admin123", // В реальности это был бы хеш
      firstName: "Admin",
      lastName: "User",
      verified: true,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Регистрация нового пользователя
   */
  static async register(data: RegistrationData): Promise<ApiResponse<{ user: User; verifyCode: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          phone: data.phone || '',
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
   * Верификация кода подтверждения
   */
  static async verify(data: VerificationData): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          code: data.code,
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        return {
          success: false,
          error: errorData.message || 'Неверный код подтверждения',
        };
      }

      const verifyResponse: VerifyResponse = await response.json();

      if (!verifyResponse.verified) {
        return {
          success: false,
          error: 'Верификация не прошла',
        };
      }

      // После успешной верификации нужно залогиниться
      // (API verify не возвращает токен, только подтверждение)
      // Поэтому возвращаем успех без токена, приложение должно показать форму входа
      return {
        success: true,
        data: {
          token: '', // Пустой токен, требуется логин
          user: {
            id: '',
            email: data.email,
            phone: '',
            firstName: '',
            lastName: '',
            createdAt: new Date().toISOString(),
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
          token: authResponse.access_token,
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
      await this.simulateDelay();

      const payload = parseJWT(token);
      if (!payload) {
        return {
          success: false,
          error: 'Неверный или истёкший токен',
        };
      }

      const user = this.MOCK_USERS.get(payload.email);
      if (!user) {
        return {
          success: false,
          error: 'Пользователь не найден',
        };
      }

      // Обновляем профиль
      if (profile.firstName) user.firstName = profile.firstName;
      if (profile.lastName) user.lastName = profile.lastName;
      if (profile.city) user.city = profile.city;
      if (profile.bio) user.bio = profile.bio;
      if (profile.interests) user.interests = profile.interests;
      if (profile.avatar) user.avatar = profile.avatar;

      const { password, verified, ...userWithoutSensitive } = user;

      return {
        success: true,
        data: userWithoutSensitive,
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
      await this.simulateDelay();

      const payload = parseJWT(token);
      if (!payload) {
        return {
          success: false,
          error: 'Неверный или истёкший токен',
        };
      }

      const user = this.MOCK_USERS.get(payload.email);
      if (!user) {
        return {
          success: false,
          error: 'Пользователь не найден',
        };
      }

      const { password, verified, ...userWithoutSensitive } = user;

      return {
        success: true,
        data: userWithoutSensitive,
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

  /**
   * Имитация задержки сети
   */
  private static simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 800));
  }
}

export default AuthService;
export { parseJWT, type JwtPayload };
