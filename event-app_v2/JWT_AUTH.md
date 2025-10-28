# 🔐 Система Аутентификации с JWT

## Общая информация

Приложение использует **JWT (JSON Web Tokens)** для аутентификации с имитацией **HTTPOnly cookies** для безопасного хранения.

## 🏗️ Архитектура

### Компоненты:

1. **AuthService** (`src/services/authService.ts`)
   - Основной сервис для управления аутентификацией
   - Генерация и валидация JWT токенов
   - Управление HTTPOnly cookies

2. **useAuth Hook** (`src/hooks/useAuth.ts`)
   - React hook для работы с аутентификацией в компонентах
   - Управление состоянием пользователя и токена
   - Методы: login, register, verify, updateProfile, logout

3. **AuthFlow** (`src/components/AuthFlow.tsx`)
   - Оркестратор потока аутентификации
   - Управление переходами между страницами

## 🔑 Функции

### Регистрация (Register)
```typescript
register(data: RegistrationData)
```
- Email и пароль обязательны
- Опциональный номер телефона
- Пароль должен быть минимум 6 символов
- После регистрации отправляется код верификации

### Верификация (Verify)
```typescript
verify(code: string, method: 'sms' | 'email')
```
- Подтверждение email/SMS кодом
- Код действителен 15 минут
- **Для тестирования используйте код: `123456`**
- После верификации генерируется JWT токен

### Вход (Login)
```typescript
login(credentials: AuthCredentials)
```
- Email и пароль
- **Тестовый аккаунт:**
  - Email: `test@example.com`
  - Пароль: `password123`
- Генерирует JWT токен

### Обновление профиля (UpdateProfile)
```typescript
updateProfile(profile: Partial<UserProfile>)
```
- Требует валидный JWT токен
- Может обновить: имя, фамилию, город, о себе, интересы

### Выход (Logout)
```typescript
logout()
```
- Удаляет токен из HTTPOnly cookie
- Очищает состояние приложения

## 🔐 JWT Структура

### Заголовок (Header)
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Полезная нагрузка (Payload)
```json
{
  "userId": "1234567890",
  "email": "user@example.com",
  "iat": 1672531200,
  "exp": 1672617600
}
```

**Поля:**
- `userId` - ID пользователя
- `email` - Email пользователя
- `iat` - Время выдачи (в секундах от Unix epoch)
- `exp` - Время истечения (7 дней)

### Подпись (Signature)
```
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

## 🍪 HTTPOnly Cookies

### Как это работает:

1. **На сервере:** При входе/верификации сервер отправляет заголовок:
```
Set-Cookie: auth_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

2. **В браузере:** JavaScript не может получить доступ к HttpOnly cookies
   - Браузер автоматически отправляет cookie с каждым запросом
   - Защита от XSS атак

3. **В этом приложении:** Используется имитация с sessionStorage
```typescript
// Сохранение токена
sessionStorage.setItem('_auth_token', token);

// Получение токена
const token = sessionStorage.getItem('_auth_token');

// Удаление токена
sessionStorage.removeItem('_auth_token');
```

## 🧪 Тестирование

### Сценарий 1: Регистрация и верификация
1. Перейди на "Регистрация"
2. Заполни данные:
   - Email: `newuser@example.com`
   - Пароль: `password123`
   - Подтверждение пароля: `password123`
3. Нажми "Зарегистрироваться"
4. На странице верификации введи код: `123456`
5. Заполни профиль (имя, город, интересы)

### Сценарий 2: Вход с тестовым аккаунтом
1. На странице входа используй:
   - Email: `test@example.com`
   - Пароль: `password123`
2. После входа перейдёшь в приложение

### Сценарий 3: Проверка токена
В консоли браузера:
```javascript
// Проверить наличие токена
sessionStorage.getItem('_auth_token')

// Проверить валидность
AuthService.isTokenValid()

// Получить текущего пользователя
AuthService.getCurrentUser(token)
```

## 🔒 Безопасность

### Реализовано:
- ✅ JWT токены с 7-дневным сроком действия
- ✅ Проверка срока действия токена
- ✅ HTTPOnly cookies (имитация)
- ✅ Валидация данных на клиенте
- ✅ Удаление пароля перед отправкой пользователя

### Рекомендации для production:

1. **Backend:**
   - Использовать bcrypt для хеширования паролей
   - Реальная база данных вместо Map в памяти
   - Шифрование токена с секретным ключом
   - Черный список токенов для логаутов
   - Rate limiting на endpoints

2. **Frontend:**
   - HTTPS для всех запросов
   - Content Security Policy (CSP) заголовки
   - CSRF protection tokens
   - Refresh tokens в HTTPOnly cookies
   - Access tokens с коротким сроком (15 минут)

3. **Infrastructure:**
   - CORS правильно настроен
   - Безопасное хранение ключей
   - Мониторинг попыток взлома
   - Regular security audits

## 📚 API Reference

### AuthService методы:

```typescript
// Регистрация
static async register(data: RegistrationData): Promise<ApiResponse<{ email: string }>>

// Верификация
static async verify(data: VerificationData): Promise<ApiResponse<{ token: string; user: User }>>

// Вход
static async login(credentials: AuthCredentials): Promise<ApiResponse<{ token: string; user: User }>>

// Обновление профиля
static async updateProfile(token: string, profile: Partial<UserProfile>): Promise<ApiResponse<User>>

// Получение текущего пользователя
static async getCurrentUser(token: string): Promise<ApiResponse<User>>

// Выход
static async logout(): Promise<ApiResponse<null>>

// Получить токен из cookie
static getAuthToken(): string | null

// Проверить валидность токена
static isTokenValid(): boolean
```

## 🐛 Решение проблем

### "Неверный или истёкший токен"
- Проверь срок действия токена (7 дней)
- Выйди и войди заново

### "Код подтверждения истёк"
- Код действителен 15 минут
- Нажми "Отправить код снова"

### "Пользователь не верифицирован"
- Нужно подтвердить email перед входом
- Используй тестовый код: `123456`

## 📝 Примеры использования

### В React компоненте:

```typescript
import { useAuth } from '@hooks/useAuth';

const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Пожалуйста, войди</div>;
  }

  return (
    <div>
      <p>Привет, {user?.firstName}!</p>
      <button onClick={logout}>Выход</button>
    </div>
  );
};
```

### Прямое использование AuthService:

```typescript
import AuthService from '@/services/authService';

// Вход
const response = await AuthService.login({
  email: 'test@example.com',
  password: 'password123'
});

// Получить текущего пользователя
const userResponse = await AuthService.getCurrentUser(token);

// Выход
await AuthService.logout();
```

## 🚀 Развертывание

При развертывании на production:

1. Создай backend на Express/Node/Python/Go и т.д.
2. Реализуй реальное хеширование паролей (bcrypt)
3. Используй настоящую базу данных
4. Генерируй JWT токены на сервере
5. Отправляй токены через HTTPOnly cookies
6. Добавь refresh tokens для безопасности

---

**Создано:** 25 октября 2025
**Версия:** 1.0.0
