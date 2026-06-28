import { test, expect } from '@playwright/test';

test.describe('Search Shortcut Cmd+K / Ctrl+K', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend requests
    await page.route('**/api/jobs', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    }));
    await page.route('**/api/system/storage', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ total: 1000, used: 500, free: 500 })
    }));
    await page.route('**/api/system/info', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ version: '1.0', platform: 'test' })
    }));
    await page.route('**/api/stats', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ total_jobs: 0, total_files: 0, success_rate: 0 })
    }));
    await page.route('**/api/health', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' })
    }));

    await page.goto('http://127.0.0.1:3000');
  });

  test('Focuses search input when Control+K is pressed', async ({ page }) => {
    // Make sure the input is not initially focused
    await expect(page.locator('#job-search-input')).not.toBeFocused();

    // Press Ctrl+K
    await page.keyboard.press('Control+k');

    // The input should now be focused
    await expect(page.locator('#job-search-input')).toBeFocused();
  });

  test('Focuses search input when Meta+K is pressed', async ({ page }) => {
    // Make sure the input is not initially focused
    await expect(page.locator('#job-search-input')).not.toBeFocused();

    // Press Meta+K (Cmd+K)
    await page.keyboard.press('Meta+k');

    // The input should now be focused
    await expect(page.locator('#job-search-input')).toBeFocused();
  });
});
