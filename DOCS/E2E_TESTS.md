# E2E Тесты с Playwright

Полный набор End-to-End тестов для функций авторизации, регистрации и управления сессией.

## Установка

Playwright уже установлен как dev dependency. Если нужно, переустановите браузеры:

```bash
npx playwright install
```

## Структура тестов

### 📝 `auth-register.spec.ts`
Тесты для регистрации новых пользователей:
- ✅ Успешная регистрация с корректными данными
- ❌ Ошибка при несовпадении паролей
- ❌ Ошибка при пустых полях
- ❌ Ошибка при коротком пароле
- 🔄 Переключение на страницу входа

### 📝 `auth-login.spec.ts`
Тесты для входа в приложение:
- ✅ Успешный вход с корректными учётными данными
- ❌ Ошибка при неверном пароле
- ❌ Ошибка при несуществующем пользователе
- ❌ Ошибка при пустых полях
- 👁️ Переключение видимости пароля
- 🔄 Переключение на страницу регистрации

### 📝 `auth-verification.spec.ts`
Тесты для верификации и заполнения профиля:
- ✅ Успешная верификация с корректным кодом
- ❌ Ошибка при неверном коде верификации
- 📧/📱 Переключение между методами верификации (Email/SMS)
- 👤 Заполнение профиля (Шаг 1)
- ⏭️ Пропуск первого шага профиля
- ❤️ Выбор интересов (Шаг 2)
- ✨ Завершение регистрации

### 📝 `auth-session.spec.ts`
Тесты для управления сессией:
- 💾 Сохранение сессии после перезагрузки
- 🚪 Выход из приложения
- 🔒 Защита основного приложения от неавторизованного доступа
- 🔄 Перезагрузка после выхода показывает страницу входа
- 🗑️ Очистка token после выхода

## Запуск тестов

### Все тесты (все браузеры)
```bash
npm run test
```

### UI режим (интерактивный)
```bash
npm run test:ui
```

### Debug режим
```bash
npm run test:debug
```

### Headless режим (видны окна браузеров)
```bash
npm run test:headed
```

### Конкретный браузер
```bash
# Только Chrome
npm run test:chromium

# Только Firefox
npm run test:firefox

# Только Safari
npm run test:webkit

# Мобильные браузеры
npm run test:mobile
```

### Конкретный тест
```bash
# Один файл
npx playwright test tests/auth-login.spec.ts

# Один тест
npx playwright test -g "успешный вход"

# С выводом в консоль
npx playwright test --reporter=list
```

## Mock данные

Приложение использует mock AuthService, поэтому для тестов доступны:

### Предустановленный пользователь (login)
```
Email: admin@example.com
Password: admin123
```

### Для регистрации новых пользователей
Email может быть любым, пароль должен быть минимум 6 символов.

### Код верификации
```
Всегда: 123456
```

## Вспомогательные функции

В файле `tests/helpers.ts` есть утилиты для упрощения написания тестов:

```typescript
import { registerUser, loginUser, verifyCode, completeProfile, logout, generateTestEmail } from './helpers';

// Полная регистрация
await completeFullRegistration(page, email, password);

// Полный вход
await completeFullLogin(page, email, password);

// Выход
await logout(page);

// Генерация email
const email = generateTestEmail();
```

## Структура тестового файла

```typescript
import { test, expect } from '@playwright/test';
import { completeFullLogin, logout } from './helpers';

test.describe('Группа тестов', () => {
  test.beforeEach(async ({ page }) => {
    // Подготовка перед каждым тестом
    await page.goto('/');
  });

  test('Описание теста', async ({ page }) => {
    // Тест
    await expect(page.locator('text=...')).toBeVisible();
  });
});
```

## Селекторы

Для поиска элементов используются:

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
```

## Структура config

`playwright.config.ts` настроен для:
- 📱 Desktop браузеры (Chrome, Firefox, Safari)
- 📱 Мобильные браузеры (Chrome, Safari)
- 🖼️ Скриншоты при ошибках
- 📹 Трассировка при повторных попытках
- ⚙️ Автоматический запуск dev сервера перед тестами
- 🔄 Переиспользование существующего сервера

## Отчёты

После запуска тестов:

```bash
# Открыть HTML отчёт
npx playwright show-report
```

Отчёт содержит:
- ✅/❌ Результаты тестов
- 🖼️ Скриншоты при ошибках
- 📹 Видео-записи (если включено)
- ⏱️ Время выполнения
- 🔍 Детали каждого теста

## Советы и трюки

### Ожидание элемента
```typescript
// Явное ожидание
await expect(page.locator('text=...')).toBeVisible();

// С таймаутом
await expect(page.locator('text=...')).toBeVisible({ timeout: 10000 });
```

### Работа с input
```typescript
// Заполнение
await page.fill('input[...', 'value');

// Получение значения
const value = await page.locator('input[...]').inputValue();

// Очистка и заполнение
await page.locator('input[...]').clear();
await page.locator('input[...]').fill('new value');
```

### Клики
```typescript
// Обычный клик
await page.click('button');

// Клик по координатам
await page.click('button', { position: { x: 10, y: 20 } });

// Двойной клик
await page.dblclick('button');

// Правый клик
await page.click('button', { button: 'right' });
```

### Проверка атрибутов
```typescript
// Проверка класса
const classes = await page.locator('button').getAttribute('class');
expect(classes).toContain('active');

// Проверка disabled
await expect(page.locator('button')).toBeDisabled();
```

### SessionStorage
```typescript
// Получить значение
const token = await page.evaluate(() => sessionStorage.getItem('authToken'));

// Установить значение
await page.evaluate(() => sessionStorage.setItem('key', 'value'));

// Очистить
await page.evaluate(() => sessionStorage.clear());
```

## Troubleshooting

### Тесты падают на случайных селекторах
**Решение**: Используйте более специфичные селекторы или data-testid атрибуты в коде.

### Dev сервер не запускается
**Решение**: Убедитесь, что порт 5174 свободен, или измените в `playwright.config.ts`.

### Таймауты при ожидании элементов
**Решение**: Увеличьте timeout в конфиге или в отдельных тестах.

### Тесты работают локально, но падают на CI
**Решение**: Используйте `--headed` флаг для debug'а или увеличьте таймауты.

## CI/CD интеграция

Для GitHub Actions:

```yaml
- name: Run tests
  run: npm run test
  
- name: Upload report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Дополнительные ресурсы

- 📚 [Playwright Documentation](https://playwright.dev)
- 🎯 [Best Practices](https://playwright.dev/docs/best-practices)
- 🔍 [Debugging Guide](https://playwright.dev/docs/debug)
- 🖼️ [Inspector Tool](https://playwright.dev/docs/inspector)
