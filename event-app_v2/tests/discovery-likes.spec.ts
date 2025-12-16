import { test, expect } from '@playwright/test';

test('Discovery: session likes tab renders items', async ({ page }) => {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60;

  await page.addInitScript(({ exp }) => {
    const base64url = (obj: any) => {
      const json = JSON.stringify(obj);
      const b64 = btoa(unescape(encodeURIComponent(json)));
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    };

    const header = { alg: 'none', typ: 'JWT' };
    const payload = {
      userId: 'u1',
      email: 't@t.t',
      iat: Math.floor(Date.now() / 1000),
      exp,
    };

    const token = `${base64url(header)}.${base64url(payload)}.`;
    sessionStorage.setItem('_auth_token', token);
  }, { exp });

  await page.route('**/v1/api/discovery/likes', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          likedAt: new Date().toISOString(),
          id: 'evt-1',
          title: 'Тестовое событие',
          description: 'Описание',
          slot: {
            start: new Date(Date.now() + 3600_000).toISOString(),
            end: new Date(Date.now() + 7200_000).toISOString(),
          },
          metadata: {
            type: 'Музыка',
            place: 'Парк',
          },
        },
      ]),
    });
  });

  await page.goto('/');

  // Switch to "Лайки" in Discovery toggle
  await page.getByRole('button', { name: 'Лайки' }).click();

  await expect(page.getByText('Лайки за сессию')).toBeVisible();
  await expect(page.getByText('Тестовое событие')).toBeVisible();
});
