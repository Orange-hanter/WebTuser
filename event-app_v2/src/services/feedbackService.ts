import AuthService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.tuserduser.online/v1/api';

export type FeedbackCategory = 
  | 'registration' 
  | 'create_card' 
  | 'profile' 
  | 'general_suggestion' 
  | 'general_problem' 
  | 'inconvenience';

export interface FeedbackRequest {
  category: FeedbackCategory;
  message: string;
  userInfo: {
    userId?: string | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
  };
  environment: {
    userAgent: string;
    screenSize: string;
    url: string;
    pwa: boolean;
    os: string;
  };
}

const FeedbackService = {
  async sendFeedback(data: FeedbackRequest): Promise<void> {
    const token = AuthService.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to send feedback');
    }
  }
};

export default FeedbackService;
