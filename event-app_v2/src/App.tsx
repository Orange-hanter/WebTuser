import { useState, useEffect, FC, useCallback } from 'react';
import { LoadingSpinner } from '@components/common';
import { AuthFlow } from '@components/auth';
import { MainAppContent } from '@components/layout';
import { useAuth } from '@hooks/useAuth';
import './App.css';

const App: FC = () => {
  const { isAuthenticated } = useAuth();
  const [showApp, setShowApp] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleAuthSuccess = useCallback(() => {
    console.log('🟢 App.handleAuthSuccess: Called, setting showApp to true');
    setShowApp(true);
  }, []);

  // ✅ При изменении isAuthenticated, обновляем showApp
  useEffect(() => {
    console.log('🟢 App useEffect: isAuthenticated changed to', isAuthenticated);

    if (!isAuthenticated) {
      // 👇 Полный сброс всех пользовательских данных при выходе
      console.log('🟢 App: User logged out — resetting all user-specific state');
    }

    // Синхронизируем showApp с isAuthenticated
    setShowApp(isAuthenticated);
    setIsInitialized(true);
  }, [isAuthenticated]);

  // Если ещё инициализируемся - показываем spinner
  if (!isInitialized) {
    return <LoadingSpinner />;
  }
  
  console.log('🟢 App render: showApp=', showApp, 'isAuthenticated=', isAuthenticated);
  
  // Если пользователь не авторизован - показываем AuthFlow
  if (!isAuthenticated) {
    console.log('🟢 App: Showing AuthFlow');
    return <AuthFlow onAuthSuccess={handleAuthSuccess} />;
  }
  
  console.log('🟢 App: Showing main app');

  // Показываем основное содержимое приложения
  return <MainAppContent />;
};

export default App;