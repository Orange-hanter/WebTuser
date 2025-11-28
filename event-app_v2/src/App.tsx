import { FC } from 'react';
import { LoadingSpinner } from '@components/common';
import { AuthFlow } from '@components/auth';
import { MainAppContent } from '@components/layout';
import { PublicEventPage } from '@components/events';
import { useAuthContext } from '@/contexts';
import './App.css';

const App: FC = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
  console.log('🟢 App: rendering page');
  
  // Check for public event route
  const path = window.location.pathname;
  if (path.startsWith('/e/')) {
    const parts = path.split('/');
    const eventIdStr = parts[2];
    if (eventIdStr) {
      // Keep as string to match PublicEventPage prop type
      return <PublicEventPage eventId={eventIdStr} />;
    }
  }
  
  // Если пользователь не авторизован - показываем AuthFlow
  // НЕ показываем LoadingSpinner вместо AuthFlow, чтобы не терять состояние формы
  console.log('🟢 App: Showing main app, isAuthenticated=', isAuthenticated);
  if (!isAuthenticated) {
    console.log('🟢 App: Showing AuthFlow, isAuthenticated=', isAuthenticated);
    return <AuthFlow />;
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