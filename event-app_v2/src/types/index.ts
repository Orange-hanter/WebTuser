/**
 * Основные типы для приложения
 */

export interface Event {
  id: string;
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
  creator?: {
    id: number | string;
    name: string;
    avatar?: string;
  };
}

/**
 * Event with author info from /v1/api/discovery/next
 * author is the public profile of the event creator
 */
export interface EventWithAuthor extends Event {
  author?: PublicUserProfile;
}

export interface DiscoverySessionLike {
  event: Event;
  slot: {
    start: string;
    end: string;
  };
  likedAt: string;
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

export interface CategoryStats {
  type: string;
  count: number;
  label: string;
}

export interface CategoryStatsResponse {
  success: boolean;
  data: CategoryStats[];
}

// User authentication types
export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  city?: string;
  interests?: string[];
  createdAt: string;
  telegram_registered?: boolean;
  telegram_info?: TelegramInfo;
}

export interface TelegramInfo {
  username?: string;
  first_name?: string;
  last_name?: string;
  chat_id: number;
  status: 'active' | 'blocked' | 'inactive';
  updated_at: string;
}

export interface TelegramBindingLink {
  code: string;        // 6-символьный код для ручного ввода
  deeplink: string;    // Ссылка на бота
  token: string;       // Внутренний токен (не использовать напрямую)
  expires_at: string;  // Срок действия (10 минут)
}

export interface TelegramStatus {
  status: 'active' | 'blocked' | 'inactive' | 'pending' | 'revoked';
  chat_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  updated_at?: string;
}

/**
 * Ответ API при регистрации с verification_type=telegram
 * При этом типе НЕ возвращается JWT токен - нужно сначала привязать Telegram
 */
export interface TelegramBindingRegistrationResponse {
  user: {
    id: string;
    email: string;
    verified: false;
  };
  telegram_binding: {
    deeplink: string;
    code: string;
    expires_at: string;
  };
}

/**
 * Статус привязки Telegram для polling
 */
export interface BindingStatusResponse {
  success: boolean;
  is_bound: boolean;
  status?: 'active' | 'blocked' | 'pending' | 'revoked';
}

export interface PublicUserProfile {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  country?: string;
  publicEventsCount: number;
  isVerified: boolean;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegistrationData extends AuthCredentials {
  confirmPassword: string;
  phone?: string;
}

export interface VerificationData {
  email: string;
  code: string;
  method: 'sms' | 'email' | 'telegram';
}

export interface CreateEventData {
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  locationLat?: number;
  locationLon?: number;
  image?: string;
  organizerContact: string;
  priceType: 'free' | 'paid' | 'donation';
  price?: string;
  needReg: boolean;
  dynamicFields: Record<string, any>;
}

export interface FeedbackData {
  step: number;
  message: string;
  email?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  city: string;
  bio: string;
  interests: string[];
  avatar?: string;
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
