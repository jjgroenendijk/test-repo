import { test, expect } from '@playwright/test';

test.describe('System Info Display', () => {
  test('should display version and platform in the footer', async ({ page }) => {
    // Intercept the /api/system/info endpoint
    await page.route('**/api/system/info', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ version: "1.2.3", platform: "linux-x64" }),
      });
    });

    // Mock jobs and storage endpoints to avoid errors or timeouts
    await page.route('**/api/jobs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/system/storage*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 1000, free: 500, used: 500 }),
      });
    });

    // Navigate to the root URL
    await page.goto('/');

    // Check that the system-info-container element is visible
    const systemInfo = page.locator('#system-info-container');
    await expect(systemInfo).toBeVisible();

    // Check that the text contains the mocked version and platform
    await expect(systemInfo).toContainText('SpotiFLAC v1.2.3 (linux-x64)');
  });
});
