import { test, expect } from '@playwright/test';

test('job card displays total size of files for completed jobs', async ({ page }) => {
  // Mock the history API response with a job containing total_size
  await page.route('**/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: [
          {
            id: 'test-job-with-size',
            url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
            status: 'Completed',
            created_at: new Date().toISOString(),
            files: 2,
            total_size: 5242880, // 5 MB
            error_log: null
          }
        ]
      });
    } else {
      await route.continue();
    }
  });

  // Mock stats to prevent background polling from interfering
  await page.route('**/api/stats', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { total_jobs: 1, total_files: 2, success_rate: 100 } });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');

  // Wait for the job card to appear
  const jobCard = page.locator('.job-card[data-job-id="test-job-with-size"]');
  await jobCard.waitFor({ state: 'visible' });

  // The meta section contains the status and the files text
  // filesText logic: 2 files -> "2 files (5 MB)"
  // Format is "2 files (5 MB)"
  const metaSection = jobCard.locator('.job-meta');

  // Find the span containing the files text
  await expect(metaSection).toContainText('2 files (5 MB)');
});
