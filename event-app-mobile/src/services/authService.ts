import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  AuthCredentials, 
  RegistrationData, 
  VerificationData,
  UserProfile,
  User,
  LoginResponse,
  RegisterResponse,
  ApiResponse
} from '@/types';

// 🔧 API Configuration
// Для разработки используйте IP вашей машины (не localhost!)
// На Mac можно узнать через: ipconfig getifaddr en0
const API_BASE_URL = 'http://192.168.100.28:8080/v1/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Безопасный парсинг JSON ответа
async function safeParseResponse<T>(response: Response): Promise<{ success: boolean; data?: T; error?: string }> {
  const text = await response.text();
  
  try {
    return JSON.parse(text);
  } catch {
    console.error('Failed to parse response:', text.substring(0, 200));
    return {
      success: false,
      error: response.ok ? 'Неверный формат ответа сервера' : `Ошибка сервера: ${response.status}`,
    };
  }
}

class AuthService {
  private token: string | null = null;

  async init(): Promise<void> {
    try {
      this.token = await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }

  getAuthToken(): string | null {
    return this.token;
  }

  async setAuthToken(token: string): Promise<void> {
    this.token = token;
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }

  async removeAuthToken(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  }

  isTokenValid(): boolean {
    if (!this.token) return false;
    
    try {
      // Декодируем JWT токен (без верификации подписи)
      const parts = this.token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp * 1000; // в миллисекунды
      
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  async login(credentials: AuthCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await safeParseResponse<{ user: User; token: string }>(response);

      if (data.success && data.data?.token) {
        await this.setAuthToken(data.data.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      }

      return data as LoginResponse;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Ошибка сети. Попробуйте позже.',
      };
    }
  }

  async register(data: RegistrationData): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          phone: data.phone,
        }),
      });

      return await safeParseResponse<{ message: string }>(response) as RegisterResponse;
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'Ошибка сети. Попробуйте позже.',
      };
    }
  }

  async verify(data: VerificationData): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await safeParseResponse<{ user: User; token: string }>(response);

      if (result.success && result.data?.token) {
        await this.setAuthToken(result.data.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
      }

      return result as LoginResponse;
    } catch (error) {
      console.error('Verify error:', error);
      return {
        success: false,
        error: 'Ошибка сети. Попробуйте позже.',
      };
    }
  }

  async resendCode(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return await safeParseResponse<{ message: string }>(response) as ApiResponse<{ message: string }>;
    } catch (error) {
      console.error('Resend code error:', error);
      return {
        success: false,
        data: { message: '' },
        error: 'Ошибка сети. Попробуйте позже.',
      };
    }
  }

  async updateProfile(token: string, profile: Partial<UserProfile>): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const result = await safeParseResponse<User>(response);

      if (result.success && result.data) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.data));
      }

      return result as ApiResponse<User>;
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        data: {} as User,
        error: 'Ошибка сети. Попробуйте позже.',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.removeAuthToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}

export default new AuthService();
