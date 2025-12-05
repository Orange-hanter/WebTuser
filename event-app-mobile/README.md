# Event App Mobile (React Native)

Мобильная версия приложения событий, созданная на React Native с использованием Expo.

## Требования

- Node.js 18+
- npm или yarn
- Expo CLI
- Xcode (для iOS) или Android Studio (для Android)

## Установка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm start

# Запуск на iOS
npm run ios

# Запуск на Android
npm run android
```

## Структура проекта

```
event-app-mobile/
├── App.tsx                    # Главный компонент приложения
├── app.json                   # Конфигурация Expo
├── package.json               # Зависимости
├── tsconfig.json              # TypeScript конфигурация
├── babel.config.js            # Babel конфигурация
├── tailwind.config.js         # NativeWind/Tailwind конфигурация
└── src/
    ├── components/            # Переиспользуемые компоненты
    │   ├── common/           # Общие компоненты (Avatar, Toast, etc.)
    │   └── events/           # Компоненты событий
    ├── contexts/             # React контексты (Auth, Toast)
    ├── navigation/           # React Navigation настройки
    │   ├── AuthNavigator.tsx
    │   ├── MainNavigator.tsx
    │   └── RootNavigator.tsx
    ├── screens/              # Экраны приложения
    │   ├── auth/            # Экраны авторизации
    │   └── main/            # Основные экраны
    ├── services/            # API сервисы
    │   ├── authService.ts
    │   ├── eventApi.ts
    │   └── telegramService.ts
    └── types/               # TypeScript типы
```

## Основные функции

### Авторизация
- Вход по email/пароль
- Регистрация с верификацией по email
- Сохранение сессии в AsyncStorage
- Обновление профиля

### События
- Просмотр списка событий
- Поиск и фильтрация
- Детальная информация о событии
- Создание нового события
- Запись на событие

### Профиль
- Просмотр и редактирование профиля
- Привязка/отвязка Telegram
- Настройки и выход

### Telegram интеграция
- Привязка аккаунта Telegram
- Уведомления о событиях
- Deep linking

## Технологии

- **React Native** - кросс-платформенная разработка
- **Expo** - инструментарий для React Native
- **TypeScript** - типизация
- **React Navigation** - навигация
- **AsyncStorage** - локальное хранилище
- **Expo Vector Icons** - иконки
- **NativeWind** - Tailwind CSS для React Native

## Миграция с веб-версии

Этот проект является мобильной версией веб-приложения event-app_v2. Основные изменения:

1. **Стили**: CSS заменен на StyleSheet и NativeWind
2. **Навигация**: React Router заменен на React Navigation
3. **Хранилище**: localStorage заменен на AsyncStorage
4. **Компоненты**: HTML элементы заменены на React Native компоненты
5. **API**: Тот же API, адаптированный для mobile

## Конфигурация API

Измените URL API в файлах сервисов:

```typescript
// src/services/authService.ts
const API_BASE_URL = 'https://your-api-domain.com/api';
```

## Сборка

### iOS
```bash
expo build:ios
# или
eas build --platform ios
```

### Android
```bash
expo build:android
# или
eas build --platform android
```

## Дополнительно

- [Документация Expo](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)
