import { FC, useEffect, useState, useCallback } from 'react';
import { LoginPage, RegisterPage, VerificationPage, ProfileStep1, ProfileStep2, ConsentPage } from '@components/auth';
import { useAuthContext, useToast } from '@/contexts';
import type { AuthCredentials, RegistrationData, UserProfile } from '@/types';
import { saveRegistrationData, clearRegistrationData } from '@/services/registrationStorage';
import AuthService from '@/services/authService';

type AuthStep = 'login' | 'register' | 'consent' | 'verification' | 'profile-step1' | 'profile-step2';

interface AuthFlowProps {
  onAuthSuccess?: () => void;
}

const AuthFlow: FC<AuthFlowProps> = ({ onAuthSuccess }) => {
  const deriveStepFromPath = (): AuthStep => {
    const p = window.location.pathname;
    if (p === '/register') return 'register';
    if (p === '/consent') return 'consent';
    if (p === '/verify') return 'verification';
    if (p === '/profile-step1') return 'profile-step1';
    if (p === '/profile-step2') return 'profile-step2';
    return 'login';
  };

  const [currentStep, setCurrentStep] = useState<AuthStep>(deriveStepFromPath);
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const { login, register, updateProfile, isLoading } = useAuthContext();
  const { error: showError, success: showSuccess } = useToast();

  console.log('🔵 AuthFlow: render page')
  
  const handleLogin = useCallback(async (credentials: AuthCredentials) => {
    try {
      console.log('🔵 AuthFlow.handleLogin: Starting...', credentials.email);
      await login(credentials);
      console.log('🔵 AuthFlow.handleLogin: Login successful');
      showSuccess('Успешный вход!');

      // Check for next param
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      if (next) {
        window.location.href = next;
        return;
      }

      if (onAuthSuccess) {
        console.log('🔵 AuthFlow.handleLogin: Calling onAuthSuccess');
        onAuthSuccess();
      }
    } catch (error) {
      console.error('🔵 AuthFlow.handleLogin: Error', error);
      showError(error instanceof Error ? error.message : 'Ошибка входа');
      throw error;
    }
  }, [login, onAuthSuccess, showSuccess, showError]);

  const handleRegister = useCallback(async (data: RegistrationData) => {
    try {
      console.log('🔵 AuthFlow.handleRegister: saving data and switching to verification');
      // Persist registration data and navigate to verification step (no API call here)
      saveRegistrationData({ email: data.email, phone: data.phone || '', password: data.password });
      showSuccess('Данные сохранены. Выберите способ подтверждения.');
      window.history.pushState({}, '', '/verify');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) {
      console.error('Register error:', error);
      showError(error instanceof Error ? error.message : 'Ошибка регистрации');
      throw error;
    }
  }, [register, showSuccess, showError]);

  // react to URL changes (pushState / popstate) so /register and /verify work
  useEffect(() => {
    const onPop = () => setCurrentStep(deriveStepFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Если пользователь разлогинился (нет токена), перенаправить на логин
  // Задержка нужна чтобы токен успел сохраниться после верификации
  useEffect(() => {
    if (currentStep !== 'profile-step1' && currentStep !== 'profile-step2') {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      const hasToken = AuthService.getAuthToken();
      if (!hasToken) {
        console.log('🔵 AuthFlow: No token found on profile step, redirecting to login');
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        console.log('🔵 AuthFlow: Token found, staying on profile step');
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [currentStep]);

  useEffect(() => {
    console.log('🔵 AuthFlow: currentStep=', currentStep);
  }, [currentStep]);

  const handleProfileStep1 = useCallback(async (data: Partial<UserProfile>) => {
    try {
      setProfileData(prev => ({ ...prev, ...data }));
      window.history.pushState({}, '', '/profile-step2');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) {
      console.error('Profile step 1 error:', error);
      showError('Произошла ошибка при сохранении данных');
    }
  }, [showError]);

  const handleProfileStep2 = useCallback(async (data: Partial<UserProfile>) => {
    try {
      const completeProfile = { ...profileData, ...data };
      await updateProfile(completeProfile);
      console.log('🔵 AuthFlow.handleProfileStep2: Profile updated successfully');
      
      // Очистить данные регистрации
      clearRegistrationData();
      showSuccess('Профиль успешно создан!');
      
      // Переходим в основное приложение (пользователь уже авторизован)
      if (onAuthSuccess) {
        console.log('🔵 AuthFlow.handleProfileStep2: Calling onAuthSuccess');
        onAuthSuccess();
      } else {
        // Fallback: переход на главную
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (error) {
      console.error('Profile step 2 error:', error);
      showError(error instanceof Error ? error.message : 'Ошибка сохранения профиля');
      throw error;
    }
  }, [profileData, updateProfile, showSuccess, showError]);

  const handleSwitchToRegister = useCallback(() => {
    // Переход на страницу согласия вместо прямой регистрации
    window.history.pushState({}, '', '/consent');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);
  
  const handleConsentAccept = useCallback(() => {
    // После принятия оферты переходим к регистрации
    window.history.pushState({}, '', '/register');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);
  
  const handleConsentDecline = useCallback(() => {
    // При отказе возвращаемся на логин
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);
  
  const handleSwitchToLogin = useCallback(() => {
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);
  const handleSkipStep1 = useCallback(() => {
    window.history.pushState({}, '', '/profile-step2');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);
  const handleBackToStep1 = useCallback(() => {
    window.history.pushState({}, '', '/profile-step1');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  return (
    <>
      {currentStep === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}

      {currentStep === 'consent' && (
        <ConsentPage
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      )}

      {currentStep === 'register' && (
        <RegisterPage
          onRegister={handleRegister}
          onSwitchToLogin={handleSwitchToLogin}
          isLoading={isLoading}
        />
      )}

      {currentStep === 'verification' && (
        <VerificationPage
          onSwitchToLogin={handleSwitchToLogin}
          defaultMethod="email"
        />
      )}

      {currentStep === 'profile-step1' && (
        <ProfileStep1
          onNext={handleProfileStep1}
          onSkip={handleSkipStep1}
          isLoading={isLoading}
          initialData={profileData}
        />
      )}

      {currentStep === 'profile-step2' && (
        <ProfileStep2
          onComplete={handleProfileStep2}
          onBack={handleBackToStep1}
          isLoading={isLoading}
          initialData={profileData}
        />
      )}
    </>
  );
};

export default AuthFlow;
