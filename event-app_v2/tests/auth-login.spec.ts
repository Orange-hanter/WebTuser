import { test, expect } from '@playwright/test';

test.describe('Вход в приложение', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим НАПРЯМУЮ на страницу входа без перезагрузки приложения
    // URL структура предполагает что AuthFlow имеет route /login
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Проверяем, что мы на странице входа (она должна загрузиться из AuthFlow)
    // Пытаемся найти кнопку входа или хотя бы какой-то элемент
    const pageContent = await page.content();
    if (!pageContent || pageContent.length < 100) {
      console.log('⚠️ Warning: Page content is minimal, might not be loaded properly');
    }
  });

  test('успешный вход с корректными учётными данными', async ({ page }) => {
    // Используем учётные данные из mock authService
    const email = 'admin@example.com';
    const password = 'admin123';

    // Заполняем форму входа
    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', password);
    
    // Нажимаем кнопку входа
    await page.click('button:has-text("Вход")');

    // Проверяем, что перешли на страницу верификации
    await expect(page).toHaveURL(/.*verification/);
    await expect(page.locator('text=Проверка кода')).toBeVisible();
  });

  test('ошибка при неверном пароле', async ({ page }) => {
    const email = 'admin@example.com';
    const wrongPassword = 'wrongpassword';

    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', wrongPassword);
    
    await page.click('button:has-text("Вход")');

    // Проверяем наличие сообщения об ошибке
    await expect(page.locator('text=неверно|не найден')).toBeVisible({ timeout: 5000 });
  });

  test('ошибка при несуществующем пользователе', async ({ page }) => {
    const email = `nonexistent-${Date.now()}@example.com`;
    const password = 'AnyPassword123!';

    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', password);
    
    await page.click('button:has-text("Вход")');

    // Проверяем сообщение об ошибке
    await expect(page.locator('text=не найден|не существует')).toBeVisible({ timeout: 5000 });
  });

  test('ошибка при пустом email', async ({ page }) => {
    await page.fill('input[placeholder*="пароль"]', 'AnyPassword');
    
    const submitButton = page.locator('button:has-text("Вход")');
    const isDisabled = await submitButton.isDisabled();
    
    expect(isDisabled).toBeTruthy();
  });

  test('ошибка при пустом пароле', async ({ page }) => {
    await page.fill('input[placeholder*="Email"]', 'test@example.com');
    
    const submitButton = page.locator('button:has-text("Вход")');
    const isDisabled = await submitButton.isDisabled();
    
    expect(isDisabled).toBeTruthy();
  });

  test('переключение видимости пароля', async ({ page }) => {
    await page.fill('input[placeholder*="пароль"]', 'TestPassword123');
    
    // Находим кнопку переключения видимости
    const toggleButton = page.locator('button').filter({ has: page.locator('[class*="eye"]') }).first();
    
    // Проверяем начальный тип поля
    const passwordInput = page.locator('input[placeholder*="пароль"]');
    expect(await passwordInput.inputValue()).toBe('TestPassword123');
    
    // Нажимаем на кнопку переключения
    await toggleButton.click();
    
    // Проверяем, что пароль теперь видим (тип поля изменился на text)
    const inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('text');
    
    // Нажимаем ещё раз
    await toggleButton.click();
    
    // Проверяем, что пароль снова скрыт
    const inputTypeAfter = await passwordInput.getAttribute('type');
    expect(inputTypeAfter).toBe('password');
  });

  test('переключение на страницу регистрации', async ({ page }) => {
    const registerLink = page.locator('text=Создать аккаунт');
    await registerLink.click();
    
    // Проверяем, что перешли на страницу регистрации
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('text=Регистрация')).toBeVisible();
  });

  test('отправка пустой формы не работает', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Вход")');
    
    // Кнопка должна быть отключена
    await expect(submitButton).toBeDisabled();
  });
});
