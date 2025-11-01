# Структура компонентов

## 📁 Организация папок

Компоненты теперь организованы по логическим группам:

### 🔐 auth/ - Компоненты авторизации
- `AuthFlow.tsx` - Главный компонент управления потоком авторизации
- `LoginPage.tsx` - Страница входа
- `RegisterPage.tsx` - Страница регистрации
- `VerificationPage.tsx` - Страница верификации кода
- `ProfileStep1.tsx` - Первый шаг заполнения профиля
- `ProfileStep2.tsx` - Второй шаг заполнения профиля (интересы)
- `index.ts` - Экспорты для удобного импорта

### 🎫 events/ - Компоненты событий
- `EventCard.tsx` - Карточка события
- `ActionButtons.tsx` - Кнопки действий (лайк/дизлайк)
- `index.ts` - Экспорты

### 🎨 modals/ - Модальные окна
- `EventDetailModal.tsx` - Детальная информация о событии
- `SettingsModal.tsx` - Настройки приложения
- `CreateEventModal.tsx` - Создание нового события
- `SubscribedEventsModal.tsx` - Просмотр избранных событий
- `index.ts` - Экспорты

### 🏗️ layout/ - Компоненты компоновки
- `Header.tsx` - Заголовок приложения
- `BottomNavigation.tsx` - Нижняя навигация
- `MainAppContent.tsx` - Основное содержимое приложения
- `index.ts` - Экспорты

### 🔧 common/ - Общие компоненты
- `LoadingSpinner.tsx` - Индикатор загрузки
- `EmptyState.tsx` - Пустое состояние
- `KeyboardHints.tsx` - Подсказки клавиш
- `index.ts` - Экспорты

## 📦 Использование

Теперь импорты выглядят чище и логичнее:

```typescript
// Старый способ
import AuthFlow from '@components/AuthFlow';
import LoginPage from '@components/LoginPage';
import EventCard from '@components/EventCard';

// Новый способ
import { AuthFlow, LoginPage } from '@components/auth';
import { EventCard, ActionButtons } from '@components/events';
import { Header, BottomNavigation } from '@components/layout';
import { LoadingSpinner, EmptyState } from '@components/common';
import { SettingsModal, EventDetailModal } from '@components/modals';
```

## ✅ Преимущества новой структуры

1. **Логическая группировка** - Легко найти нужный компонент
2. **Чистые импорты** - Можно импортировать несколько компонентов из одной группы
3. **Масштабируемость** - Легко добавлять новые компоненты в соответствующие группы
4. **Понятная иерархия** - Сразу видно назначение компонента по его расположению
5. **Удобство рефакторинга** - Изменения в одной группе не затрагивают другие

## 🔄 Миграция завершена

Все импорты обновлены:
- ✅ App.tsx
- ✅ MainAppContent.tsx
- ✅ Все компоненты auth/
- ✅ Все компоненты events/
- ✅ Все компоненты modals/
- ✅ Все компоненты layout/
- ✅ Все компоненты common/
- ✅ CSS импорты обновлены на относительные пути
