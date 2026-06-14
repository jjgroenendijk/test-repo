import { test, expect } from '@playwright/test';

test.describe('Auto-refresh logs', () => {
  test('should automatically fetch logs when toggle is checked', async ({ page }) => {
    // Mock the job creation to have a running job
    await page.route('**/api/jobs', async (route, request) => {
      if (request.method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'test-auto-refresh-job-123',
              url: 'https://open.spotify.com/track/123',
              status: 'Running',
              created_at: new Date().toISOString(),
              error_log: null,
              files: 0,
              total_size: 0
            }
          ])
        });
      }
      return route.continue();
    });

    // We will respond with different logs depending on how many times it was called
    let logFetchCount = 0;
    await page.route('**/api/jobs/test-auto-refresh-job-123/log', async (route) => {
      logFetchCount++;
      const logMsg = logFetchCount === 1 ? 'Initial log content' : `Auto-refreshed log content ${logFetchCount}`;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ log: logMsg })
      });
    });

    await page.goto('/');

    const jobCard = page.locator('.job-card[data-job-id="test-auto-refresh-job-123"]');
    await expect(jobCard).toBeVisible();

    const viewLogsBtn = jobCard.locator('.view-logs-btn');
    await viewLogsBtn.click();

    const logsContainer = page.locator('#logs-container-test-auto-refresh-job-123');
    await expect(logsContainer).toBeVisible();

    const logsContent = logsContainer.locator('.job-logs-content');
    await expect(logsContent).toContainText('Initial log content');

    const autoRefreshToggle = logsContainer.locator('.auto-refresh-logs-toggle');
    // Check the toggle
    await autoRefreshToggle.check();
    await expect(autoRefreshToggle).toBeChecked();

    // Wait for the auto-refresh to occur (poll is every 2 seconds, wait up to 4s)
    await expect(logsContent).toContainText('Auto-refreshed log content', { timeout: 5000 });
  });
});
