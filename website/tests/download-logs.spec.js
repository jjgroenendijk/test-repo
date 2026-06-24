import { test, expect } from '@playwright/test';

test.describe('Download All Logs Button', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the /api/jobs GET request
    await page.route('/api/jobs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-job-123',
            url: 'https://open.spotify.com/track/123',
            status: 'Completed',
            created_at: new Date().toISOString()
          }
        ])
      });
    });

    // Mock stats request
    await page.route('/api/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_jobs: 0,
          total_files: 0,
          success_rate: 0
        })
      });
    });

    // Mock storage request
    await page.route('/api/system/storage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total: 10000000000,
          used: 2000000000,
          free: 8000000000
        })
      });
    });
  });

  test('should display the Download all logs button with correct href', async ({ page }) => {
    await page.goto('/');

    const downloadLogsBtn = page.locator('#download-all-logs-btn');

    // Verify visibility
    await expect(downloadLogsBtn).toBeVisible();

    // Verify text content
    await expect(downloadLogsBtn).toHaveText('Download all logs');

    // Verify href attribute
    await expect(downloadLogsBtn).toHaveAttribute('href', '/api/history/logs/download');

    // Verify download attribute
    await expect(downloadLogsBtn).toHaveAttribute('download', '');
  });
});
