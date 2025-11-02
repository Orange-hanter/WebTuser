import { FC } from 'react';
import { LoadingSpinner } from '@components/common';
import { AuthFlow } from '@components/auth';
import { MainAppContent } from '@components/layout';
import { useAuthContext } from '@/contexts';
import './App.css';

const App: FC = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
  console.log('🟢 App: rendering page');
  
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