/**
 * Основные типы для приложения (React Native версия)
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
  creator?: {
    id: number | string;
    name: string;
    avatar?: string;
  };
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
  error?: string;
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
  chat_id: number;
  status: 'active' | 'blocked' | 'inactive';
  updated_at: string;
}

export interface TelegramBindingLink {
  deeplink: string;
  token: string;
  expires_at: string;
}

export interface TelegramStatus {
  status: 'active' | 'blocked' | 'inactive';
  chat_id?: number;
  username?: string;
  updated_at?: string;
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
  method: 'sms' | 'email';
}

export interface CreateEventData {
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  location: string;
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

export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  data?: {
    message: string;
  };
  error?: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  EventDetails: { eventId: number };
  PublicEvent: { eventId: number };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Verification: { email: string };
  ProfileStep1: undefined;
  ProfileStep2: undefined;
};

export type MainTabParamList = {
  Events: undefined;
  CreateEvent: undefined;
  Profile: undefined;
};
