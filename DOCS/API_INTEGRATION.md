# API Integration Guide

## Обзор

Приложение использует API сервис для загрузки событий с поддержкой бесконечной подзагрузки.

## Эндпоинты

### 1. Получение списка событий с пагинацией

**Функция:** `fetchEventsBatch(offset, limit)`

**Параметры:**
- `offset` (number) - Смещение от начала списка (по умолчанию: 0)
- `limit` (number) - Количество событий для загрузки (по умолчанию: 5)

**Возвращает:**
```javascript
{
  success: true,
  data: [
    {
      id: 1,
      title: "Событие",
      type: "Музыка",
      location: "Место",
      time: "19:00",
      date: "Завтра",
      attendees: 24,
      rating: 4.8,
      description: "...",
      image: "URL",
      tags: ["tag1", "tag2"]
    }
    // ... еще события
  ],
  pagination: {
    offset: 0,
    limit: 5,
    total: 50,
    hasMore: true
  }
}
```

**Пример использования:**
```javascript
import { fetchEventsBatch } from '../services/eventApi';

// Загрузить первые 5 событий
const result = await fetchEventsBatch(0, 5);

// Загрузить события с смещением
const moreEvents = await fetchEventsBatch(5, 5);
```

---

### 2. Получение деталей события

**Функция:** `fetchEventDetails(eventId)`

**Параметры:**
- `eventId` (number) - ID события

**Возвращает:**
```javascript
{
  success: true,
  data: {
    id: 1,
    title: "Событие",
    // ... все стандартные поля события
    fullDescription: "Расширенное описание",
    organizer: {
      name: "Организатор",
      rating: 4.8,
      reviews: 342
    }
  }
}
```

**Пример использования:**
```javascript
import { fetchEventDetails } from '../services/eventApi';

const eventDetails = await fetchEventDetails(1);
console.log(eventDetails.data.organizer);
```

---

### 3. Работа с внешним API (демонстрация)

**Функция:** `fetchFromExternalAPI(endpoint)`

**Параметры:**
- `endpoint` (string) - Эндпоинт относительно базового URL

**Пример использования:**
```javascript
import { fetchFromExternalAPI } from '../services/eventApi';

// Загрузить посты с JSONPlaceholder
const posts = await fetchFromExternalAPI('/posts');
```

---

## Хуки для управления данными

### useInfiniteEventScroll()

Хук для управления бесконечной подзагрузкой событий.

**Возвращает:**
```javascript
{
  events: [],           // Массив загруженных событий
  isLoading: false,     // Статус загрузки
  error: null,          // Ошибка (если есть)
  hasMore: true,        // Есть ли еще события
  loadMoreEvents,       // Функция для загрузки
  reset                 // Функция для сброса
}
```

**Пример:**
```javascript
import { useInfiniteEventScroll } from '../hooks/useEventLogic';

const { events, isLoading, hasMore, loadMoreEvents } = useInfiniteEventScroll();

// Загрузить при необходимости
if (events.length < 10 && hasMore && !isLoading) {
  loadMoreEvents();
}
```

---

## Как интегрировать реальный API

### Вариант 1: Замена эндпоинта

Отредактируйте `services/eventApi.js`:

```javascript
const API_BASE_URL = 'https://your-api.com/api';

export const fetchEventsBatch = async (offset = 0, limit = 5) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/events?offset=${offset}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.events,
      pagination: data.pagination
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};
```

### Вариант 2: Использование Axios

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://your-api.com/api'
});

export const fetchEventsBatch = async (offset = 0, limit = 5) => {
  try {
    const { data } = await apiClient.get('/events', {
      params: { offset, limit }
    });
    
    return {
      success: true,
      data: data.events,
      pagination: data.pagination
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};
```

---

## Обработка ошибок

```javascript
import { useInfiniteEventScroll } from '../hooks/useEventLogic';

const { events, error, isLoading, loadMoreEvents } = useInfiniteEventScroll();

if (error) {
  return (
    <div>
      <p>Ошибка: {error}</p>
      <button onClick={loadMoreEvents}>Повторить</button>
    </div>
  );
}
```

---

## Производительность и оптимизация

1. **Пакетная загрузка:** События загружаются порциями по 5 штук
2. **Автоматическая загрузка:** События загружаются автоматически при приближении к концу
3. **Кэширование:** События остаются в памяти до перезагрузки страницы
4. **Индикаторы загрузки:** Пользователь видит процесс загрузки

---

## Примечания

- Текущая реализация использует mock данные для демонстрации
- Все функции асинхронные (возвращают Promise)
- Ошибки обрабатываются и выводятся в консоль
- Время задержки для имитации сети: 400-800ms
