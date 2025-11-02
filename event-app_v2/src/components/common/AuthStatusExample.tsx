import { FC } from 'react';
import { useAuthContext } from '@/contexts';

/**
 * Пример компонента, который использует глобальное состояние авторизации
 * Может быть использован в любом месте приложения без передачи пропсов
 */
const AuthStatusExample: FC = () => {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <div>Пользователь не авторизован</div>;
  }

  return (
    <div>
      <h3>Информация о пользователе</h3>
      <p>Email: {user?.email}</p>
      <p>Имя: {user?.firstName || 'Не указано'}</p>
      <p>Фамилия: {user?.lastName || 'Не указано'}</p>
    </div>
  );
};

export default AuthStatusExample;
