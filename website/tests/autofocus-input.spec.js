import { test, expect } from '@playwright/test';

test.describe('Autofocus input', () => {
  test('spotify url input is focused on load', async ({ page }) => {
    // Mock API requests
    await page.route('**/api/jobs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('**/api/system/storage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ free: 500000000, total: 1000000000 })
      });
    });

    await page.goto('/');

    const spotifyUrlInput = page.locator('#spotify-url');
    await expect(spotifyUrlInput).toBeFocused();
  });
});
