import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { TelegramBindingLink, TelegramStatus, ApiResponse } from '@/types';

// Используем IP адрес для доступа с мобильного устройства/симулятора
const API_BASE_URL = 'http://192.168.100.28:8080/v1/api';

// Безопасный парсинг JSON
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

class TelegramService {
  async getBindingLink(token: string): Promise<ApiResponse<TelegramBindingLink>> {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/bind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      return await safeParseResponse<TelegramBindingLink>(response) as ApiResponse<TelegramBindingLink>;
    } catch (error) {
      console.error('Get binding link error:', error);
      return {
        success: false,
        data: {} as TelegramBindingLink,
        error: 'Ошибка сети. Попробуйте позже.',
      };
    }
  }

  async getStatus(token: string): Promise<ApiResponse<TelegramStatus>> {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return await safeParseResponse<TelegramStatus>(response) as ApiResponse<TelegramStatus>;
    } catch (error) {
      console.error('Get telegram status error:', error);
      return {
        success: false,
        data: {} as TelegramStatus,
        error: 'Ошибка сети. Попробуйте позже.',
      };
    }
  }

  async unbind(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/unbind`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return await safeParseResponse<{ message: string }>(response) as ApiResponse<{ message: string }>;
    } catch (error) {
      console.error('Unbind telegram error:', error);
      return {
        success: false,
        data: { message: '' },
        error: 'Ошибка сети. Попробуйте позже.',
      };
    }
  }

  async openTelegramLink(deeplink: string): Promise<void> {
    try {
      // Проверяем, установлен ли Telegram
      const canOpen = await Linking.canOpenURL(deeplink);
      
      if (canOpen) {
        await Linking.openURL(deeplink);
      } else {
        // Если Telegram не установлен, открываем web версию
        const webUrl = deeplink.replace('tg://', 'https://t.me/');
        await WebBrowser.openBrowserAsync(webUrl);
      }
    } catch (error) {
      console.error('Open telegram link error:', error);
      throw error;
    }
  }
}

export default new TelegramService();
