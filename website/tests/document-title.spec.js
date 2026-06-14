import { test, expect } from '@playwright/test';

test.describe('Dynamic Document Title', () => {
  test('should show "(N) SpotiFLAC" when there are active jobs', async ({ page }) => {
    // Intercept the /api/jobs request to return 2 active jobs
    await page.route('/api/jobs', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-1',
            url: 'https://open.spotify.com/track/1',
            status: 'Running',
            created_at: new Date().toISOString()
          },
          {
            id: 'job-2',
            url: 'https://open.spotify.com/track/2',
            status: 'Queued',
            created_at: new Date().toISOString()
          },
          {
            id: 'job-3',
            url: 'https://open.spotify.com/track/3',
            status: 'Completed',
            created_at: new Date().toISOString()
          }
        ])
      });
    });

    await page.goto('/');

    // Wait for the jobs to load and title to update
    await expect(page).toHaveTitle('(2) SpotiFLAC');
  });

  test('should show "SpotiFLAC" when there are no active jobs', async ({ page }) => {
    // Intercept the /api/jobs request to return 0 active jobs
    await page.route('/api/jobs', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-1',
            url: 'https://open.spotify.com/track/1',
            status: 'Completed',
            created_at: new Date().toISOString()
          },
          {
            id: 'job-2',
            url: 'https://open.spotify.com/track/2',
            status: 'Failed',
            created_at: new Date().toISOString()
          }
        ])
      });
    });

    await page.goto('/');

    // Wait for the jobs to load and title to update
    await expect(page).toHaveTitle('SpotiFLAC');
  });
});
