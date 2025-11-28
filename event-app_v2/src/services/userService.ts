import { User, Event } from '@/types';
import AuthService from './authService';

// Adjust base URL to match /api/users/me instead of /v1/api/users/me if needed
// Assuming the backend serves /api/users/me at the root /api context
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/v1/api';

export interface EventWithSubscription extends Event {
  subscriptionStatus: 'confirmed' | 'waitlisted' | 'attended' | 'cancelled';
  subscriptionId?: string;
}

export interface PublicUserProfile {
  id: string | number;
  firstName: string;
  lastName: string;
  avatar_url?: string;
  telegram_public?: boolean;
  telegram_username?: string;
  role?: 'creator' | 'user';
}

export interface Participant {
  user_id: string | number;
  public_name: string;
  avatar_url?: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
}

export interface RoleRequest {
  id: string;
  requested_role: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
}

// Simple in-memory cache for public user profiles
const userProfileCache = new Map<string | number, { data: PublicUserProfile; timestamp: number }>();
const eventParticipantsCache = new Map<string, { data: Participant[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const PARTICIPANTS_CACHE_TTL = 60 * 1000; // 1 minute

export const userService = {
  async getProfile(): Promise<User> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch profile');
    }
    return response.json();
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  async changePassword(passwordData: { current: string; new: string }): Promise<void> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/users/me/password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) throw new Error('Failed to change password');
  },

  async getUpcomingEvents(): Promise<EventWithSubscription[]> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/users/me/events/upcoming`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Failed to fetch upcoming events');
    
    const rawEvents = await response.json();
    
    // Transform API response to EventWithSubscription format
    return rawEvents.map((e: any) => ({
      id: e.id,
      title: e.title || e.details?.title || `${e.type} событие`,
      type: e.type || 'Событие',
      location: e.place || e.location || 'Место не указано',
      time: e.start ? new Date(e.start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '',
      date: e.start || e.date || '',
      attendees: e.details?.capacity || 0,
      rating: e.rating || 0,
      description: e.details?.description || e.description || '',
      image: e.image || e.details?.image || '/placeholder-event.jpg',
      tags: e.details?.tags || e.tags || [],
      creator: e.creator,
      subscriptionStatus: e.subscription_status || e.subscriptionStatus || 'confirmed',
      subscriptionId: e.subscription_id || e.subscriptionId,
    }));
  },

  async getEventHistory(limit = 20, offset = 0): Promise<EventWithSubscription[]> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/users/me/events/history?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Failed to fetch event history');
    
    const rawEvents = await response.json();
    
    // Transform API response to EventWithSubscription format
    return rawEvents.map((e: any) => ({
      id: e.id,
      title: e.title || e.details?.title || `${e.type} событие`,
      type: e.type || 'Событие',
      location: e.place || e.location || 'Место не указано',
      time: e.start ? new Date(e.start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '',
      date: e.start || e.date || '',
      attendees: e.details?.capacity || 0,
      rating: e.rating || 0,
      description: e.details?.description || e.description || '',
      image: e.image || e.details?.image || '/placeholder-event.jpg',
      tags: e.details?.tags || e.tags || [],
      creator: e.creator,
      subscriptionStatus: e.subscription_status || e.subscriptionStatus || 'confirmed',
      subscriptionId: e.subscription_id || e.subscriptionId,
    }));
  },

  async cancelParticipation(eventId: string): Promise<void> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/users/me/events/${eventId}/subscribe`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Failed to cancel participation');
  },

  async subscribeToEvent(eventId: string, metadata: Record<string, any> = {}): Promise<void> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/users/me/events/${eventId}/subscribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ metadata }),
    });

    if (!response.ok) throw new Error('Failed to subscribe to event');
  },

  async getPublicUserProfile(userId: string | number): Promise<PublicUserProfile> {
    // Check cache first
    const cached = userProfileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const response = await fetch(`${API_BASE_URL}/users/public/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch public user profile');
    }

    const data: PublicUserProfile = await response.json();
    userProfileCache.set(userId, { data, timestamp: Date.now() });
    return data;
  },

  async getEventParticipants(eventId: string): Promise<Participant[]> {
    // Check cache first
    const cached = eventParticipantsCache.get(eventId);
    if (cached && Date.now() - cached.timestamp < PARTICIPANTS_CACHE_TTL) {
      return cached.data;
    }

    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/events/${eventId}/participants`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch event participants');
    }

    const data = await response.json();
    eventParticipantsCache.set(eventId, { data, timestamp: Date.now() });
    return data;
  },

  async requestCreatorRole(reason?: string): Promise<void> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/users/request-role`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'creator', reason }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to request creator role');
    }
  },

  async getRoleRequests(): Promise<RoleRequest[]> {
    const token = AuthService.getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/users/request-role/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch role requests');
    }
    return response.json();
  }
};
