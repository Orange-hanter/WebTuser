import { User, Event } from '@/types';
import AuthService from './authService';

// Adjust base URL to match /api/users/me instead of /v1/api/users/me if needed
// Assuming the backend serves /api/users/me at the root /api context
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/v1/api';

export interface EventWithSubscription extends Event {
  subscriptionStatus: 'confirmed' | 'waitlisted' | 'attended' | 'cancelled';
  subscriptionId?: string;
}

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
    return response.json();
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
    return response.json();
  },

  async cancelParticipation(eventId: number): Promise<void> {
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

  async subscribeToEvent(eventId: number, metadata: Record<string, any> = {}): Promise<void> {
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
  }
};
