import { test, expect } from '@playwright/test';

test.describe('Регистрация', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Нажимаем на кнопку "Создать аккаунт"
    await page.click("text=Зарегистрируйся");
  });

  test('успешная регистрация с корректными данными', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Заполняем форму регистрации
    await page.fill('input[placeholder*="your@email.com"]', email);
    await page.fill('input[placeholder*="Минимум 6 символов"]', password);
    await page.fill('input[placeholder*="Повтори пароль"]', password);
    
    // Нажимаем кнопку регистрации
    await page.click('button:has-text("Зарегистрироваться")');

    // Проверяем, что перешли на страницу верификации
    await expect(page).toHaveURL(/.*verification/);
    await expect(page.locator('text=Проверка кода')).toBeVisible();
  });

  test('ошибка при несовпадении паролей', async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;

    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', 'TestPassword123!');
    await page.fill('input[placeholder*="Подтвердите пароль"]', 'DifferentPassword123!');
    
    // Кнопка должна быть отключена или появится ошибка
    const errorText = await page.locator('text=совпадают').isVisible();
    expect(errorText).toBeTruthy();
  });

  test('ошибка при пустых полях', async ({ page }) => {
    // Пытаемся отправить форму без заполнения полей
    const submitButton = page.locator('button:has-text("Регистрация")');
    const isDisabled = await submitButton.isDisabled();
    
    expect(isDisabled).toBeTruthy();
  });

  test('ошибка при коротком пароле', async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;

    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', '123');
    await page.fill('input[placeholder*="Подтвердите пароль"]', '123');
    
    // Проверяем наличие ошибки про минимальную длину
    const errorText = await page.locator('text=минимум').isVisible();
    expect(errorText).toBeTruthy();
  });

  test('переключение на страницу входа', async ({ page }) => {
    const loginLink = page.locator('text=Уже есть аккаунт?');
    await loginLink.click();
    
    // Проверяем, что перешли на страницу входа
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=Вход')).toBeVisible();
  });
});
