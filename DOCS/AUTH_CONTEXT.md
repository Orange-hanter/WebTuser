# Глобальное состояние авторизации

## Обзор

Приложение использует React Context API для управления глобальным состоянием авторизации. Это позволяет любому компоненту получить доступ к информации о пользователе и методам авторизации без необходимости передачи пропсов через всё дерево компонентов.

## Архитектура

### AuthContext
Расположение: `src/contexts/AuthContext.tsx`

Предоставляет:
- **Состояние**: `user`, `isAuthenticated`, `isLoading`, `error`
- **Методы**: `login`, `register`, `verify`, `updateProfile`, `logout`

### AuthProvider
Обёртка приложения, которая делает контекст доступным во всех компонентах.

Расположение: `src/main.tsx`
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

## Использование

### Базовое использование

```tsx
import { useAuthContext } from '@/contexts';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuthContext();

  if (!isAuthenticated) {
    return <div>Пожалуйста, войдите</div>;
  }

  return (
    <div>
      <p>Привет, {user?.firstName}!</p>
      <button onClick={logout}>Выйти</button>
    </div>
  );
};
```

### Проверка авторизации

```tsx
import { useAuthContext } from '@/contexts';

const ProtectedComponent = () => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <div>Защищённый контент</div>;
};
```

### Вход пользователя

```tsx
import { useAuthContext } from '@/contexts';

const LoginForm = () => {
  const { login, isLoading, error } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ 
        email: 'user@example.com', 
        password: 'password123' 
      });
      // Успешный вход - автоматически обновится isAuthenticated
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* форма входа */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
};
```

### Выход пользователя

```tsx
import { useAuthContext } from '@/contexts';

const LogoutButton = () => {
  const { logout } = useAuthContext();

  const handleLogout = async () => {
    await logout();
    // После вызова logout:
    // - user будет null
    // - isAuthenticated будет false
    // - токен будет удалён
  };

  return <button onClick={handleLogout}>Выйти</button>;
};
```

### Получение информации о пользователе

```tsx
import { useAuthContext } from '@/contexts';

const UserProfile = () => {
  const { user, isAuthenticated } = useAuthContext();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="user-profile">
      <h2>{user.firstName} {user.lastName}</h2>
      <p>Email: {user.email}</p>
      <p>Телефон: {user.phone}</p>
      <p>Город: {user.city}</p>
      {user.interests && (
        <div>
          <h3>Интересы:</h3>
          <ul>
            {user.interests.map(interest => (
              <li key={interest}>{interest}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

## API Reference

### Свойства контекста

#### `user: User | null`
Текущий авторизованный пользователь или `null` если не авторизован.

```tsx
interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  city?: string;
  interests?: string[];
  createdAt: string;
}
```

#### `isAuthenticated: boolean`
Флаг, показывающий авторизован ли пользователь. Автоматически вычисляется на основе наличия пользователя и валидности токена.

#### `isLoading: boolean`
Флаг, показывающий выполняется ли в данный момент операция авторизации (вход, регистрация, выход и т.д.).

#### `error: string | null`
Текст последней ошибки авторизации или `null` если ошибок нет.

### Методы

#### `login(credentials: AuthCredentials): Promise<void>`
Вход пользователя в систему.

```tsx
await login({
  email: 'user@example.com',
  password: 'password123'
});
```

#### `register(data: RegistrationData): Promise<void>`
Регистрация нового пользователя.

```tsx
await register({
  email: 'newuser@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  phone: '+79001234567'
});
```

#### `verify(code: string, method: 'sms' | 'email'): Promise<void>`
Верификация кода подтверждения.

```tsx
await verify('123456', 'email');
```

#### `updateProfile(profile: Partial<UserProfile>): Promise<void>`
Обновление профиля пользователя.

```tsx
await updateProfile({
  firstName: 'Иван',
  lastName: 'Иванов',
  city: 'Москва',
  interests: ['Музыка', 'Спорт']
});
```

#### `logout(): Promise<void>`
Выход пользователя из системы.

```tsx
await logout();
```

## Преимущества глобального состояния

### 1. Единый источник истины
Все компоненты получают одинаковые данные о состоянии авторизации.

### 2. Нет пропс-дриллинга
Не нужно передавать данные авторизации через множество промежуточных компонентов.

### 3. Автоматическое обновление
При изменении состояния авторизации все подписанные компоненты автоматически перерендериваются.

### 4. Централизованная логика
Вся логика авторизации находится в одном месте, что упрощает тестирование и поддержку.

### 5. Простота использования
Один хук `useAuthContext()` даёт доступ ко всему необходимому функционалу.

## Примеры использования в проекте

### App.tsx
Главный компонент использует `isAuthenticated` для выбора между AuthFlow и основным приложением:

```tsx
const { isAuthenticated } = useAuthContext();

if (!isAuthenticated) {
  return <AuthFlow onAuthSuccess={handleAuthSuccess} />;
}

return <MainAppContent />;
```

### Header.tsx
Компонент заголовка использует метод `logout`:

```tsx
const { logout } = useAuthContext();

return (
  <button onClick={logout}>
    <LogOut />
  </button>
);
```

### AuthFlow.tsx
Компонент потока авторизации использует методы `login`, `register`, `verify`:

```tsx
const { login, register, verify, isLoading } = useAuthContext();
```

## Автоматическая авторизация после регистрации

После успешной регистрации и верификации кода подтверждения, пользователь автоматически авторизуется в системе без необходимости повторного ввода логина и пароля.

### Процесс

1. **Регистрация**: Пользователь заполняет форму регистрации с email и паролем
2. **Верификация**: На email отправляется код подтверждения, который нужно ввести
3. **Автоматический вход**: После успешной верификации система автоматически выполняет вход с сохраненными учетными данными
4. **Переход в приложение**: Пользователь сразу попадает в основное приложение

### Реализация

В `AuthContext`:
- При регистрации сохраняются учетные данные (`tempCredentials`)
- После успешной верификации вызывается метод `login` с сохраненными данными
- После успешного входа временные данные очищаются

```tsx
// В register сохраняем credentials
setTempCredentials({ email: data.email, password: data.password });

// В verify после успешной верификации
if (tempCredentials) {
  await login(tempCredentials);
  setTempCredentials(null);
}
```

### Преимущества

- **Улучшенный UX**: Пользователь не нужно повторно вводить данные
- **Безопасность**: Учетные данные не хранятся дольше необходимого
- **Простота**: Автоматизация процесса регистрации

### Тестирование

Тесты обновлены для учета автоматической авторизации:
- `completeFullRegistration` теперь ожидает перехода в основное приложение сразу после верификации
- Убраны шаги заполнения профиля из тестов регистрации

## Отладка

Контекст логирует все важные события в консоль с префиксом 🔐:

```
🔐 AuthContext: Auth state changed { isAuthenticated: true, userId: '123' }
🔐 AuthContext.login: Starting login... user@example.com
🔐 AuthContext.login: Login successful!
🔐 AuthContext.logout: Starting logout...
🔐 AuthContext.logout: Logout successful
```

## Интеграция с backend

Контекст использует `AuthService` для взаимодействия с backend API:
- Токены сохраняются в `sessionStorage`
- Автоматическая проверка валидности токена
- Автоматическая очистка при выходе

## Миграция со старого хука

Старый код:
```tsx
import { useAuth } from '@hooks/useAuth';
const { isAuthenticated, login } = useAuth();
```

Новый код:
```tsx
import { useAuthContext } from '@/contexts';
const { isAuthenticated, login } = useAuthContext();
```

API полностью совместим, только изменился импорт!
