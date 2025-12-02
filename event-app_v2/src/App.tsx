import { FC, useState, useEffect } from 'react';
import { LoadingSpinner } from '@components/common';
import { AuthFlow } from '@components/auth';
import { MainAppContent } from '@components/layout';
import { PublicEventPage } from '@components/events';
import { useAuthContext } from '@/contexts';
import './App.css';

const App: FC = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Слушаем изменения URL
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  console.log('🟢 App: rendering page, path=', currentPath);
  
  // Check for public event route
  if (currentPath.startsWith('/e/')) {
    const parts = currentPath.split('/');
    const eventIdStr = parts[2];
    if (eventIdStr) {
      // Keep as string to match PublicEventPage prop type
      return <PublicEventPage eventId={eventIdStr} />;
    }
  }
  
  // Проверяем, находимся ли мы на шагах заполнения профиля после регистрации
  const isProfileSetupRoute = currentPath === '/profile-step1' || currentPath === '/profile-step2';
  
  // Callback для успешной авторизации - переходим в основное приложение
  const handleAuthSuccess = () => {
    console.log('🟢 App: onAuthSuccess called, navigating to /');
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  };
  
  // Если пользователь не авторизован ИЛИ он на шагах заполнения профиля - показываем AuthFlow
  console.log('🟢 App: isAuthenticated=', isAuthenticated, 'isProfileSetupRoute=', isProfileSetupRoute);
  if (!isAuthenticated || isProfileSetupRoute) {
    console.log('🟢 App: Showing AuthFlow');
    return <AuthFlow onAuthSuccess={handleAuthSuccess} />;
  }
  
  // Показываем LoadingSpinner только для авторизованных пользователей
  // (например, при загрузке профиля)
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Показываем основное содержимое приложения
  return <MainAppContent />;
};

export default App;