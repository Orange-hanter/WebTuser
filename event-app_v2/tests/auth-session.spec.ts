import { test, expect } from '@playwright/test';

test.describe('Сессия и выход', () => {
  test('сохранение сессии после перезагрузки', async ({ page }) => {
    // Заходим в приложение
    await page.goto('/');
    
    // Проверяем, что находимся на странице входа
    await expect(page.locator('text=Вход')).toBeVisible();

    // Входим с mock учётными данными
    await page.fill('input[placeholder*="Email"]', 'admin@example.com');
    await page.fill('input[placeholder*="пароль"]', 'admin123');
    await page.click('button:has-text("Вход")');

    // Проходим верификацию
    await expect(page).toHaveURL(/.*verification/);
    await page.fill('input[placeholder*="цифр"]', '123456');
    await page.click('button:has-text("Проверить")');

    // Пропускаем профиль
    await expect(page).toHaveURL(/.*profile/);
    await page.click('button:has-text("Пропустить")');

    // Завершаем регистрацию
    await expect(page).toHaveURL(/.*interests/);
    await page.click('button:has-text("Спорт")');
    await page.click('button:has-text("Готово")');

    // Ждём загрузки основного приложения
    await expect(page.locator('text=Афиша')).toBeVisible();
    const currentUrl = page.url();

    // Перезагружаем страницу
    await page.reload();

    // Проверяем, что остаёмся авторизованными
    await expect(page.locator('text=Афиша')).toBeVisible({ timeout: 5000 });
    
    // Проверяем, что не вернулись на страницу входа
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('выход из приложения', async ({ page }) => {
    // Входим в приложение
    await page.goto('/');
    
    await page.fill('input[placeholder*="Email"]', 'admin@example.com');
    await page.fill('input[placeholder*="пароль"]', 'admin123');
    await page.click('button:has-text("Вход")');

    // Верификация
    await expect(page).toHaveURL(/.*verification/);
    await page.fill('input[placeholder*="цифр"]', '123456');
    await page.click('button:has-text("Проверить")');

    // Профиль
    await expect(page).toHaveURL(/.*profile/);
    await page.click('button:has-text("Пропустить")');

    // Интересы
    await expect(page).toHaveURL(/.*interests/);
    await page.click('button:has-text("Спорт")');
    await page.click('button:has-text("Готово")');

    // Ждём основного приложения
    await expect(page.locator('text=Афиша')).toBeVisible();

    // Находим кнопку выхода (обычно в хедере)
    const logoutButton = page.locator('button[aria-label*="Выход"], button[title*="Выход"]');
    await expect(logoutButton).toBeVisible();

    // Нажимаем кнопку выхода
    await logoutButton.click();

    // Должны вернуться на страницу входа
    await expect(page.locator('text=Вход')).toBeVisible({ timeout: 5000 });
  });

  test('невозможно получить доступ к основному приложению без входа', async ({ page }) => {
    // Пытаемся перейти напрямую
    await page.goto('/');

    // Должны быть перенаправлены на страницу входа
    await expect(page.locator('text=Вход')).toBeVisible();
  });

  test('перезагрузка после выхода показывает страницу входа', async ({ page }) => {
    // Входим
    await page.goto('/');
    
    await page.fill('input[placeholder*="Email"]', 'admin@example.com');
    await page.fill('input[placeholder*="пароль"]', 'admin123');
    await page.click('button:has-text("Вход")');

    await expect(page).toHaveURL(/.*verification/);
    await page.fill('input[placeholder*="цифр"]', '123456');
    await page.click('button:has-text("Проверить")');

    await expect(page).toHaveURL(/.*profile/);
    await page.click('button:has-text("Пропустить")');

    await expect(page).toHaveURL(/.*interests/);
    await page.click('button:has-text("Спорт")');
    await page.click('button:has-text("Готово")');

    await expect(page.locator('text=Афиша')).toBeVisible();

    // Выходим
    const logoutButton = page.locator('button[aria-label*="Выход"], button[title*="Выход"]');
    await logoutButton.click();

    // Ждём страницы входа
    await expect(page.locator('text=Вход')).toBeVisible();

    // Перезагружаем
    await page.reload();

    // Остаёмся на странице входа
    await expect(page.locator('text=Вход')).toBeVisible();
  });

  test('очистка token после выхода', async ({ page, context }) => {
    // Входим
    await page.goto('/');
    
    await page.fill('input[placeholder*="Email"]', 'admin@example.com');
    await page.fill('input[placeholder*="пароль"]', 'admin123');
    await page.click('button:has-text("Вход")');

    await expect(page).toHaveURL(/.*verification/);
    await page.fill('input[placeholder*="цифр"]', '123456');
    await page.click('button:has-text("Проверить")');

    await expect(page).toHaveURL(/.*profile/);
    await page.click('button:has-text("Пропустить")');

    await expect(page).toHaveURL(/.*interests/);
    await page.click('button:has-text("Спорт")');
    await page.click('button:has-text("Готово")');

    await expect(page.locator('text=Афиша')).toBeVisible();

    // Проверяем наличие token в sessionStorage
    let token = await page.evaluate(() => sessionStorage.getItem('authToken'));
    expect(token).toBeTruthy();

    // Выходим
    const logoutButton = page.locator('button[aria-label*="Выход"], button[title*="Выход"]');
    await logoutButton.click();

    await expect(page.locator('text=Вход')).toBeVisible();

    // Проверяем, что token удалён
    token = await page.evaluate(() => sessionStorage.getItem('authToken'));
    expect(token).toBeNull();
  });
});
