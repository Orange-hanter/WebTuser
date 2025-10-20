/**
 * Основные типы для приложения
 */

export interface Event {
  id: number;
  title: string;
  type: string;
  location: string;
  time: string;
  date: string;
  attendees: number;
  rating: number | string;
  description: string;
  image: string;
  tags: string[];
}

export interface EventDetails extends Event {
  fullDescription: string;
  organizer: {
    name: string;
    rating: number;
    reviews: number;
  };
}

export interface EventPreferences {
  types: string[];
  distance: number;
  timeOfDay: 'any' | 'morning' | 'afternoon' | 'evening';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface EventBatchResponse {
  success: boolean;
  data: Event[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface EventDetailsResponse {
  success: boolean;
  data: EventDetails;
}

export interface UseInfiniteEventScrollReturn {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMoreEvents: () => Promise<void>;
  reset: () => void;
}

export interface UseEventNavigationReturn {
  currentIndex: number;
  currentEvent: Event | undefined;
  goToNextEvent: () => void;
  resetToStart: () => void;
  totalEvents: number;
}

export interface UseEventPreferencesReturn {
  preferences: EventPreferences;
  handleSettingsChange: (key: keyof EventPreferences, value: any) => void;
}
