import { test, expect } from '@playwright/test';

test.describe('Верификация и профиль', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Переходим на регистрацию
    await page.click('text=Создать аккаунт');
  });

  test('успешная верификация с корректным кодом', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Регистрация
    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', password);
    await page.fill('input[placeholder*="Подтвердите пароль"]', password);
    await page.click('button:has-text("Регистрация")');

    // Ожидаем страницы верификации
    await expect(page).toHaveURL(/.*verification/);
    await expect(page.locator('text=Проверка кода')).toBeVisible();

    // В mock-сервисе код всегда "123456"
    await page.fill('input[placeholder*="цифр"]', '123456');
    
    // Нажимаем кнопку проверки
    await page.click('button:has-text("Проверить")');

    // Должны перейти на ProfileStep1
    await expect(page).toHaveURL(/.*profile/);
    await expect(page.locator('text=50%|Профиль')).toBeVisible();
  });

  test('ошибка при неверном коде верификации', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Регистрация
    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', password);
    await page.fill('input[placeholder*="Подтвердите пароль"]', password);
    await page.click('button:has-text("Регистрация")');

    // На странице верификации
    await expect(page).toHaveURL(/.*verification/);

    // Вводим неверный код
    await page.fill('input[placeholder*="цифр"]', '000000');
    await page.click('button:has-text("Проверить")');

    // Проверяем ошибку
    await expect(page.locator('text=неверно|не совпадает')).toBeVisible({ timeout: 5000 });
  });

  test('переключение между методами верификации', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Регистрация
    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', password);
    await page.fill('input[placeholder*="Подтвердите пароль"]', password);
    await page.click('button:has-text("Регистрация")');

    // На странице верификации
    await expect(page).toHaveURL(/.*verification/);

    // Проверяем, что Email выбран
    const emailButton = page.locator('button:has-text("Email")').first();
    const emailClass = await emailButton.getAttribute('class');
    expect(emailClass).toContain('active');

    // Нажимаем на SMS
    await page.locator('button:has-text("SMS")').click();

    // Проверяем, что SMS теперь активен
    const smsButton = page.locator('button:has-text("SMS")').first();
    const smsClass = await smsButton.getAttribute('class');
    expect(smsClass).toContain('active');
  });

  test('заполнение профиля - шаг 1', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Полная регистрация до верификации
    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', password);
    await page.fill('input[placeholder*="Подтвердите пароль"]', password);
    await page.click('button:has-text("Регистрация")');

    // Верификация
    await expect(page).toHaveURL(/.*verification/);
    await page.fill('input[placeholder*="цифр"]', '123456');
    await page.click('button:has-text("Проверить")');

    // На странице Profile Step 1
    await expect(page).toHaveURL(/.*profile/);

    // Заполняем профиль
    await page.fill('input[placeholder*="Имя"]', 'Ivan');
    await page.fill('input[placeholder*="Фамилия"]', 'Petrov');
    await page.fill('input[placeholder*="город"]', 'Moscow');
    await page.fill('textarea[placeholder*="описание"]', 'I love events!');

    // Нажимаем "Далее"
    await page.click('button:has-text("Далее")');

    // Должны перейти на ProfileStep2
    await expect(page).toHaveURL(/.*interests/);
    await expect(page.locator('text=100%')).toBeVisible();
  });

  test('пропуск первого шага профиля', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Полная регистрация до верификации
    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', password);
    await page.fill('input[placeholder*="Подтвердите пароль"]', password);
    await page.click('button:has-text("Регистрация")');

    // Верификация
    await expect(page).toHaveURL(/.*verification/);
    await page.fill('input[placeholder*="цифр"]', '123456');
    await page.click('button:has-text("Проверить")');

    // На странице Profile Step 1
    await expect(page).toHaveURL(/.*profile/);

    // Нажимаем "Пропустить"
    await page.click('button:has-text("Пропустить")');

    // Должны перейти на ProfileStep2
    await expect(page).toHaveURL(/.*interests/);
    await expect(page.locator('text=100%')).toBeVisible();
  });

  test('выбор интересов на шаге 2', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Полная регистрация + верификация + первый шаг профиля
    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', password);
    await page.fill('input[placeholder*="Подтвердите пароль"]', password);
    await page.click('button:has-text("Регистрация")');

    await expect(page).toHaveURL(/.*verification/);
    await page.fill('input[placeholder*="цифр"]', '123456');
    await page.click('button:has-text("Проверить")');

    await expect(page).toHaveURL(/.*profile/);
    await page.click('button:has-text("Пропустить")');

    // На странице ProfileStep2
    await expect(page).toHaveURL(/.*interests/);

    // Нажимаем на несколько интересов
    await page.click('button:has-text("Спорт")');
    await page.click('button:has-text("Музыка")');
    await page.click('button:has-text("Технологии")');

    // Проверяем счётчик выбранных
    await expect(page.locator('text=Выбрано: 3')).toBeVisible();

    // Кнопка "Готово" должна быть активна
    const submitButton = page.locator('button:has-text("Готово")');
    await expect(submitButton).toBeEnabled();
  });

  test('завершение регистрации', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Полная регистрация + верификация
    await page.fill('input[placeholder*="Email"]', email);
    await page.fill('input[placeholder*="пароль"]', password);
    await page.fill('input[placeholder*="Подтвердите пароль"]', password);
    await page.click('button:has-text("Регистрация")');

    await expect(page).toHaveURL(/.*verification/);
    await page.fill('input[placeholder*="цифр"]', '123456');
    await page.click('button:has-text("Проверить")');

    // Пропускаем первый шаг
    await expect(page).toHaveURL(/.*profile/);
    await page.click('button:has-text("Пропустить")');

    // Выбираем интересы
    await expect(page).toHaveURL(/.*interests/);
    await page.click('button:has-text("Спорт")');
    await page.click('button:has-text("Музыка")');

    // Нажимаем "Готово"
    await page.click('button:has-text("Готово")');

    // Должны войти в основное приложение
    await expect(page).toHaveURL(/^http:\/\/localhost:5174\/$|^http:\/\/localhost:5174$/);
    
    // Проверяем, что основное приложение загружено
    await expect(page.locator('text=Афиша|Discover|Subscribed')).toBeVisible({ timeout: 5000 });
  });
});
