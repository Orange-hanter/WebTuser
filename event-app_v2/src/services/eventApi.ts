// API Service for working with events
// Uses real backend API at api.tuserduser.online

import { Event, EventDetails, EventBatchResponse, EventDetailsResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.tuserduser.online/v1/api';
const EVENTS_BATCH_SIZE = 5; // Number of events to load per batch


// Helper to get auth token from sessionStorage
const getAuthToken = (): string | null => {
  return sessionStorage.getItem('authToken');
};

// Helper to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
};

// Backend event model from Swagger
interface BackendEvent {
  id: string;
  type: string;
  start: string;
  end: string;
  time?: string;
  duration: number; // minutes
  place?: string;
  priceType: string;
  needReg: boolean;
  details?: Record<string, any>;
  imgUrl?: string;
}

// Color mapping for event types
const getColorForType = (type: string): string => {
  const colors: Record<string, string> = {
    'Музыка': '9333EA',      // purple
    'Творчество': 'EC4899',  // pink
    'Общение': '3B82F6',     // blue
    'Искусство': 'F59E0B',   // amber
    'Здоровье': '10B981',    // green
    'Спорт': 'EF4444',       // red
    'Образование': '6366F1', // indigo
    'Развлечения': 'F97316', // orange
    'Бизнес': '8B5CF6',      // violet
  };
  return colors[type] || '6B7280'; // gray as default
};

// Generate placeholder image URL
const getPlaceholderImage = (title: string, type: string): string => {
  const color = getColorForType(type);
  const encodedTitle = encodeURIComponent(title);
  return `https://placehold.co/400x600/${color}/white?text=${encodedTitle}`;
};

// Transform backend event to frontend Event type
const transformBackendEvent = (backendEvent: BackendEvent): Event => {
  // Parse UTC time from backend and convert to local timezone
  const startDate = new Date(backendEvent.start);
  const formattedDate = startDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  let time = backendEvent.time || startDate;
  time = new Date(time).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const title = backendEvent.details?.title || `${backendEvent.type} event`;
  const image = backendEvent.imgUrl 
    || backendEvent.details?.image 
    || getPlaceholderImage(title, backendEvent.type);
  console.log('time:', time, 'formattedDate:', formattedDate);
  return {
    id: parseInt(backendEvent.id, 10) || 0,
    title: title,
    type: backendEvent.type,
    location: backendEvent.place || 'Location TBD',
    time: time,
    date: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
    attendees: backendEvent.details?.attendees || 0,
    rating: backendEvent.details?.rating || 0,
    description: backendEvent.details?.description || '',
    image: image,
    tags: backendEvent.details?.tags || [backendEvent.type, backendEvent.priceType],
  };
};

/**
 * Endpoint 1: Fetch events list
 * GET /v1/api/events
 * @returns {Promise<EventBatchResponse>} Object with events array and metadata
 */
export const fetchEventsBatch = async (offset: number = 0, limit: number = EVENTS_BATCH_SIZE, type?: string): Promise<EventBatchResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/events`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const backendEvents: BackendEvent[] = await response.json();
    
    // Transform backend events to frontend format
    let allEvents = backendEvents.map(transformBackendEvent);
    
    // Apply filtering
    if (type) {
      allEvents = allEvents.filter(event => event.type === type);
    }

    // Apply pagination on client side (backend doesn't support it yet)
    const paginatedEvents = allEvents.slice(offset, offset + limit);
    const totalEvents = allEvents.length;

    return {
      success: true,
      data: paginatedEvents,
      pagination: {
        offset,
        limit,
        total: totalEvents,
        hasMore: offset + limit < totalEvents
      }
    };
  } catch (error) {
    console.error('Error fetching events batch:', error);
    throw new Error('Error loading events');
  }
};

/**
 * Endpoint 2: Fetch single event details
 * GET /v1/api/events/{id}
 * @param {number} eventId - Event ID
 * @returns {Promise<EventDetailsResponse>} Full event information
 */
export const fetchEventDetails = async (eventId: number): Promise<EventDetailsResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/events/${eventId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Event not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const backendEvent: BackendEvent = await response.json();
    const event = transformBackendEvent(backendEvent);
    
    const details: EventDetails = {
      ...event,
      fullDescription: backendEvent.details?.fullDescription || event.description,
      organizer: backendEvent.details?.organizer || {
        name: "Event Organizer",
        rating: 4.5,
        reviews: 0
      }
    };
    
    return {
      success: true,
      data: details
    };
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw new Error(error instanceof Error ? error.message : 'Error loading event details');
  }
};

/**
 * Create a new event
 * POST /v1/api/events
 */
export const createEvent = async (eventData: {
  type: string;
  start: string;
  end: string;
  duration: number;
  priceType: string;
  place?: string;
  needReg?: boolean;
  details?: Record<string, any>;
}): Promise<BackendEvent> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/events`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const event: BackendEvent = await response.json();
    return event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Delete an event
 * DELETE /v1/api/events/{id}
 */
export const deleteEvent = async (eventId: number): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/events/${eventId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Get category statistics
 * GET /v1/api/analytics/category-stats
 */
export const getCategoryStats = async (): Promise<import('@/types').CategoryStats[]> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/analytics/category-stats`);
    
    if (!response.ok) {
      // Fallback to mock data if endpoint doesn't exist yet
      console.warn('Category stats endpoint not found, using mock data');
      return [
        { type: 'concert', count: 1240, label: 'Концерт' },
        { type: 'lecture', count: 850, label: 'Лекция' },
        { type: 'sport', count: 2100, label: 'Спорт' },
        { type: 'party', count: 3200, label: 'Вечеринка' },
        { type: 'theater', count: 540, label: 'Театр' },
        { type: 'exhibition', count: 1100, label: 'Выставка' },
      ];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching category stats:', error);
    // Return empty array or mock data on error to prevent UI crash
    return [
      { type: 'concert', count: 1240, label: 'Концерт' },
      { type: 'lecture', count: 850, label: 'Лекция' },
      { type: 'sport', count: 2100, label: 'Спорт' },
      { type: 'party', count: 3200, label: 'Вечеринка' },
      { type: 'theater', count: 540, label: 'Театр' },
      { type: 'exhibition', count: 1100, label: 'Выставка' },
    ];
  }
};

/**
 * Event API object
 */
const eventApi = {
  fetchEventsBatch,
  fetchEventDetails,
  createEvent,
  deleteEvent,
  getCategoryStats,

  /**
   * Send discovery action (like, dislike, neutral) for an event
   * POST /v1/api/discovery/action
   * @param {number} eventId - Event ID
   * @param {'like' | 'dislike' | 'neutral'} action - Action type
   */
  async sendDiscoveryAction(eventId: number, action: 'like' | 'dislike' | 'neutral'): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/discovery/action`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          eventId: eventId.toString()
        })
      });

      if (!response.ok) {
        if (response.status === 409 || response.status === 404) {
          throw new Error('Event unavailable');
        }
        throw new Error(`Discovery action failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error sending discovery action ${action} for event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Subscribe to an event
   * POST /v1/api/users/me/events/{id}/subscribe
   * @param {number} eventId - Event ID
   */
  async subscribeToEvent(eventId: number): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/users/me/events/${eventId}/subscribe`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Subscription failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error subscribing to event ${eventId}:`, error);
      throw error;
    }
  },
};

export default eventApi;
