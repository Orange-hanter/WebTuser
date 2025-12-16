export type ThemeName = 'light' | 'dark';

const STORAGE_KEY = 'app.theme';

const THEME_CLASSES: Record<Exclude<ThemeName, 'light'>, string> = {
  dark: 'theme-dark',
};

const KNOWN_THEME_CLASSES = Object.values(THEME_CLASSES);

function removeKnownThemeClasses(root: HTMLElement) {
  for (const cls of KNOWN_THEME_CLASSES) {
    root.classList.remove(cls);
  }
}

export function getStoredTheme(): ThemeName {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  removeKnownThemeClasses(root);

  if (theme !== 'light') {
    root.classList.add(THEME_CLASSES[theme]);
  }

  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: ThemeName) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage failures
  }
  applyTheme(theme);
}

export function initTheme() {
  applyTheme(getStoredTheme());
}
