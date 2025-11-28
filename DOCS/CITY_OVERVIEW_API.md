# API для страницы "Обзор города" (City Overview)

## Описание
Страница предоставляет пользователю глобальное понимание происходящего в городе: тренды, популярные события, статистику по категориям и иерархическое дерево тегов для фильтрации.

---

## 1. GET /v1/api/city/overview

### Описание
Получить сводную информацию о городе: общая статистика, тренды, ближайшие крупные события.

### Response
```json
{
  "success": true,
  "data": {
    "city": "Москва",
    "totalEvents": 1250,
    "totalActiveUsers": 45000,
    "eventsThisWeek": 342,
    "eventsThisWeekend": 128,
    "trends": [
      {
        "type": "rising",
        "label": "Стендап",
        "growth": 45,
        "description": "+45% за неделю"
      },
      {
        "type": "hot",
        "label": "Открытые лекции",
        "growth": 30,
        "description": "Популярно сейчас"
      }
    ],
    "highlights": [
      {
        "id": "evt-123",
        "title": "Фестиваль уличной еды",
        "date": "2025-11-30",
        "attendees": 2500,
        "image": "https://..."
      }
    ],
    "weather": {
      "temp": 5,
      "condition": "cloudy",
      "recommendation": "Отличный день для закрытых мероприятий"
    }
  }
}
```

---

## 2. GET /v1/api/tags/tree

### Описание
Получить иерархическое дерево тегов для фильтрации событий.

### Query Parameters
| Параметр | Тип | Описание |
|----------|-----|----------|
| `includeCount` | boolean | Включить количество событий для каждого тега |
| `activeOnly` | boolean | Только теги с активными событиями |

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "music",
      "label": "Музыка",
      "icon": "🎵",
      "count": 245,
      "children": [
        {
          "id": "music-live",
          "label": "Живая музыка",
          "icon": "🎸",
          "count": 120,
          "children": [
            { "id": "music-live-rock", "label": "Рок", "count": 45 },
            { "id": "music-live-jazz", "label": "Джаз", "count": 32 },
            { "id": "music-live-classical", "label": "Классика", "count": 28 }
          ]
        },
        {
          "id": "music-dj",
          "label": "DJ сеты",
          "count": 85,
          "children": [
            { "id": "music-dj-techno", "label": "Техно", "count": 40 },
            { "id": "music-dj-house", "label": "Хаус", "count": 30 }
          ]
        },
        { "id": "music-karaoke", "label": "Караоке", "count": 40 }
      ]
    },
    {
      "id": "sport",
      "label": "Спорт",
      "icon": "⚽",
      "count": 180,
      "children": [
        { "id": "sport-football", "label": "Футбол", "count": 45 },
        { "id": "sport-basketball", "label": "Баскетбол", "count": 30 },
        { "id": "sport-yoga", "label": "Йога", "count": 60 },
        { "id": "sport-run", "label": "Бег", "count": 25 }
      ]
    },
    {
      "id": "education",
      "label": "Образование",
      "icon": "📚",
      "count": 320,
      "children": [
        { "id": "edu-lectures", "label": "Лекции", "count": 150 },
        { "id": "edu-masterclass", "label": "Мастер-классы", "count": 100 },
        { "id": "edu-courses", "label": "Курсы", "count": 70 }
      ]
    },
    {
      "id": "art",
      "label": "Искусство",
      "icon": "🎨",
      "count": 210,
      "children": [
        { "id": "art-exhibition", "label": "Выставки", "count": 80 },
        { "id": "art-theater", "label": "Театр", "count": 65 },
        { "id": "art-cinema", "label": "Кино", "count": 45 }
      ]
    },
    {
      "id": "social",
      "label": "Общение",
      "icon": "💬",
      "count": 175,
      "children": [
        { "id": "social-networking", "label": "Нетворкинг", "count": 60 },
        { "id": "social-party", "label": "Вечеринки", "count": 80 },
        { "id": "social-dating", "label": "Знакомства", "count": 35 }
      ]
    },
    {
      "id": "food",
      "label": "Еда и напитки",
      "icon": "🍕",
      "count": 95,
      "children": [
        { "id": "food-tasting", "label": "Дегустации", "count": 40 },
        { "id": "food-cooking", "label": "Кулинарные МК", "count": 35 },
        { "id": "food-festival", "label": "Фуд-фестивали", "count": 20 }
      ]
    }
  ]
}
```

---

## 3. GET /v1/api/analytics/category-stats

### Описание
Расширенная статистика по категориям для визуализации (лепестковая диаграмма).

### Response
```json
{
  "success": true,
  "data": [
    {
      "type": "music",
      "label": "Музыка",
      "count": 245,
      "trend": 12,
      "color": "#9333EA",
      "weeklyChange": 15
    },
    {
      "type": "sport",
      "label": "Спорт",
      "count": 180,
      "trend": -5,
      "color": "#EF4444",
      "weeklyChange": -8
    }
  ]
}
```

---

## 4. GET /v1/api/events/trending

### Описание
Получить топ трендовых событий.

### Query Parameters
| Параметр | Тип | Описание |
|----------|-----|----------|
| `limit` | number | Количество событий (default: 5) |
| `period` | string | Период: "today", "week", "month" |

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "evt-456",
      "title": "Stand-up вечер",
      "type": "entertainment",
      "attendees": 150,
      "growthRate": 85,
      "date": "2025-11-29T19:00:00Z",
      "location": "Comedy Club",
      "image": "https://..."
    }
  ]
}
```

---

## 5. GET /v1/api/events/happening-now

### Описание
События, происходящие прямо сейчас или в ближайший час.

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "evt-789",
      "title": "Йога в парке",
      "startsIn": 30,
      "location": "Парк Горького",
      "spotsLeft": 5,
      "type": "sport"
    }
  ],
  "meta": {
    "totalHappeningNow": 12,
    "nextHourEvents": 8
  }
}
```

---

## 6. GET /v1/api/city/activity-heatmap

### Описание
Данные для тепловой карты активности по дням недели и времени.

### Response
```json
{
  "success": true,
  "data": {
    "heatmap": [
      { "day": 0, "hour": 18, "intensity": 85 },
      { "day": 0, "hour": 19, "intensity": 92 },
      { "day": 5, "hour": 20, "intensity": 100 },
      { "day": 6, "hour": 14, "intensity": 78 }
    ],
    "peakTime": {
      "day": "Суббота",
      "hour": "20:00",
      "description": "Самое активное время"
    }
  }
}
```

---

## Примечания по реализации

### Frontend
- Кэшировать данные обзора города на 5 минут
- Дерево тегов загружать при первом открытии, обновлять при pull-to-refresh
- Для лепестковой диаграммы использовать smooth анимации при hover

### Backend
- Предварительно агрегировать данные в фоновом задании (каждые 5 минут)
- Использовать Redis для кэширования статистики
- Индексировать таблицу событий по `type`, `start`, `status`
