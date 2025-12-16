# Темы (Theming) и переключение темы — подробная инструкция

Этот документ объясняет:

1) **Где живут цвета/градиенты/тени** в проекте и как правильно добавлять новые токены.
2) **Как создавать новые темы** (например, `theme-dark`, `theme-ocean`, `theme-high-contrast`).
3) **Как переключать темы в рантайме** (без перезагрузки) и **как сохранять выбор пользователя**.

> В проекте используется подход **CSS Variables (CSS custom properties)**: компонентные CSS-файлы берут значения через `var(--token-name)`, а тема — это набор переопределений этих переменных.

---

## 1) Текущая архитектура

### 1.1. Источник правды для токенов

Основной файл токенов:

- `event-app_v2/src/styles/theme.css`

Он подключён глобально через:

- `event-app_v2/src/index.css` (в самом верху: `@import './styles/theme.css';`)

Значит: **любая страница/компонент** может использовать переменные из `theme.css`.

### 1.2. Базовая тема

В `theme.css` блок `:root { ... }` содержит **дефолтные значения** (фактически “светлая тема” по умолчанию).

Пример (упрощённо):

```css
:root {
  --color-bg: #ffffff;
  --color-text: #213547;
  --color-primary: #6366f1;
}
```

### 1.3. Темы как CSS-классы

В `theme.css` уже есть пример темы:

```css
.theme-dark {
  --color-bg: #0b1220;
  --color-text: #e5e7eb;
}
```

Это означает: если вы добавите класс `theme-dark` на `<html>` или `<body>`, то значения переменных **переопределятся**.

---

## 2) Важные правила (чтобы темы работали предсказуемо)

### Правило A: В компонентах не используем “жёсткие” цвета

Плохо:

```css
color: #1f2937;
background: rgba(255,255,255,0.9);
```

Хорошо:

```css
color: var(--gray-800);
background: var(--white-a90);
```

### Правило B: Не дублируем значения

Если вам нужен новый оттенок/тень/полупрозрачность — **добавляйте токен в `theme.css`**, а не вставляйте hex/rgba в компонент.

### Правило C: Используем понятные нейминги

Рекомендуемый стиль:

- Общие: `--color-bg`, `--color-text`, `--surface-card`, `--shadow-elev-1`
- Нейтрали: `--gray-50 ... --gray-800`, `--white`, `--black`
- Альфы: `--white-a10`, `--black-a20` (обязательно указывать процент/долю)
- Семантика: `--color-danger`, `--color-warning-bg`, `--color-success`
- Фичи/области: `--color-radar`, `--gradient-primary-135` (если реально специфично)

### Правило D: Алиасы “старых” переменных

В проекте встречаются старые переменные вроде:

- `--background-color`, `--card-background`, `--text-primary`, `--text-secondary`, `--primary-color`, `--border-color`, `--error-color`

Чтобы не ломать старый CSS, они уже заведены как **алиасы** в `theme.css`:

```css
--background-color: var(--color-bg);
--card-background: var(--surface-card);
--text-primary: var(--color-text);
--text-secondary: var(--gray-600);
--primary-color: var(--color-primary);
--border-color: var(--gray-200);
--error-color: var(--color-danger);
```

Рекомендуемая стратегия:

- Новые компоненты пишем **только** на новых токенах (`--color-*`, `--surface-*`, `--shadow-*`).
- Старые постепенно мигрируем, но пока алиасы остаются для совместимости.

---

## 3) Как создать новую тему (пример: `theme-ocean`)

### 3.1. Шаг 1 — определить набор переопределений

Вам не нужно переписывать весь `:root`. Переопределяйте только то, что хотите изменить.

Например, создадим тему “океан”, которая меняет фон, текст, primary/accent и карточки:

```css
.theme-ocean {
  --color-bg: #061827;
  --color-text: #e6f1ff;

  --color-primary: #38bdf8;
  --color-primary-hover: #0ea5e9;
  --color-accent: #22c55e;

  --surface-card: rgba(17, 34, 51, 0.92);
  --shadow-card: 0 25px 50px rgba(0, 0, 0, 0.55);

  /* если нужно: алиасы автоматически "подхватят" новые значения */
}
```

Где размещать:

- В конце `event-app_v2/src/styles/theme.css` рядом с `.theme-dark`.

### 3.2. Шаг 2 — применить класс к документу

Любой из вариантов корректен:

- На `<html>`: `document.documentElement.classList.add('theme-ocean')`
- На `<body>`: `document.body.classList.add('theme-ocean')`

Рекомендация: использовать **`<html>`** (`document.documentElement`), потому что переменные и `color-scheme` логичнее держать на корне.

---

## 4) Механизм переключения темы (правильно и без багов)

Цель механизма:

- Всегда активна **ровно одна** тема.
- Выбор пользователя **сохраняется** в `localStorage`.
- Тема применяется **раньше**, чем React отрисует UI (чтобы не было “мигания” темы).

Ниже — вариант, который проще всего поддерживать.

### 4.1. Определяем список поддерживаемых тем

Например:

- `theme-light` (можно считать “без класса”)
- `theme-dark`
- `theme-ocean`

Есть два подхода:

1) “Light = без класса” (самый простой):
   - Светлая тема — это `:root`
   - Тёмная — `.theme-dark`

