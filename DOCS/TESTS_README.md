# 🧪 E2E Тесты Авторизации и Регистрации

Полный набор End-to-End тестов для проверки функционала авторизации, регистрации и управления сессией приложения.

## 📦 Что включено

### 4 набора тестов (25+ тестовых сценариев)

| Файл | Описание | Тесты |
|------|---------|-------|
| `auth-register.spec.ts` | Регистрация новых пользователей | 5 тестов |
| `auth-login.spec.ts` | Вход в приложение | 7 тестов |
| `auth-verification.spec.ts` | Верификация и профиль | 7 тестов |
| `auth-session.spec.ts` | Сессия и выход | 5 тестов |
| `helpers.ts` | Вспомогательные функции | - |

## 🚀 Быстрый старт

### 1️⃣ Установка браузеров (первый запуск)
```bash
npx playwright install
```

### 2️⃣ Запуск всех тестов
```bash
npm run test
```

### 3️⃣ Просмотр отчёта
```bash
npx playwright show-report
```

## 📝 Доступные команды

```bash
# Все тесты (все браузеры)
npm run test

# Интерактивный UI режим
npm run test:ui

# Debug режим
npm run test:debug

# С видимыми окнами браузеров
npm run test:headed

# Конкретный браузер
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Мобильные браузеры
npm run test:mobile

# Конкретный тест
npx playwright test -g "успешный вход"

# Конкретный файл
npx playwright test tests/auth-login.spec.ts
```

## 🧐 Что тестируется

### ✅ Регистрация (`auth-register.spec.ts`)
- Успешная регистрация с корректными данными
- Ошибка при несовпадении паролей
- Ошибка при пустых полях
- Ошибка при коротком пароле
- Переключение на страницу входа

### 🔐 Вход (`auth-login.spec.ts`)
- Успешный вход с admin учётными данными
- Ошибка при неверном пароле
- Ошибка при несуществующем пользователе
- Ошибка при пустых полях
- Переключение видимости пароля
- Переключение на страницу регистрации
- Отправка пустой формы блокируется

### ✨ Верификация и профиль (`auth-verification.spec.ts`)
- Успешная верификация с кодом
- Ошибка при неверном коде
- Переключение между Email/SMS методами
- Заполнение профиля (шаг 1)
- Пропуск первого шага профиля
- Выбор интересов (шаг 2)
- Полное завершение регистрации

### 🔄 Сессия (`auth-session.spec.ts`)
- Сохранение сессии после перезагрузки
- Выход из приложения
- Защита от неавторизованного доступа
- Перезагрузка после выхода
- Очистка token после выхода

## 🔧 Mock данные

Приложение использует mock AuthService с предустановленными данными:

### Для входа
```
Email: admin@example.com
Password: admin123
```

### Для регистрации
- Email может быть любым
- Пароль минимум 6 символов
- Код верификации всегда: `123456`

## 📚 Использование вспомогательных функций

В `helpers.ts` есть готовые функции для упрощения тестов:

```typescript
import { 
  registerUser, 
  loginUser, 
  verifyCode, 
  completeProfile,
  completeFullRegistration,
  completeFullLogin,
  logout,
  generateTestEmail,
  TEST_PASSWORD,
  MOCK_ADMIN_EMAIL,
  MOCK_ADMIN_PASSWORD,
  MOCK_VERIFICATION_CODE
} from './helpers';

// Полная регистрация одной строкой
await completeFullRegistration(page, 'user@example.com', 'password123');

// Генерация уникального email
const email = generateTestEmail();

// Полный вход
await completeFullLogin(page, 'admin@example.com', 'admin123');

// Выход
await logout(page);
```

## 🎯 Структура теста

```typescript
import { test, expect } from '@playwright/test';
import { completeFullLogin } from './helpers';

test.describe('Группа тестов', () => {
  test.beforeEach(async ({ page }) => {
    // Выполняется перед каждым тестом
    await page.goto('/');
  });

  test('описание теста', async ({ page }) => {
    // Основной код теста
    await completeFullLogin(page, 'admin@example.com', 'admin123');
    
    // Проверки
    await expect(page.locator('text=Афиша')).toBeVisible();
  });
});
```

