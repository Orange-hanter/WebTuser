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
      const eventId = parseInt(eventIdStr, 10);
      if (!isNaN(eventId)) {
        return <PublicEventPage eventId={eventId} />;
      }
    }
  }
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Если пользователь не авторизован - показываем AuthFlow
  console.log('🟢 App: Showing main app, isAuthenticated=', isAuthenticated);
  if (!isAuthenticated) {
    console.log('🟢 App: Showing AuthFlow, isAuthenticated=', isAuthenticated);
    return <AuthFlow />;
  }
  

  // Показываем основное содержимое приложения
  return <MainAppContent />;
};

export default App;