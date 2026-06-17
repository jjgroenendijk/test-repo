import { test, expect } from '@playwright/test';

test.describe('Export CSV Link', () => {
  test('should display Export CSV link with correct href', async ({ page }) => {
    // Mock API requests
    await page.route('**/api/jobs*', async route => await route.fulfill({ json: [] }));
    await page.route('**/api/health', async route => await route.fulfill({ status: 200 }));
    await page.route('**/api/stats', async route => await route.fulfill({ json: { total_jobs: 0, total_files: 0, success_rate: 0 } }));
    await page.route('**/api/system/storage', async route => await route.fulfill({ json: { total: 1000, used: 500, free: 500 } }));
    await page.route('**/api/system/info', async route => await route.fulfill({ json: { version: "1.0", platform: "linux" } }));

    await page.goto('/');

    const exportCsvLink = page.locator('#export-history-csv-btn');
    await expect(exportCsvLink).toBeVisible();
    await expect(exportCsvLink).toHaveAttribute('href', '/api/history/export/csv');
    await expect(exportCsvLink).toHaveAttribute('download', '');
    await expect(exportCsvLink).toHaveText('Export CSV');
  });
});
