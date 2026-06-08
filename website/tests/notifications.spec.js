import { test, expect } from '@playwright/test';

test.describe('Global Notifications', () => {
  test('should show notification when URL is copied', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Intercept stats
    await page.route('**/api/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_jobs: 1, total_files: 10, success_rate: 100 }),
      });
    });

    // Intercept storage
    await page.route('**/api/system/storage*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ free: 50000000000, total: 100000000000 }),
        });
      });

    // Intercept jobs list with a completed job
    await page.route('**/api/jobs*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'test-job-123',
              url: 'https://open.spotify.com/track/123',
              status: 'Completed',
              created_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              files: 10,
              error_log: null
            }
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Go to the app
    await page.goto('/');

    // Wait for the job list to load and the job card to appear
    await expect(page.locator('.job-card')).toBeVisible();

    // Click the "Copy" URL button
    const copyUrlBtn = page.locator('.copy-url-btn').first();
    await expect(copyUrlBtn).toBeVisible();
    await copyUrlBtn.click();

    // Verify the notification appears
    const notification = page.locator('.notification.success');
    await expect(notification).toBeVisible();
    await expect(notification).toHaveText('Copied URL!');

    // Take a screenshot of the notification
    await page.screenshot({ path: 'notification-success.png' });
  });
});
