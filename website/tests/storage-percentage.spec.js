import { test, expect } from '@playwright/test';

test.describe('Storage Percentage Display', () => {
  test('should display storage percentage calculated correctly', async ({ page }) => {
    // Intercept the storage endpoint to return a mocked response
    await page.route('/api/system/storage', async (route) => {
      // Return 50% storage used
      const total = 1000000;
      const free = 500000;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total, free, used: total - free }),
      });
    });

    // Mock jobs endpoint to avoid errors
    await page.route('/api/jobs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Navigate to the app
    await page.goto('/');

    // Check that the storage usage text is updated
    await expect(page.locator('#storage-usage-text')).toContainText('488.3 KB free of 976.6 KB');

    // Check that the storage percentage text displays the correct percentage
    await expect(page.locator('#storage-percentage-text')).toBeVisible();
    await expect(page.locator('#storage-percentage-text')).toContainText('(50% used)');
  });

  test('should round storage percentage appropriately', async ({ page }) => {
    await page.route('/api/system/storage', async (route) => {
      // Total 100, Free 33 -> Used 67%
      const total = 1000;
      const free = 330;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total, free, used: total - free }),
      });
    });

    await page.route('/api/jobs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/');

    await expect(page.locator('#storage-percentage-text')).toBeVisible();
    await expect(page.locator('#storage-percentage-text')).toContainText('(67% used)');
  });
});