2) “Всегда есть класс” (строже):
   - `.theme-light { ... }` тоже существует
   - При переключении всегда ставим один из классов

Оба работают. В этом проекте уже естественно подходит вариант (1).

### 4.2. Где хранить выбор

Рекомендуемый ключ:

- `localStorage['app.theme']`

Значения:

- `'light' | 'dark' | 'ocean'` (любые строки, но лучше фиксировать список)

### 4.3. Где применять тему

Самое раннее место в приложении:

- `event-app_v2/src/main.tsx`

Важно: применять тему **до** `createRoot(...).render(...)`.

### 4.4. Реализация (минимальная, без React контекста)

Добавьте небольшой модуль (рекомендуется):

**Файл:** `event-app_v2/src/styles/themeRuntime.ts` (название на ваш вкус)

Пример кода:

```ts
export type ThemeName = 'light' | 'dark' | 'ocean';

const STORAGE_KEY = 'app.theme';

const THEME_CLASS_BY_NAME: Record<Exclude<ThemeName, 'light'>, string> = {
  dark: 'theme-dark',
  ocean: 'theme-ocean',
};

function removeKnownThemeClasses(el: HTMLElement) {
  el.classList.remove('theme-dark', 'theme-ocean');
}

export function getStoredTheme(): ThemeName {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'dark' || raw === 'ocean' || raw === 'light') return raw;
  return 'light';
}

export function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  removeKnownThemeClasses(root);

  if (theme !== 'light') {
    root.classList.add(THEME_CLASS_BY_NAME[theme]);
  }

  // Опционально: улучшает нативные контролы (input/select/scrollbars) в соответствии с темой
  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: ThemeName) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function initTheme() {
  applyTheme(getStoredTheme());
}
```

И в `main.tsx` перед рендером:

```ts
import { initTheme } from '@/styles/themeRuntime';

initTheme();
```

Почему так лучше:

- При старте тема применяется сразу.
- Всегда чистим предыдущие классы (иначе можно получить конфликтующие переопределения).
- `colorScheme` синхронизируется с темой (полезно для нативных элементов).

### 4.5. Реализация с React (если нужен глобальный state)

Если вы хотите кнопку/переключатель внутри приложения, удобнее сделать контекст.

Схема:

- `ThemeProvider` хранит `theme` в `useState`.
- При изменении вызывает `setTheme(theme)` из runtime-модуля.

Псевдокод:

```tsx
const ThemeContext = createContext({ theme: 'light', setTheme: () => {} });

function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('app.theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

Когда выбирать этот вариант:

- Если тема меняется из UI (кнопка “Dark/Light”).
- Если нужно показывать текущее состояние темы в интерфейсе.

Когда НЕ надо:

- Если тема задаётся только “на старте” и редко меняется.

---

## 5) Как мигрировать существующий CSS на токены (чеклист)

1) Найдите все `#hex`, `rgb(...)`, `rgba(...)` в файле.
2) Для каждого значения выберите токен:
   - серые → `--gray-*`
   - белые/чёрные с прозрачностью → `--white-a*` / `--black-a*`
   - брендовые → `--color-primary`, `--color-accent`, `--gradient-*`
   - статусы → `--color-success`, `--color-warning`, `--color-danger` (+ `*-bg`, `*-border`)
3) Если токена нет — добавьте его в `theme.css`.
4) Проверьте, что в CSS нет “магических” цветов, кроме `transparent`.

Подсказка: иногда правильнее вводить **семантический токен**, а не "ещё один серый":

- вместо `--gray-500` для вторичного текста → `--text-secondary` (семантика)
- вместо прямого `rgba(0,0,0,0.1)` для тени → `--shadow-elev-1`

---

## 6) Как проверить, что темы реально работают

### Быстрая проверка в DevTools

1) Откройте DevTools → Elements.
2) На `<html>` добавьте класс `theme-dark`.
3) Убедитесь, что:
   - фон/текст меняются
   - карточки/границы/кнопки не теряют контраст

### Проверка “нет жёстких цветов”

Идеально: в `src/components/**` должно стремиться к нулю число hex/rgba.

---

## 7) Частые ошибки и как их избежать

1) **Забыли удалить старый класс темы** → получите конфликт переменных.
   - Решение: всегда `removeKnownThemeClasses()` перед добавлением.

2) **Оставили `color-scheme: light` жёстко** и включили темную тему.
   - Решение: выставлять `document.documentElement.style.colorScheme` при применении темы.

3) **Добавили токен только в `.theme-dark`, но не в `:root`**.
   - В светлой теме переменная станет “undefined”.
   - Решение: все токены должны иметь дефолт в `:root`.

4) **Смешали семантику и палитру**.
   - Решение: палитра (`--gray-500`) — это “цвет”, семантика (`--text-secondary`) — это “роль”.

---

## 8) Рекомендуемая минимальная схема для этого проекта

- Токены и темы держим в `event-app_v2/src/styles/theme.css`.
- Применение темы — класс на `<html>`.
- Сохранение выбора — `localStorage['app.theme']`.
- Инициализация — в `event-app_v2/src/main.tsx` до рендера.

Если хочешь — я могу:

- добавить `themeRuntime.ts` и подключить его в `main.tsx` (без UI),
- или сделать небольшой React-контекст для темы (если нужен переключатель в интерфейсе).
