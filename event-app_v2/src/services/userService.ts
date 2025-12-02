import { User, Event, PublicUserProfile } from '@/types';
import AuthService from './authService';

export type { PublicUserProfile }; // Re-export for backward compatibility

// Adjust base URL to match /api/users/me instead of /v1/api/users/me if needed
// Assuming the backend serves /api/users/me at the root /api context
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/v1/api';

export interface EventWithSubscription extends Event {
  subscriptionStatus: 'confirmed' | 'waitlisted' | 'attended' | 'cancelled';
  subscriptionId?: string;
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

// Cache for public user profiles with ETag support
interface CachedProfile {
  data: PublicUserProfile;
  etag?: string;
  lastModified?: string;
  timestamp: number;
}

const userProfileCache = new Map<string | number, CachedProfile>();
const eventParticipantsCache = new Map<string, { data: Participant[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (matches max-age=300)
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
    const cached = userProfileCache.get(userId);
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    // If we have a cached version, add conditional headers
    if (cached) {
      // If cache is fresh (within TTL), return immediately without request
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      
      // If stale, use ETag/Last-Modified for revalidation
      if (cached.etag) headers['If-None-Match'] = cached.etag;
      if (cached.lastModified) headers['If-Modified-Since'] = cached.lastModified;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/public/${userId}`, {
        headers,
        credentials: 'include',
      });

      // Handle 304 Not Modified
      if (response.status === 304 && cached) {
        // Update timestamp to extend TTL
        cached.timestamp = Date.now();
        userProfileCache.set(userId, cached);
        return cached.data;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404) {
          throw new Error(errorData.error?.message || 'User not found');
        }
        if (response.status === 400) {
          throw new Error(errorData.error?.message || 'Invalid user ID');
        }
        if (response.status === 429) {
          throw new Error('Too many requests, please try again later');
        }
        
        throw new Error('Failed to fetch public user profile');
      }

      const data: PublicUserProfile = await response.json();
      
      // Update cache with new data and headers
      const etag = response.headers.get('ETag');
      const lastModified = response.headers.get('Last-Modified');
      
      userProfileCache.set(userId, {
        data,
        etag: etag || undefined,
        lastModified: lastModified || undefined,
        timestamp: Date.now()
      } as CachedProfile);
      
      return data;
    } catch (error) {
      // If network error and we have stale cache, return it as fallback?
      // For now, just rethrow as per requirements (show error UI)
      throw error;
    }
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
