import { FC, useEffect, useState } from 'react';
import { LoginPage, RegisterPage, VerificationPage, ProfileStep1, ProfileStep2 } from '@components/auth';
import { useAuthContext } from '@/contexts';
import type { AuthCredentials, RegistrationData, UserProfile } from '@/types';

type AuthStep = 'login' | 'register' | 'verification' | 'profile-step1' | 'profile-step2';

interface AuthFlowProps {
  onAuthSuccess?: () => void;
}

const AuthFlow: FC<AuthFlowProps> = ({ onAuthSuccess }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [tempEmail, setTempEmail] = useState('');
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const { login, register, verify, updateProfile, isLoading } = useAuthContext();

  console.log('🔵 AuthFlow: render page')
  
  const handleLogin = async (credentials: AuthCredentials) => {
    try {
      console.log('🔵 AuthFlow.handleLogin: Starting...', credentials.email);
      await login(credentials);
      console.log('🔵 AuthFlow.handleLogin: Login successful');
      if (onAuthSuccess) {
        console.log('🔵 AuthFlow.handleLogin: Calling onAuthSuccess');
        onAuthSuccess();
      }
    } catch (error) {
      console.error('🔵 AuthFlow.handleLogin: Error', error);
    }
  };

  const handleRegister = async (data: RegistrationData) => {
    try {
      console.log('🔵 AuthFlow.handleRegister: go to verification')
      await register(data);
      setTempEmail(data.email);
      setCurrentStep('verification');
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  useEffect(() => {
    console.log('🔵 AuthFlow: currentStep=', currentStep);
  }, [currentStep]);

  const handleVerify = async (code: string, method: 'sms' | 'email') => {
    try {
      await verify(code, method);
      // После успешной верификации переходим к заполнению профиля
      setCurrentStep('profile-step1');
    } catch (error) {
      console.error('Verify error:', error);
    }
  };

  const handleProfileStep1 = async (data: Partial<UserProfile>) => {
    try {
      setProfileData(prev => ({ ...prev, ...data }));
      setCurrentStep('profile-step2');
    } catch (error) {
      console.error('Profile step 1 error:', error);
    }
  };

  const handleProfileStep2 = async (data: Partial<UserProfile>) => {
    try {
      const completeProfile = { ...profileData, ...data };
      await updateProfile(completeProfile);
      // После успешного обновления профиля произойдет автоматический логин в AuthContext
      console.log('🔵 AuthFlow.handleProfileStep2: Profile updated successfully');
      if (onAuthSuccess) {
        console.log('🔵 AuthFlow.handleProfileStep2: Calling onAuthSuccess');
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Profile step 2 error:', error);
    }
  };

  const handleSkipStep1 = () => {
    setCurrentStep('profile-step2');
  };


  return (
    <>
      {currentStep === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentStep('register')}
          isLoading={isLoading}
        />
      )}

      {currentStep === 'register' && (
        <RegisterPage
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentStep('login')}
          isLoading={isLoading}
        />
      )}

      {currentStep === 'verification' && (
        <VerificationPage
          email={tempEmail}
          onVerify={handleVerify}
          onSwitchToNextStep={() => setCurrentStep('profile-step1')}
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
          onBack={() => setCurrentStep('profile-step1')}
          isLoading={isLoading}
          initialData={profileData}
        />
      )}
    </>
  );
};

export default AuthFlow;
