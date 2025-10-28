import type { AuthCredentials, RegistrationData, VerificationData, User, UserProfile } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Имитация JWT токена (в реальности это создается на сервере)
const generateMockJWT = (userId: string, email: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 дней
  }));
  const signature = btoa('mock-secret-key');
  return `${header}.${payload}.${signature}`;
};

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
  private static VERIFICATION_CODES: Map<string, { code: string; timestamp: number }> = new Map();

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
  static async register(data: RegistrationData): Promise<ApiResponse<{ email: string }>> {
    try {
      await this.simulateDelay();

      // Проверка на существующего пользователя
      if (this.MOCK_USERS.has(data.email)) {
        return {
          success: false,
          error: 'Пользователь с таким email уже существует',
        };
      }

      // Генерируем код верификации
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      this.VERIFICATION_CODES.set(data.email, {
        code: verificationCode,
        timestamp: Date.now(),
      });

      // Сохраняем временного пользователя (не верифицирован)
      const newUser = {
        id: Date.now().toString(),
        email: data.email,
        password: data.password,
        firstName: '',
        lastName: '',
        verified: false,
        createdAt: new Date().toISOString(),
      } as const;
      
      if (data.phone) {
        Object.assign(newUser, { phone: data.phone });
      }
      
      this.MOCK_USERS.set(data.email, newUser as any);

      // В реальном приложении здесь отправляется email/SMS
      console.log(`[AUTH] Verification code for ${data.email}: ${verificationCode}`);

      return {
        success: true,
        data: { email: data.email },
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
      await this.simulateDelay();

      const verificationData = this.VERIFICATION_CODES.get(data.email);

      // Проверка кода (для тестирования используем '123456')
      if (!verificationData && data.code !== '123456') {
        return {
          success: false,
          error: 'Неверный код подтверждения',
        };
      }

      // Проверка истечения кода (15 минут)
      if (verificationData && Date.now() - verificationData.timestamp > 15 * 60 * 1000) {
        return {
          success: false,
          error: 'Код подтверждения истёк',
        };
      }

      const user = this.MOCK_USERS.get(data.email);
      if (!user) {
        return {
          success: false,
          error: 'Пользователь не найден',
        };
      }

      // Отмечаем пользователя как верифицированного
      user.verified = true;

      // Генерируем JWT токен
      const token = generateMockJWT(user.id, user.email);

      // Сохраняем токен в "HTTPOnly cookie" (в браузере это делается через HTTP заголовки)
      this.setAuthCookie(token);

      // Очищаем код верификации
      this.VERIFICATION_CODES.delete(data.email);

      const { password, verified, ...userWithoutSensitive } = user;

      return {
        success: true,
        data: {
          token,
          user: userWithoutSensitive,
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
      await this.simulateDelay();

      const user = this.MOCK_USERS.get(credentials.email);

      if (!user) {
        return {
          success: false,
          error: 'Неверный email или пароль',
        };
      }

      // Проверка пароля (в реальности это был бы bcrypt.compare)
      if (user.password !== credentials.password) {
        return {
          success: false,
          error: 'Неверный email или пароль',
        };
      }

      if (!user.verified) {
        return {
          success: false,
          error: 'Пользователь не верифицирован. Пожалуйста, подтвердите email.',
        };
      }

      // Генерируем JWT токен
      const token = generateMockJWT(user.id, user.email);

      // Сохраняем токен в "HTTPOnly cookie"
      this.setAuthCookie(token);

      const { password, verified, ...userWithoutSensitive } = user;

      return {
        success: true,
        data: {
          token,
          user: userWithoutSensitive,
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
      // Удаляем "HTTPOnly cookie"
      this.clearAuthCookie();
      return { success: true };
    } catch (error) {
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
export { generateMockJWT, parseJWT, type JwtPayload };
