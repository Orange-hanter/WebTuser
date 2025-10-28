import { test, expect } from '@playwright/test';

// Создаем custom fixture для page с блокировкой reload
const test_ = test.extend({
  page: async ({ browser }, use) => {
    const context = await browser.newContext();
    
    // Блокируем window.location.reload() ПЕРЕД загрузкой страницы
    await context.addInitScript(() => {
      (window as any).__isTestEnv = true;
      const originalReload = window.location.reload.bind(window.location);
      window.location.reload = function() {
        console.warn('🔴 Blocked reload in test environment');
        return originalReload as any;
      } as any;
    });

    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

test_.describe('Вход в приложение', () => {
  test_.beforeEach(async ({ page }) => {
    // Загружаем приложение
    // window.location.reload() уже заблокирован через fixture
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Даем время на React рендеру
    await page.waitForTimeout(500);
  });

  test_('успешный вход с корректными учётными данными', async ({ page }) => {
    // Используем учётные данные из mock authService
    const email = "danil.bel56@gmail.com";
    const password = "2mE-v78-qbc-wNH";

  // Заполняем форму входа (используем data-testid селекторы)
  await page.fill('[data-testid="login-email-input"]', email);
  await page.fill('[data-testid="login-password-input"]', password);

  // Нажимаем кнопку входа
  await page.click('[data-testid="login-submit-button"]');

    // Проверяем, что перешли на страницу верификации
    await page.reload();
    await page.reload();
    await expect(page.getByText("Афиша", { exact: false })).toBeVisible();
  });

  test_('ошибка при неверном пароле', async ({ page }) => {
    const email = 'admin@example.com';
    const wrongPassword = 'wrongpassword';

  await page.fill('[data-testid="login-email-input"]', email);
  await page.fill('[data-testid="login-password-input"]', wrongPassword);

  await page.click('[data-testid="login-submit-button"]');

    // Проверяем наличие сообщения об ошибке
    await expect(page.locator('text=неверно|не найден')).toBeVisible({ timeout: 5000 });
  });

  test_('ошибка при несуществующем пользователе', async ({ page }) => {
    const email = `nonexistent-${Date.now()}@example.com`;
    const password = 'AnyPassword123!';

  await page.fill('[data-testid="login-email-input"]', email);
  await page.fill('[data-testid="login-password-input"]', password);

  await page.click('[data-testid="login-submit-button"]');

    // Проверяем сообщение об ошибке
    await expect(page.locator('text=не найден|не существует')).toBeVisible({ timeout: 5000 });
  });

  test_('ошибка при пустом email', async ({ page }) => {
  await page.fill('[data-testid="login-password-input"]', 'AnyPassword');
    
  const submitButton = page.locator('[data-testid="login-submit-button"]');
    const isDisabled = await submitButton.isDisabled();
    
    expect(isDisabled).toBeTruthy();
  });

  test_('ошибка при пустом пароле', async ({ page }) => {
  await page.fill('[data-testid="login-email-input"]', 'test@example.com');
    
  const submitButton = page.locator('[data-testid="login-submit-button"]');
    const isDisabled = await submitButton.isDisabled();
    
    expect(isDisabled).toBeTruthy();
  });

  test_('переключение видимости пароля', async ({ page }) => {
  await page.fill('[data-testid="login-password-input"]', 'TestPassword123');

  // Находим кнопку переключения видимости рядом с полем пароля
  const passwordInput = page.locator('[data-testid="login-password-input"]');
  const toggleButton = passwordInput.locator('xpath=following-sibling::button').first();

  // Проверяем начальное значение поля
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

  test_('переключение на страницу регистрации', async ({ page }) => {
  const registerLink = page.locator('[data-testid="login-switch-register"]');
  await registerLink.click();
    
    // Проверяем, что перешли на страницу регистрации
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('text=Регистрация')).toBeVisible();
  });

  test_('отправка пустой формы не работает', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Вход")');
    
    // Кнопка должна быть отключена
    await expect(submitButton).toBeDisabled();
  });
});