## 🔍 Селекторы для поиска элементов

```typescript
// По тексту
page.locator('text=Вход')

// По placeholder
page.locator('input[placeholder*="Email"]')

// По aria-label
page.locator('button[aria-label*="Выход"]')

// По title
page.locator('button[title*="Настройки"]')

// CSS селектор
page.locator('button.app-header-button')

// Сложный селектор
page.locator('button:has-text("Готово")')
```

## 📱 Браузеры и устройства

Тесты запускаются на:

### 🖥️ Desktop
- Chromium (Chrome)
- Firefox
- WebKit (Safari)

### 📱 Mobile
- Pixel 5 (Chrome)
- iPhone 12 (Safari)

## 🎬 Режимы запуска

### 🖼️ UI Mode (интерактивный)
```bash
npm run test:ui
```
Позволяет:
- Запускать тесты по одному
- Видеть выполнение в реальном времени
- Перемотку вперёд/назад
- Инспектор элементов

### 🐛 Debug Mode
```bash
npm run test:debug
```
Включает:
- Пошаговое выполнение
- Инспектор браузера
- Паузы на ошибках

### 👁️ Headed Mode
```bash
npm run test:headed
```
Показывает окна браузеров во время тестов.

## 📊 Отчёты

После выполнения тестов:

```bash
# Открыть HTML отчёт
npx playwright show-report

# Или просмотреть в директории
open playwright-report/index.html
```

Отчёт содержит:
- ✅/❌ Результаты каждого теста
- 🖼️ Скриншоты при ошибках
- ⏱️ Время выполнения
- 📋 Логи выполнения

## ⚙️ Конфигурация

### `playwright.config.ts`
- Base URL: `http://localhost:5174`
- Dev сервер: автоматически запускается перед тестами
- Таймауты: 30 сек по умолчанию
- Retry: 0 в dev, 2 на CI
- Скриншоты: только при ошибках
- Трассировка: при повторных попытках

## 🆘 Troubleshooting

### Q: Тесты падают с ошибкой "Element not found"
**A**: Селектор может быть неправильным. Используйте Playwright Inspector:
```bash
npx playwright test --debug
```

### Q: Dev сервер не запускается
**A**: Проверьте, что порт 5174 свободен:
```bash
lsof -i :5174
```

### Q: Таймауты при ожидании элементов
**A**: Увеличьте таймаут:
```typescript
await expect(page.locator('...')).toBeVisible({ timeout: 10000 });
```

### Q: Тесты работают локально, но падают на CI
**A**: Добавьте таймауты и используйте `await page.waitForLoadState()`.

## 📚 Дополнительно

- 📖 [Полная документация по E2E тестам](./E2E_TESTS.md)
- 🎯 [Playwright Documentation](https://playwright.dev)
- 🔗 [Best Practices](https://playwright.dev/docs/best-practices)
- 🐛 [Debugging Guide](https://playwright.dev/docs/debug)

## 🤝 Как добавить новый тест

1. Создайте новый файл в `tests/` с расширением `.spec.ts`
2. Используйте шаблон:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Название группы', () => {
  test('описание теста', async ({ page }) => {
    await page.goto('/');
    // Ваш код теста
  });
});
```
3. Импортируйте нужные функции из `helpers.ts`
4. Запустите: `npx playwright test tests/your-file.spec.ts`

## 📈 Статистика

Текущий набор тестов покрывает:

- **24+ сценария** авторизации и регистрации
- **3+ браузера** (Chrome, Firefox, Safari)
- **2+ мобильных браузера** (iOS, Android)
- **~100% критического пути** регистрации/входа
- **Защита от типичных ошибок** (пустые поля, несовпадение паролей и т.д.)

---

**Версия**: 1.0  
**Последнее обновление**: 25 октября 2025  
**Статус**: ✅ Готово к использованию
