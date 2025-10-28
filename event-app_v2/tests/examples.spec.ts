import { test, expect } from '@playwright/test';
import { 
  completeFullLogin, 
  completeFullRegistration,
  generateTestEmail,
  TEST_PASSWORD,
  logout 
} from './helpers';

/**
 * 🎓 Примеры написания тестов
 * Используйте этот файл как шаблон для создания новых тестов
 */

test.describe('Примеры тестов', () => {
  test.beforeEach(async ({ page }) => {
    // Запускается перед каждым тестом
    await page.goto('/');
  });

  // ============= ПРИМЕР 1: Простой тест =============
  test('пример 1: простая проверка видимости элемента', async ({ page }) => {
    // Проверяем, что на странице видно "Вход"
    await expect(page.locator('text=Вход')).toBeVisible();
  });

  // ============= ПРИМЕР 2: Заполнение формы =============
  test('пример 2: заполнение и отправка формы', async ({ page }) => {
    // Переходим на регистрацию
    await page.click('text=Создать аккаунт');

    // Заполняем поле email
    await page.fill('input[placeholder*="Email"]', 'test@example.com');

    // Заполняем поле пароля
    await page.fill('input[placeholder*="пароль"]', 'TestPassword123');

    // Заполняем подтверждение пароля
    await page.fill('input[placeholder*="Подтвердите пароль"]', 'TestPassword123');

    // Нажимаем кнопку
    await page.click('button:has-text("Регистрация")');

    // Проверяем результат
    await expect(page).toHaveURL(/.*verification/);
  });

  // ============= ПРИМЕР 3: Проверка ошибок =============
  test('пример 3: проверка сообщения об ошибке', async ({ page }) => {
    // Нажимаем на кнопку входа без заполнения полей
    const submitButton = page.locator('button:has-text("Вход")');

    // Проверяем, что кнопка отключена
    await expect(submitButton).toBeDisabled();

    // Или можно проверить текст ошибки
    const errorText = page.locator('text=required|обязательно');
    // await expect(errorText).toBeVisible();
  });

  // ============= ПРИМЕР 4: Использование вспомогательных функций =============
  test('пример 4: полная регистрация с helpers', async ({ page }) => {
    // Генерируем уникальный email
    const email = generateTestEmail();

    // Используем вспомогательную функцию для полной регистрации
    await completeFullRegistration(page, email, TEST_PASSWORD);

    // После регистрации должны быть в основном приложении
    await expect(page.locator('text=Афиша')).toBeVisible();
  });

  // ============= ПРИМЕР 5: Работа с атрибутами =============
  test('пример 5: проверка атрибутов элементов', async ({ page }) => {
    // Переходим на регистрацию
    await page.click('text=Создать аккаунт');

    // Находим кнопку регистрации
    const registerButton = page.locator('button:has-text("Регистрация")');

    // Проверяем, что она отключена (т.к. форма не заполнена)
    const isDisabled = await registerButton.isDisabled();
    expect(isDisabled).toBe(true);

    // Проверяем класс элемента
    const buttonClass = await registerButton.getAttribute('class');
    expect(buttonClass).toBeTruthy();

    // Проверяем aria-label
    const emailInput = page.locator('input[placeholder*="Email"]');
    const ariaLabel = await emailInput.getAttribute('aria-label');
    // expect(ariaLabel).toContain('Email');
  });

  // ============= ПРИМЕР 6: Работа с SessionStorage =============
  test('пример 6: проверка sessionStorage', async ({ page }) => {
    // Делаем полный вход
    await completeFullLogin(page, 'admin@example.com', 'admin123');

    // Проверяем наличие token в sessionStorage
    const token = await page.evaluate(() => {
      return sessionStorage.getItem('authToken');
    });

    expect(token).toBeTruthy();
    expect(token).toContain('Bearer'); // Если используется Bearer token
  });

  // ============= ПРИМЕР 7: Проверка URL =============
  test('пример 7: проверка навигации между страницами', async ({ page }) => {
    // Переходим на регистрацию
    await page.click('text=Создать аккаунт');

    // Проверяем URL
    await expect(page).toHaveURL(/.*register/);

    // Переходим обратно на вход
    await page.click('text=Уже есть аккаунт?');

    // Проверяем новый URL
    await expect(page).toHaveURL(/.*login/);
  });

  // ============= ПРИМЕР 8: Работа с множеством элементов =============
  test('пример 8: работа с несколькими элементами', async ({ page }) => {
    // Полный вход
    await completeFullLogin(page, 'admin@example.com', 'admin123');

    // Находим все карточки событий
    const cards = page.locator('[class*="EventCard"]');

    // Получаем количество карточек
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Проверяем, что каждая карточка видима
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      await expect(card).toBeVisible();
    }
  });

  // ============= ПРИМЕР 9: Скриншоты для debug'а =============
  test('пример 9: снятие скриншота', async ({ page }) => {
    await page.click('text=Создать аккаунт');

    // Снимаем скриншот (автоматически сохраняется при ошибке)
    await page.screenshot({ path: 'example-screenshot.png' });

    // Или весь экран в зависимости от конфига
    await expect(page.locator('text=Регистрация')).toBeVisible();
  });

  // ============= ПРИМЕР 10: Работа с таймаутами =============
  test('пример 10: ожидание с таймаутом', async ({ page }) => {
    // Стандартный таймаут 30 секунд
    await expect(page.locator('text=Вход')).toBeVisible();

    // Пользовательский таймаут
    await expect(page.locator('text=Неприметный элемент')).toBeVisible({ 
      timeout: 5000 // 5 секунд
    });
  });

  // ============= ПРИМЕР 11: Клавиатура и события =============
  test('пример 11: работа с клавиатурой', async ({ page }) => {
    // Переходим на регистрацию
    await page.click('text=Создать аккаунт');

    // Находим поле пароля
    const passwordInput = page.locator('input[placeholder*="пароль"]').first();

    // Вводим текст
    await passwordInput.fill('TestPassword123');

    // Нажимаем Enter
    await passwordInput.press('Enter');

    // Или вводим текст по символам
    await passwordInput.clear();
    await passwordInput.type('TestPassword', { delay: 50 }); // с задержкой 50ms

    // Комбинации клавиш
    await page.keyboard.press('Control+A'); // Ctrl+A
    await page.keyboard.press('Control+C'); // Ctrl+C
  });

  // ============= ПРИМЕР 12: Условные проверки =============
  test('пример 12: условные проверки', async ({ page }) => {
    // Проверяем, видим ли мы кнопку входа
    const loginButton = page.locator('button:has-text("Вход")');
    const isVisible = await loginButton.isVisible();

    if (isVisible) {
      console.log('Кнопка входа видима');
      await expect(loginButton).toBeVisible();
    } else {
      console.log('Кнопка входа невидима');
    }

    // Проверяем, есть ли элемент на странице
    const hasElement = await page.locator('text=Какой-то текст').count() > 0;
    expect(hasElement).toBe(false);
  });

  // ============= ПРИМЕР 13: Логирование и отладка =============
  test('пример 13: логирование для отладки', async ({ page }) => {
    // Логируем текущий URL
    console.log('Current URL:', page.url());

    // Логируем содержимое страницы
    const pageContent = await page.content();
    console.log('Page has', pageContent.length, 'characters');

    // Логируем результат проверки
    const isVis = await page.locator('text=Вход').isVisible();
    console.log('Login button visible:', isVis);

    expect(isVis).toBe(true);
  });

  // ============= ПРИМЕР 14: Работа с hover и focus =============
  test('пример 14: hover и focus события', async ({ page }) => {
    // Переходим на вход
    await page.click('text=Создать аккаунт');

    // Находим кнопку переключения видимости пароля
    const toggleButton = page.locator('button').filter({ 
      has: page.locator('[class*="eye"]') 
    }).first();

    // Наводим на кнопку (hover)
    await toggleButton.hover();

    // Проверяем видимость
    await expect(toggleButton).toBeVisible();

    // Фокусируемся на кнопке
    await toggleButton.focus();

    // Нажимаем кнопку
    await toggleButton.click();
  });

  // ============= ПРИМЕР 15: Переиспользование функций =============
  test('пример 15: тестирование полного цикла', async ({ page }) => {
    // Полная регистрация
    const email = generateTestEmail();
    await completeFullRegistration(page, email, TEST_PASSWORD);

    // Проверяем, что в приложении
    await expect(page.locator('text=Афиша')).toBeVisible();

    // Выходим
    await logout(page);

    // Проверяем, что на странице входа
    await expect(page.locator('text=Вход')).toBeVisible();

    // Входим с новым аккаунтом
    // await completeFullLogin(page, email, TEST_PASSWORD);
    // await expect(page.locator('text=Афиша')).toBeVisible();
  });
});

/**
 * 💡 Советы и трюки
 *
 * 1. Используйте page.goto('/') для перехода на главную
 * 2. Используйте text= локатор для поиска по видимому тексту
 * 3. Используйте placeholder* для поиска input по placeholder'у
 * 4. Используйте :has() в селекторах для сложных проверок
 * 5. Всегда проверяйте URL после навигации
 * 6. Используйте вспомогательные функции из helpers.ts
 * 7. Добавляйте таймауты для медленных операций
 * 8. Логируйте для отладки (console.log)
 * 9. Используйте page.waitForLoadState() для ожидания загрузки
 * 10. Снимайте скриншоты при ошибках для анализа
 */
