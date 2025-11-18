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
   * Currently handled via bot command /unsubscribe
   * This method is a placeholder for potential future API endpoint
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

      // Check if there's a dedicated unbind endpoint
      // If not implemented, instruct user to use /unsubscribe in bot
      const response = await fetch(`${API_BASE_URL}/notifications/telegram/unbind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If endpoint doesn't exist (404), return instruction
        if (response.status === 404) {
          return {
            success: false,
            error: 'Для отключения используйте команду /unsubscribe в боте Telegram',
          };
        }

        const errorData: ErrorResponse = await response.json();
        return {
          success: false,
          error: errorData.message || errorData.error || 'Ошибка отключения',
        };
      }

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Для отключения используйте команду /unsubscribe в боте Telegram',
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
