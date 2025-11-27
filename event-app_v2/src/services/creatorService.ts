import AuthService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/v1/api';

// Типы для Creator Events API
export type EventStatus = 'pending' | 'needs_revision' | 'approved' | 'rejected' | 'blocked';

export interface CreatorEvent {
  id: string;
  type: string;
  startTime: string;
  endTime: string;
  duration: number;
  place: string;
  priceType: string;
  needRegistration: boolean;
  details?: {
    title?: string;
    description?: string;
    tags?: string[];
    capacity?: number;
    price?: number;
    speaker?: string;
    image?: string;
  };
  status: EventStatus;
  reviewComment: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedEvent extends CreatorEvent {
  blockReason: string;
  blockedAt: string;
}

export interface CreatorEventsResponse {
  pending: CreatorEvent[];
  active: CreatorEvent[];
  rejected: CreatorEvent[];
}

export interface ReviewComment {
  id: number;
  eventId: string;
  authorId: string;
  authorRole: 'admin' | 'creator';
  comment: string;
  createdAt: string;
}

// Хелпер для получения названия события
export const getEventTitle = (event: CreatorEvent): string => {
  return event.details?.title || `${event.type} событие`;
};

// Хелпер для получения описания
export const getEventDescription = (event: CreatorEvent): string => {
  return event.details?.description || '';
};

// Маппинг статусов на русский
export const STATUS_LABELS: Record<EventStatus, string> = {
  pending: 'На проверке',
  needs_revision: 'Требует доработки',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  blocked: 'Заблокировано',
};

// Цвета статусов
export const STATUS_COLORS: Record<EventStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', dot: '#eab308' },
  needs_revision: { bg: 'rgba(249, 115, 22, 0.1)', text: '#c2410c', dot: '#f97316' },
  approved: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', dot: '#22c55e' },
  rejected: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', dot: '#ef4444' },
  blocked: { bg: 'rgba(0, 0, 0, 0.1)', text: '#374151', dot: '#1f2937' },
};

export const creatorService = {
  /**
   * Получить все события автора (сгруппированные по статусам)
   */
  async getMyEvents(): Promise<CreatorEventsResponse> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/creator/events`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized');
      throw new Error('Failed to fetch creator events');
    }

    return response.json();
  },

  /**
   * Получить заблокированные события
   */
  async getBlockedEvents(): Promise<BlockedEvent[]> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/creator/events/blocked`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized');
      throw new Error('Failed to fetch blocked events');
    }

    return response.json();
  },

  /**
   * Получить комментарии модерации для события
   */
  async getEventComments(eventId: string): Promise<ReviewComment[]> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/creator/events/${eventId}/comments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized');
      if (response.status === 404) throw new Error('Event not found');
      throw new Error('Failed to fetch comments');
    }

    return response.json();
  },

  /**
   * Добавить комментарий к событию
   */
  async addComment(eventId: string, comment: string): Promise<void> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/creator/events/${eventId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ comment }),
    });

    if (!response.ok) {
      if (response.status === 400) throw new Error('Invalid comment');
      if (response.status === 401) throw new Error('Unauthorized');
      throw new Error('Failed to add comment');
    }
  },
};

export default creatorService;
