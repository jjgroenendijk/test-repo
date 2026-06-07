import { test, expect } from '@playwright/test';

test.describe('Delete All Jobs', () => {
  test('should confirm and successfully delete all jobs', async ({ page }) => {
    // Intercept initial jobs fetch
    await page.route('**/api/jobs*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'job-1',
              url: 'https://open.spotify.com/track/1',
              status: 'Completed',
              created_at: new Date().toISOString(),
            },
            {
              id: 'job-2',
              url: 'https://open.spotify.com/track/2',
              status: 'Running',
              created_at: new Date().toISOString(),
            }
          ])
        });
      } else if (route.request().method() === 'DELETE') {
        // Mock the DELETE /api/jobs endpoint
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', deleted: 2 })
        });
      } else {
        await route.continue();
      }
    });

    // Mock stats
    await page.route('**/api/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_jobs: 2, successful_jobs: 1, failed_jobs: 0, total_files_downloaded: 1 })
      });
    });

    await page.goto('/');

    // Wait for the button to appear
    const deleteAllJobsBtn = page.locator('#delete-all-jobs-btn');
    await expect(deleteAllJobsBtn).toBeVisible();

    // Verify initial jobs are rendered
    await expect(page.locator('.job-card')).toHaveCount(2);

    // Prepare to handle the dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Are you sure you want to delete all jobs, including running ones? This cannot be undone.');
      await dialog.accept();
    });

    // Setup network listener to catch the re-fetch
    const requestPromise = page.waitForRequest(request =>
      request.url().includes('/api/jobs') && request.method() === 'GET'
    );

    // Intercept the subsequent jobs fetch after deletion to return empty list
    await page.unroute('**/api/jobs*');
    await page.route('**/api/jobs*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', deleted: 2 })
        });
      } else {
        await route.continue();
      }
    });

    // Click the delete all jobs button
    await deleteAllJobsBtn.click();

    // Wait for the re-fetch request
    await requestPromise;

    // Verify the UI updates to show no jobs
    await expect(page.locator('.job-card')).toHaveCount(0);
  });
});
