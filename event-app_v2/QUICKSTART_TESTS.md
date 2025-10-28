# ⚡ Быстрый старт E2E тестов

## 🚀 За 2 минуты

### 1. Установите браузеры
```bash
npx playwright install
```

### 2. Запустите тесты
```bash
npm run test
```

### 3. Смотрите отчёт
```bash
npx playwright show-report
```

---

## 📋 Популярные команды

```bash
# Все тесты
npm run test

# Интерактивный режим (UI)
npm run test:ui

# Видимые окна браузеров
npm run test:headed

# Конкретный файл
npx playwright test tests/auth-login.spec.ts

# Конкретный тест
npx playwright test -g "успешный вход"

# Debug режим
npm run test:debug

# Показать отчёт
npx playwright show-report
```

---

## 🎯 Примеры

### Полная регистрация и вход
```bash
npx playwright test tests/auth-register.spec.ts --headed
npx playwright test tests/auth-login.spec.ts --headed
```

### Только критические тесты
```bash
npx playwright test -g "успешн" --headed
```

### На конкретном браузере
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

---

## 📝 Структура

```
tests/
├── auth-register.spec.ts    (5 тестов)
├── auth-login.spec.ts       (7 тестов)
├── auth-verification.spec.ts (7 тестов)
├── auth-session.spec.ts     (5 тестов)
├── helpers.ts               (утилиты)
└── examples.spec.ts         (15 примеров)
```

---

## 🔐 Mock учётные данные

```
Email: admin@example.com
Password: admin123
Code: 123456 (всегда)
```

---

## 📚 Документация

- [Полная документация](./E2E_TESTS.md)
- [README тестов](./TESTS_README.md)
- [Подробный обзор](./TESTS_SUMMARY.md)
- [Примеры кода](./tests/examples.spec.ts)

---

## ✅ Что покрыто

- ✅ Регистрация (5 сценариев)
- ✅ Вход (7 сценариев)
- ✅ Верификация (7 сценариев)
- ✅ Сессия (5 сценариев)

**Всего: 24+ тестовых сценария**

---

## 🎬 UI режим (рекомендуется для разработки)

```bash
npm run test:ui
```

Откроется интерфейс где вы можете:
- Выбирать тесты
- Запускать по одному
- Видеть выполнение в реальном времени
- Использовать Inspector
- Перемотку вперёд/назад

---

## 💡 Советы

### Для отладки конкретного теста
```bash
npx playwright test -g "название теста" --headed --debug
```

### Для быстрого запуска на Chrome
```bash
npm run test:chromium --headed
```

### Для CI/CD (headless)
```bash
npm run test
```

---

## 🆘 Проблемы?

### Не находит элементы?
```bash
npm run test:debug
```
Используйте Inspector для поиска селекторов.

### Таймауты?
Может быть, dev сервер не запустился. Проверьте:
```bash
npm run dev
```

### Падает на CI?
Добавьте явное ожидание:
```bash
await page.waitForLoadState('networkidle')
```

---

## 📊 Результаты

Отчёты сохраняются в `playwright-report/`

```bash
# Открыть отчёт в браузере
npx playwright show-report

# Или вручную
open playwright-report/index.html
```

---

**Версия**: 1.0 | **Статус**: ✅ Готово
