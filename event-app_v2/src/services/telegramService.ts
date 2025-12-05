import type { TelegramBindingLink, TelegramStatus } from '@/types';

// 🔧 API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/v1/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ErrorResponse {
  code?: number;
  error: string;
  message?: string;
}

// Lightweight bound check response
interface BoundCheckResponse {
  is_bound: boolean;
  status: string;
}

/**
 * Service for Telegram Bot Integration
 * Handles binding links, status checks, and unbinding
 */
class TelegramService {
  /**
   * Get auth token from session storage
   */
  private static getAuthToken(): string | null {
    try {
      return sessionStorage.getItem('_auth_token');
    } catch (e) {
      return null;
    }
  }

  /**
   * Lightweight check if Telegram is bound
   * GET /v1/api/notifications/telegram/bound
   * Use for quick status indicator (green/gray icon)
   */
  static async checkBound(): Promise<ApiResponse<BoundCheckResponse>> {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Требуется авторизация',
        };
      }

      const response = await fetch(`${API_BASE_URL}/notifications/telegram/bound`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        return {
          success: false,
          error: 'Требуется авторизация',
        };
      }

      if (!response.ok) {
        return {
          success: true,
          data: { is_bound: false, status: '' },
        };
      }

      const data: BoundCheckResponse = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка проверки привязки',
      };
    }
  }

  /**
   * Request a new Telegram binding link
   * POST /v1/api/notifications/telegram/link
   * Returns deep link with time-limited, HMAC-signed token
   */
  static async requestBindingLink(): Promise<ApiResponse<TelegramBindingLink>> {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Требуется авторизация',
        };
      }

      const response = await fetch(`${API_BASE_URL}/notifications/telegram/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        return {
          success: false,
          error: errorData.message || errorData.error || 'Ошибка получения ссылки для привязки',
        };
      }

      const linkData: TelegramBindingLink = await response.json();

      return {
        success: true,
        data: linkData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка получения ссылки для привязки',
      };
    }
  }

  /**
   * Check current Telegram binding status
   * GET /v1/api/notifications/telegram/status
   * Returns 200 if bound, 404 if not bound
   */
  static async checkStatus(): Promise<ApiResponse<TelegramStatus>> {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Требуется авторизация',
        };
      }

      const response = await fetch(`${API_BASE_URL}/notifications/telegram/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        // Not bound yet
        return {
          success: true,
          data: {
            status: 'inactive',
          },
        };
      }

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        return {
          success: false,
          error: errorData.message || errorData.error || 'Ошибка проверки статуса',
        };
      }

      const statusData: TelegramStatus = await response.json();

      return {
        success: true,
        data: statusData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка проверки статуса',
      };
    }
  }

  /**
   * Unbind Telegram account
   * POST /v1/api/notifications/telegram/unbind
   * 200 = success, 404 = already unbound (treat as success), 503 = service unavailable
   */
  static async unbind(): Promise<ApiResponse<null>> {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Требуется авторизация',
        };
      }

      const response = await fetch(`${API_BASE_URL}/notifications/telegram/unbind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      // Success
      if (response.ok) {
        return {
          success: true,
          data: null,
        };
      }

      // 404 = telegram_not_bound — user already unbound, treat as success
      if (response.status === 404) {
        return {
          success: true,
          data: null,
        };
      }

      // 401 = unauthorized
      if (response.status === 401) {
        return {
          success: false,
          error: 'Требуется авторизация',
        };
      }

      // 503 = service unavailable
      if (response.status === 503) {
        return {
          success: false,
          error: 'Сервис временно недоступен. Попробуйте позже.',
        };
      }

      // Other errors
      const errorData: ErrorResponse = await response.json();
      return {
        success: false,
        error: errorData.message || errorData.error || 'Ошибка отключения',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Сервис недоступен. Попробуйте позже.',
      };
    }
  }

  /**
   * Open Telegram deep link in a new window/tab
   */
  static openTelegramLink(deeplink: string): void {
    window.open(deeplink, '_blank', 'noopener,noreferrer');
  }

  /**
   * Copy deep link to clipboard
   */
  static async copyToClipboard(deeplink: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(deeplink);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Check if a binding token has expired
   */
  static isTokenExpired(expiresAt: string): boolean {
    try {
      const expiryTime = new Date(expiresAt).getTime();
      const now = Date.now();
      return now >= expiryTime;
    } catch (error) {
      return true; // Assume expired if parsing fails
    }
  }

  /**
   * Get time remaining until token expires (in seconds)
   */
  static getTimeRemaining(expiresAt: string): number {
    try {
      const expiryTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.floor((expiryTime - now) / 1000);
      return remaining > 0 ? remaining : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Format time remaining as human-readable string
   */
  static formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return 'истёк';
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes} мин ${secs} сек`;
    }
    return `${secs} сек`;
  }
}

export default TelegramService;
