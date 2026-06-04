import { test, expect } from '@playwright/test';

test.describe('Copy Logs Feature', () => {
  test('should copy log content to clipboard and update button text', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Mock API endpoints
    await page.route('/api/jobs', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: [
            {
              id: 'test-log-job',
              url: 'https://open.spotify.com/track/test',
              status: 'Completed',
              created_at: new Date().toISOString()
            }
          ]
        });
      } else {
        await route.continue();
      }
    });

    await page.route('/api/stats', async route => {
      await route.fulfill({ json: { total_jobs: 1, total_files: 1, success_rate: 100 } });
    });

    await page.route('/api/system/storage', async route => {
      await route.fulfill({ json: { total: 1000, used: 100, free: 900 } });
    });

    await page.route('/api/jobs/test-log-job/log', async route => {
      await route.fulfill({
        json: { log: 'Test log content' }
      });
    });

    await page.route('/api/jobs/test-log-job/progress', async route => {
        await route.fulfill({ json: null });
    });

    // Navigate to the app
    await page.goto('/');

    // Ensure the job is rendered
    const jobCard = page.locator('.job-card[data-job-id="test-log-job"]');
    await expect(jobCard).toBeVisible();

    // Click "View Logs"
    const viewLogsBtn = jobCard.locator('.view-logs-btn');
    await viewLogsBtn.click();

    // Wait for the logs container to be visible
    const logsContainer = jobCard.locator('.job-logs-container');
    await expect(logsContainer).toBeVisible();

    // Ensure the log content is loaded
    const logsContent = jobCard.locator('.job-logs-content');
    await expect(logsContent).toHaveText('Test log content');

    // Click "Copy Logs"
    const copyLogsBtn = jobCard.locator('.copy-logs-btn');
    await expect(copyLogsBtn).toBeVisible();
    await copyLogsBtn.click();

    // Verify the button text changed to "Copied!"
    await expect(copyLogsBtn).toHaveText('Copied!');

    // Verify the clipboard content using an evaluation in the page context
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    expect(clipboardText).toBe('Test log content');
  });
});
