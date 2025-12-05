import type { 
  Event, 
  EventDetails, 
  EventBatchResponse, 
  CategoryStatsResponse,
  CreateEventData,
  ApiResponse 
} from '@/types';

// Используем IP адрес для доступа с мобильного устройства/симулятора
// localhost не работает на реальных устройствах
const API_BASE_URL = 'http://192.168.100.28:8080/v1/api';

// Безопасный парсинг JSON (сервер может вернуть HTML при ошибках)
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

class EventApi {
  private token: string | null = null;

  setToken(token: string | null): void {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async getEvents(offset = 0, limit = 10): Promise<EventBatchResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/events?offset=${offset}&limit=${limit}`,
        { headers: this.getHeaders() }
      );
      const result = await safeParseResponse<Event[]>(response);
      return {
        success: result.success,
        data: result.data || [],
        pagination: { offset, limit, total: 0, hasMore: false },
        error: result.error,
      };
    } catch (error) {
      console.error('Get events error:', error);
      return {
        success: false,
        data: [],
        pagination: { offset, limit, total: 0, hasMore: false },
      };
    }
  }

  async getEventById(id: number): Promise<ApiResponse<EventDetails>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/events/${id}`,
        { headers: this.getHeaders() }
      );
      return await safeParseResponse<EventDetails>(response) as ApiResponse<EventDetails>;
    } catch (error) {
      console.error('Get event by id error:', error);
      return {
        success: false,
        data: {} as EventDetails,
        error: 'Ошибка загрузки события',
      };
    }
  }

  async getEventsByCategory(category: string, offset = 0, limit = 10): Promise<EventBatchResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/events/category/${encodeURIComponent(category)}?offset=${offset}&limit=${limit}`,
        { headers: this.getHeaders() }
      );
      const result = await safeParseResponse<Event[]>(response);
      return {
        success: result.success,
        data: result.data || [],
        pagination: { offset, limit, total: 0, hasMore: false },
        error: result.error,
      };
    } catch (error) {
      console.error('Get events by category error:', error);
      return {
        success: false,
        data: [],
        pagination: { offset, limit, total: 0, hasMore: false },
      };
    }
  }

  async getCategoryStats(): Promise<CategoryStatsResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/events/categories/stats`,
        { headers: this.getHeaders() }
      );
      const result = await safeParseResponse<CategoryStatsResponse['data']>(response);
      return {
        success: result.success,
        data: result.data || [],
      };
    } catch (error) {
      console.error('Get category stats error:', error);
      return {
        success: false,
        data: [],
      };
    }
  }

  async searchEvents(query: string, offset = 0, limit = 10): Promise<EventBatchResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/events/search?q=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}`,
        { headers: this.getHeaders() }
      );
      const result = await safeParseResponse<Event[]>(response);
      return {
        success: result.success,
        data: result.data || [],
        pagination: { offset, limit, total: 0, hasMore: false },
        error: result.error,
      };
    } catch (error) {
      console.error('Search events error:', error);
      return {
        success: false,
        data: [],
        pagination: { offset, limit, total: 0, hasMore: false },
      };
    }
  }

  async createEvent(data: CreateEventData): Promise<ApiResponse<Event>> {
    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await safeParseResponse<Event>(response) as ApiResponse<Event>;
    } catch (error) {
      console.error('Create event error:', error);
      return {
        success: false,
        data: {} as Event,
        error: 'Ошибка создания события',
      };
    }
  }

  async joinEvent(eventId: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/join`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      return await safeParseResponse<{ message: string }>(response) as ApiResponse<{ message: string }>;
    } catch (error) {
      console.error('Join event error:', error);
      return {
        success: false,
        data: { message: '' },
        error: 'Ошибка записи на событие',
      };
    }
  }

  async leaveEvent(eventId: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/leave`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      return await safeParseResponse<{ message: string }>(response) as ApiResponse<{ message: string }>;
    } catch (error) {
      console.error('Leave event error:', error);
      return {
        success: false,
        data: { message: '' },
        error: 'Ошибка отмены записи',
      };
    }
  }

  async getMyEvents(): Promise<EventBatchResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/events/my`,
        { headers: this.getHeaders() }
      );
      const result = await safeParseResponse<Event[]>(response);
      return {
        success: result.success,
        data: result.data || [],
        pagination: { offset: 0, limit: 10, total: 0, hasMore: false },
        error: result.error,
      };
    } catch (error) {
      console.error('Get my events error:', error);
      return {
        success: false,
        data: [],
        pagination: { offset: 0, limit: 10, total: 0, hasMore: false },
      };
    }
  }

  async getPublicEvent(eventId: number): Promise<ApiResponse<EventDetails>> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/public/${eventId}`);
      return await safeParseResponse<EventDetails>(response) as ApiResponse<EventDetails>;
    } catch (error) {
      console.error('Get public event error:', error);
      return {
        success: false,
        data: {} as EventDetails,
        error: 'Ошибка загрузки события',
      };
    }
  }
}

export default new EventApi();
