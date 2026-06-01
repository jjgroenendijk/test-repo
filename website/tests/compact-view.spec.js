import { test, expect } from '@playwright/test';

test.describe('Compact View Toggle', () => {
  test('should toggle compact view class and hide track covers', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Ensure the toggle is visible
    const compactToggle = page.locator('#compact-view-toggle');
    await expect(compactToggle).toBeVisible();

    // Initially, it should not have the compact class
    const jobList = page.locator('#job-list');
    await expect(jobList).not.toHaveClass(/compact/);

    // Create a mock job so we have a track cover to check
    // We can do this by mocking the API response or creating a job if the backend is running.
    // For simplicity, we'll intercept the API to return a mock job.
    await page.route('/api/jobs', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'mock-job-1',
            url: 'https://open.spotify.com/track/mock1',
            status: 'Completed',
            created_at: new Date().toISOString()
          }
        ])
      });
    });

    // Reload to apply the mock
    await page.goto('/');

    // Check that the track cover is visible initially
    const trackCover = page.locator('.track-cover').first();
    await expect(trackCover).toBeVisible();

    // Check the compact view toggle
    await compactToggle.check();

    // The job list should now have the compact class
    await expect(jobList).toHaveClass(/compact/);

    // The track cover should be hidden
    await expect(trackCover).toBeHidden();

    // Take a screenshot to verify visually
    await page.screenshot({ path: 'compact-view-test.png' });

    // Uncheck to verify it toggles back
    await compactToggle.uncheck();
    await expect(jobList).not.toHaveClass(/compact/);
    await expect(trackCover).toBeVisible();
  });
});
