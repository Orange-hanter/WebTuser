import { Page, expect } from '@playwright/test';

/**
 * Утилиты для тестов авторизации
 */

export async function registerUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Переходим на страницу регистрации
  await page.goto('/');
  await page.click('text=Создать аккаунт');

  // Заполняем форму
  await page.fill('input[placeholder*="Email"]', email);
  await page.fill('input[placeholder*="пароль"]', password);
  await page.fill('input[placeholder*="Подтвердите пароль"]', password);

  // Отправляем форму
  await page.click('button:has-text("Регистрация")');

  // Ожидаем страницы верификации
  await expect(page).toHaveURL(/.*verification/);
}

export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Переходим на страницу входа
  await page.goto('/');

  // Заполняем форму
  await page.fill('input[placeholder*="Email"]', email);
  await page.fill('input[placeholder*="пароль"]', password);

  // Отправляем форму
  await page.click('button:has-text("Вход")');

  // Ожидаем страницы верификации
  await expect(page).toHaveURL(/.*verification/);
}

export async function verifyCode(page: Page, code: string = '123456'): Promise<void> {
  // Проверяем, что на странице верификации
  await expect(page).toHaveURL(/.*verification/);

  // Вводим код
  await page.fill('input[placeholder*="цифр"]', code);

  // Отправляем
  await page.click('button:has-text("Проверить")');
}

export async function completeProfile(page: Page): Promise<void> {
  // Проверяем, что на странице профиля
  await expect(page).toHaveURL(/.*profile/);

  // Пропускаем первый шаг
  await page.click('button:has-text("Пропустить")');

  // Ожидаем страницы интересов
  await expect(page).toHaveURL(/.*interests/);

  // Выбираем несколько интересов
  await page.click('button:has-text("Спорт")');
  await page.click('button:has-text("Музыка")');

  // Завершаем
  await page.click('button:has-text("Готово")');
}

export async function completeFullRegistration(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await registerUser(page, email, password);
  await verifyCode(page);
  await completeProfile(page);

  // Ожидаем основного приложения
  await expect(page.locator('text=Афиша')).toBeVisible({ timeout: 5000 });
}

export async function completeFullLogin(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await loginUser(page, email, password);
  await verifyCode(page);
  await completeProfile(page);

  // Ожидаем основного приложения
  await expect(page.locator('text=Афиша')).toBeVisible({ timeout: 5000 });
}

export async function logout(page: Page): Promise<void> {
  // Находим кнопку выхода
  const logoutButton = page.locator('button[aria-label*="Выход"], button[title*="Выход"]');
  await expect(logoutButton).toBeVisible();

  // Нажимаем кнопку
  await logoutButton.click();

  // Ожидаем страницы входа
  await expect(page.locator('text=Вход')).toBeVisible({ timeout: 5000 });
}

export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

export const TEST_PASSWORD = 'TestPassword123!';
export const MOCK_ADMIN_EMAIL = 'admin@example.com';
export const MOCK_ADMIN_PASSWORD = 'admin123';
export const MOCK_VERIFICATION_CODE = '123456';
