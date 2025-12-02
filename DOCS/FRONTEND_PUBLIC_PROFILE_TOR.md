# Проектное ТЗ для фронтенда (рус.)

## Цель
- Реализовать клиентскую интеграцию с новым API публичного профиля: GET /v1/api/users/public/{userId}.
- Покрыть загрузку, рендер публичных полей, кеширование (ETag/Last-Modified), обработку ошибок, и требования приватности/GDPR.

## 1) Общая информация об эндпоинте
- **Метод**: GET
- **Путь**: `/v1/api/users/public/{userId}` (userId — UUID v4)
- **Контент**: `application/json`
- **Авторизация**: не требуется (публичный)
- **CORS**: обращаться к бекенду через доверённые домены; согласовать с бэком список origin.

## 2) Запросы (образец)
```bash
# curl пример
curl -H "Accept: application/json" \
  -H "If-None-Match: \"etag-value\"" \
  "https://api.example.com/v1/api/users/public/941b955e-ea57-dee3-565f-5684f81c4f14"
```
- **Заголовки**:
  - `Accept: application/json`
  - `If-None-Match` (опционально) — для получения 304
  - `If-Modified-Since` (опционально)

## 3) Успешный ответ (200) — поля для UI
```json
{
  "id":"941b955e-ea57-dee3-565f-5684f81c4f14",
  "displayName":"Иван Иванов",
  "username":"ivanivanov",
  "avatarUrl":"https://cdn.example.com/avatars/941b...jpg",
  "bio":"Организатор мероприятий, спикер",
  "city":"Москва",
  "country":"RU",
  "publicEventsCount":12,
  "isVerified":true,
  "socialLinks":{
    "twitter":"https://twitter.com/ivan",
    "telegram":"https://t.me/ivan"
  },
  "createdAt":"2024-05-02T15:23:45Z",
  "updatedAt":"2025-11-01T12:10:00Z"
}
```
- Отображать только перечисленные публичные поля. Не запрашивать/показывать email, phone, birthdate и т.п.

## 4) Ошибки — поведение клиента
- **400 Bad Request**
  - Текст: `{"error":{"code":"invalid_request","message":"userId must be a valid UUID"}}`
  - UI: показать сообщение "Некорректный идентификатор пользователя" и не перезапрашивать автоматически.
- **404 Not Found**
  - Текст: `{"error":{"code":"not_found","message":"User not found"}}`
  - UI: показать "Пользователь не найден" (не показывать подсказки о наличии аккаунта).
- **304 Not Modified**
  - Клиент должен использовать кешированную версию; не обновлять UI.
- **429 Too Many Requests**
  - UI: показать "Превышен лимит запросов, попробуйте позже".
  - Логика: exponential backoff + информировать пользователя после N неудачных попыток.
- **500 и прочие 5xx**
  - UI: нейтральное сообщение "Ошибка сервера" и возможность retry.

## 5) Кеширование и заголовки
- Ожидаемые заголовки от сервера: `Cache-Control` (public, max-age=300, s-maxage=600), `ETag`, `Last-Modified`.
- Клиент:
  - Сохранять ETag и Last-Modified вместе с данными (IndexedDB / HTTP cache / in-memory store).
  - При повторном запросе отправлять `If-None-Match` / `If-Modified-Since`.
  - TTL: использовать max-age сервера. При истечении — автоматически revalidate.
  - Поведение UI при stale: показывать cached профиль и индикатор "обновляется" при background revalidate (stale-while-revalidate UX предпочтителен).
  - Для списков/карточек профилей кешировать сокращённую модель; при переходе на профиль — использовать кеш + revalidate.

## 6) UI/UX требования
- **Компоненты**:
  - Avatar (avatarUrl), Display name, Username (если есть), Verified badge (isVerified), Bio, Location (city, country), Count public events, Social links (only present links).
  - CreatedAt/UpdatedAt — не обязательны на основной карточке; доступны в расширенном профиле (если нужно).
