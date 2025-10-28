# 🧪 Полный Индекс E2E Тестов

## 📋 Содержание

### Быстрый старт
- **[QUICKSTART_TESTS.md](./QUICKSTART_TESTS.md)** — За 2 минуты ⚡
  - Установка, основные команды, примеры

### Полная документация  
- **[E2E_TESTS.md](./E2E_TESTS.md)** — Детальное руководство 📖
  - Все тесты, селекторы, советы, troubleshooting

- **[TESTS_README.md](./TESTS_README.md)** — Описание и примеры 📝
  - Структура, использование helpers, режимы запуска

- **[TESTS_SUMMARY.md](./TESTS_SUMMARY.md)** — Полный обзор 📊
  - Статистика, архитектура, примеры использования

### Код и примеры
- **[tests/](./tests/)** — Директория с тестами
  - `auth-register.spec.ts` — 5 тестов регистрации
  - `auth-login.spec.ts` — 7 тестов входа
  - `auth-verification.spec.ts` — 7 тестов верификации
  - `auth-session.spec.ts` — 5 тестов сессии
  - `helpers.ts` — 10+ вспомогательных функций
  - `examples.spec.ts` — 15 примеров написания тестов

### Конфигурация
- **[playwright.config.ts](./playwright.config.ts)** — Конфиг Playwright
- **[.github/workflows/e2e-tests.yml](./.github/workflows/e2e-tests.yml)** — GitHub Actions CI/CD

---

## 🚀 Быстрые команды

```bash
# Первый запуск (установка браузеров)
npx playwright install

# Запуск всех тестов
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

# Показать отчёт
npm run test:report

# Конкретный тест
npx playwright test -g "успешный вход"

# Конкретный файл
npx playwright test tests/auth-login.spec.ts
```

---

## 📊 Статистика

| Метрика | Значение |
|---------|----------|
| **Файлов тестов** | 5 |
| **Всего тестов** | 24+ |
| **Примеров** | 15 |
| **Браузеров** | 5 (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari) |
| **Покрытие** | ~100% критического пути |
| **Линий кода** | ~1500 |

---

## 📖 Для разных ситуаций

### Я хочу быстро стартовать
👉 [QUICKSTART_TESTS.md](./QUICKSTART_TESTS.md)

### Мне нужны все детали
👉 [E2E_TESTS.md](./E2E_TESTS.md)

### Я хочу написать свой тест
👉 [tests/examples.spec.ts](./tests/examples.spec.ts)

### Мне нужны helper функции
👉 [tests/helpers.ts](./tests/helpers.ts)

### Я хочу настроить CI/CD
👉 [.github/workflows/e2e-tests.yml](./.github/workflows/e2e-tests.yml)

### Мне нужна полная архитектура
👉 [TESTS_SUMMARY.md](./TESTS_SUMMARY.md)

---

## 🎯 Тестовые сценарии

### 1️⃣ Регистрация (5 тестов)
```
✅ Успешная регистрация
❌ Несовпадение паролей
❌ Пустые поля
❌ Короткий пароль
🔄 Переключение на вход
```

### 2️⃣ Вход (7 тестов)
```
✅ Успешный вход (admin@example.com / admin123)
❌ Неверный пароль
❌ Несуществующий пользователь
❌ Пустые поля
👁️ Toggle видимости пароля
🔄 Переключение на регистрацию
📋 Отправка пустой формы
```

### 3️⃣ Верификация (7 тестов)
```
✅ Успешная верификация (код: 123456)
❌ Неверный код
📧/📱 Email ↔ SMS
👤 Заполнение профиля Step 1
⏭️ Пропуск шага 1
❤️ Выбор интересов Step 2
✨ Завершение регистрации
```

### 4️⃣ Сессия (5 тестов)
```
💾 Сохранение после перезагрузки
🚪 Выход из приложения
🔒 Защита от неавторизованного доступа
🔄 Перезагрузка после выхода
🗑️ Очистка token
```

---

## 🔐 Mock данные

```
Email:     admin@example.com
Password:  admin123
Code:      123456 (всегда)
```

---

## 🎬 Режимы запуска

| Режим | Команда | Когда использовать |
|-------|---------|-------------------|
| Headless | `npm run test` | CI/CD, автоматизация |
| Headed | `npm run test:headed` | Локальная отладка |
| UI Mode | `npm run test:ui` | Разработка, интерактивный режим |
| Debug | `npm run test:debug` | Пошаговая отладка |
| Chrome | `npm run test:chromium` | Быстрая проверка |

---

## 📊 Отчёты

```bash
# Открыть HTML отчёт
npm run test:report
npx playwright show-report

# Путь
playwright-report/index.html
```

Содержит:
- ✅/❌ Результаты тестов
- ⏱️ Время выполнения
- 🖼️ Скриншоты ошибок
- 📋 Логи выполнения
- 📊 Статистика по браузерам

---

## 💡 Советы

### Для быстрого старта
```bash
npm run test:ui
```
Откроется интерактивный интерфейс.

### Для отладки конкретного теста
```bash
npx playwright test -g "успешный вход" --headed --debug
```

### Для CI/CD (GitHub Actions)
Тесты автоматически запускаются при push в main/develop.

### Просмотр во время выполнения
```bash
npm run test:headed
```

---

## 📚 Документация по файлам

### QUICKSTART_TESTS.md
- ⚡ За 2 минуты до запуска
- 📋 Популярные команды
- 🎯 Примеры использования

### E2E_TESTS.md
- 📖 Полная документация
- 🔍 Детали каждого теста
- 🛠️ Селекторы и API
- 💡 Советы и трюки
- 🆘 Troubleshooting

### TESTS_README.md
- 📝 Описание структуры
- 🎯 Что тестируется
- 📚 Использование helpers
- 📱 Браузеры и устройства

### TESTS_SUMMARY.md
- 📊 Полный обзор
- 🧪 Детальное описание тестов
- ⚙️ Конфигурация
- 📈 Следующие шаги

---

## 🔗 Структура файлов

```
event-app_v2/
├── tests/
│   ├── auth-register.spec.ts
│   ├── auth-login.spec.ts
│   ├── auth-verification.spec.ts
│   ├── auth-session.spec.ts
│   ├── helpers.ts
│   └── examples.spec.ts
├── .github/
│   └── workflows/
│       └── e2e-tests.yml
├── playwright.config.ts
├── E2E_TESTS.md
├── TESTS_README.md
├── TESTS_SUMMARY.md
├── QUICKSTART_TESTS.md
└── INDEX.md (этот файл)
```

---

## ✅ Готово к использованию

- ✅ 5 файлов тестов
- ✅ 24+ тестовых сценариев
- ✅ Полная документация
- ✅ 15 примеров
- ✅ GitHub Actions CI/CD
- ✅ Поддержка всех браузеров

---

## 🚀 Начните сейчас

```bash
# 1. Установка браузеров
npx playwright install

# 2. Запуск тестов
npm run test

# 3. Просмотр результатов
npx playwright show-report
```

Или для интерактивного режима:
```bash
npm run test:ui
```

---

**Версия**: 1.0  
**Статус**: ✅ Готово  
**Создано**: 25 октября 2025  
**Автор**: GitHub Copilot
