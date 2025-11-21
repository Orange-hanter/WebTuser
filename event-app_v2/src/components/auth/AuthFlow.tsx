import { FC, useEffect, useState, useCallback } from 'react';
import { LoginPage, RegisterPage, VerificationPage, ProfileStep1, ProfileStep2 } from '@components/auth';
import { useAuthContext, useToast } from '@/contexts';
import type { AuthCredentials, RegistrationData, UserProfile } from '@/types';

type AuthStep = 'login' | 'register' | 'verification' | 'profile-step1' | 'profile-step2';

interface AuthFlowProps {
  onAuthSuccess?: () => void;
}

const AuthFlow: FC<AuthFlowProps> = ({ onAuthSuccess }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [tempEmail, setTempEmail] = useState('');
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const { login, register, verify, updateProfile, resendCode, isLoading } = useAuthContext();
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
      console.log('🔵 AuthFlow.handleRegister: go to verification')
      await register(data);
      setTempEmail(data.email);
      showSuccess('Регистрация успешна! Проверьте почту для кода подтверждения.');
      setCurrentStep('verification');
    } catch (error) {
      console.error('Register error:', error);
      showError(error instanceof Error ? error.message : 'Ошибка регистрации');
      throw error;
    }
  }, [register, showSuccess, showError]);

  useEffect(() => {
    console.log('🔵 AuthFlow: currentStep=', currentStep);
  }, [currentStep]);

  const handleVerify = useCallback(async (code: string, method: 'sms' | 'email') => {
    try {
      await verify(code, method);
      showSuccess('Верификация успешна!');
      // После успешной верификации переходим к заполнению профиля
      setCurrentStep('profile-step1');
    } catch (error) {
      console.error('Verify error:', error);
      showError(error instanceof Error ? error.message : 'Ошибка верификации');
      throw error;
    }
  }, [verify, showSuccess, showError]);

  const handleResend = useCallback(async () => {
    try {
      await resendCode(tempEmail);
      showSuccess('Код отправлен повторно');
    } catch (error) {
      console.error('Resend error:', error);
      showError(error instanceof Error ? error.message : 'Ошибка отправки кода');
      throw error;
    }
  }, [resendCode, tempEmail, showSuccess, showError]);

  const handleProfileStep1 = useCallback(async (data: Partial<UserProfile>) => {
    try {
      setProfileData(prev => ({ ...prev, ...data }));
      setCurrentStep('profile-step2');
    } catch (error) {
      console.error('Profile step 1 error:', error);
      showError('Произошла ошибка при сохранении данных');
    }
  }, [showError]);

  const handleProfileStep2 = useCallback(async (data: Partial<UserProfile>) => {
    try {
      const completeProfile = { ...profileData, ...data };
      await updateProfile(completeProfile);
      // После успешного обновления профиля произойдет автоматический логин в AuthContext
      console.log('🔵 AuthFlow.handleProfileStep2: Profile updated successfully');
      showSuccess('Профиль успешно создан!');

      // Check for next param
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      if (next) {
        window.location.href = next;
        return;
      }

      if (onAuthSuccess) {
        console.log('🔵 AuthFlow.handleProfileStep2: Calling onAuthSuccess');
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Profile step 2 error:', error);
      showError(error instanceof Error ? error.message : 'Ошибка сохранения профиля');
      throw error;
    }
  }, [profileData, updateProfile, onAuthSuccess, showSuccess, showError]);

  const handleSwitchToRegister = useCallback(() => setCurrentStep('register'), []);
  const handleSwitchToLogin = useCallback(() => setCurrentStep('login'), []);
  const handleSwitchToProfileStep1 = useCallback(() => setCurrentStep('profile-step1'), []);
  const handleSkipStep1 = useCallback(() => setCurrentStep('profile-step2'), []);
  const handleBackToStep1 = useCallback(() => setCurrentStep('profile-step1'), []);

  return (
    <>
      {currentStep === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToRegister={handleSwitchToRegister}
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
          email={tempEmail}
          onVerify={handleVerify}
          onResend={handleResend}
          onSwitchToNextStep={handleSwitchToProfileStep1}
          onSwitchToLogin={handleSwitchToLogin}
          isLoading={isLoading}
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