- **Skeleton / loading state**: показывать skeleton для аватара и текста.
- **Fallbacks**:
  - Если avatarUrl пустой — показать заглушку.
  - Если displayName отсутствует — показать username или "Пользователь".
  - Если socialLinks пусты — не показывать секцию.
- **Публичность**: при получении 404 (is_profile_public == false или несуществующий) — показывать общий экран "Профиль недоступен" без указаний о существовании аккаунта.
- **Ссылки соцсетей**: открывать в новой вкладке с `rel="noopener noreferrer"`.

## 7) Приватность / GDPR
- На клиентах предусмотреть опцию скрытия/удаления публичного профиля (если UI управления аккаунтом есть) — отправлять соответствующие запросы в бекенд (зафиксировать контракт отдельно).
- Не логировать локально приватные поля.
- Для пользователей из EU при удалении профиля — показать статус "анонимизирован" или "удалён", согласовав с бэком.

## 8) Тестирование (frontend)
- **Unit-тесты компонента профиля**:
  - Рендер полного ответа.
  - Рендер с отсутствующими optional полями.
  - Поведение при 404/400/429/500.
  - Кеш + ETag: при 304 — использовать кеш.
- **E2E (Cypress / Playwright)**:
  - Переход на профиль по UUID.
  - Кеширование: эмитировать ETag/304 и проверить UI.
  - Нагрузочные сценарии: последовательный просмотр разных профилей, проверить отсутствие утечек памяти.
- **Тестовые данные**: мокировать ответы с разными комбинациями socialLinks, is_profile_public, isVerified.

## 9) Отслеживание и метрики
- При запросе логировать (анонимно) для аналитики:
  - request_id (из заголовка ответа / бекенда), userId запроса, статус, latency, cacheHit (boolean).
- Отправлять события в analytics при:
  - Ошибках 4xx/5xx (агрегировать).
  - Нажатии на внешние ссылки соцсетей.

## 10) Производительность и rate-limit
- Локальный дебаунс для повторных запросов на один userId (например, 200–300 ms).
- Реализовать retry с backoff для 429/5xx (не более N попыток).
- При массовом рендеринге карточек (список) — batch-запросы / серверная агрегация (обсудить с бэком) вместо N отдельных вызовов.

## 11) Accessibility (A11y)
- Alt-текст для аватара: "{displayName} avatar" или локализованный шаблон.
- Полноценная клавиатурная навигация по профилю/ссылкам.
- Сообщения об ошибках и loading state — доступны для screen readers (aria-live).

## 12) Локализация
- Текст ошибок/заглушек — вынести в i18n файлы.
- Country display: использовать локализацию названий стран при необходимости.

## 13) Контракт и документация
- Обновить frontend API-слой / swagger client:
  - Описать endpoint, возможные статусы и требования по ETag.
  - Примеры ответа и ошибки.
- Договориться с бэком о:
  - Формате ETag (строго совпадение).
  - Политике 404 vs 403 для приватных аккаунтов (рекомендация: 404).

## 14) Acceptance-критерии (фронтенд)
- Профиль загружается и рендерится корректно для валидного UUID.
- Корректная обработка 400/404/429/500 и 304.
- Кеширование работает: при 304 UI не перерисовывает данные, используется ранее закешированный профиль.
- Тесты: unit + e2e покрывают указанные сценарии.
- A11y и i18n реализованы для публичной страницы профиля.
- Логи/метрики отправляются по каждому запросу профиля (request_id, status, latency).

## 15) Примеры кода клиента (fetch) — кратко
```javascript
// GET public profile with ETag handling (pseudo)
async function fetchPublicProfile(userId, cache) {
  const url = `/v1/api/users/public/${userId}`;
  const headers = { Accept: 'application/json' };
  if (cache?.etag) headers['If-None-Match'] = cache.etag;
  const res = await fetch(url, { headers });
  if (res.status === 304) return { cached: true, data: cache.data, etag: cache.etag };
  if (!res.ok) throw await res.json();
  const etag = res.headers.get('etag');
  const data = await res.json();
  return { cached: false, data, etag, lastModified: res.headers.get('last-modified') };
}
```
