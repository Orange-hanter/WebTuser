import { FC, useState } from 'react';
import LoginPage from '@components/LoginPage';
import RegisterPage from '@components/RegisterPage';
import VerificationPage from '@components/VerificationPage';
import ProfileStep1 from '@components/ProfileStep1';
import ProfileStep2 from '@components/ProfileStep2';
import { useAuth } from '@hooks/useAuth';
import type { AuthCredentials, RegistrationData, UserProfile } from '@/types';

type AuthStep = 'login' | 'register' | 'verification' | 'profile-step1' | 'profile-step2';

interface AuthFlowProps {
  onAuthSuccess: () => void;
}

const AuthFlow: FC<AuthFlowProps> = ({ onAuthSuccess }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [tempEmail, setTempEmail] = useState('');
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const { login, register, verify, updateProfile, isLoading } = useAuth();

  const handleLogin = async (credentials: AuthCredentials) => {
    try {
      await login(credentials);
      onAuthSuccess();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (data: RegistrationData) => {
    try {
      await register(data);
      setTempEmail(data.email);
      setCurrentStep('verification');
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  const handleVerify = async (code: string, method: 'sms' | 'email') => {
    try {
      await verify(code, method);
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
      onAuthSuccess();
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
