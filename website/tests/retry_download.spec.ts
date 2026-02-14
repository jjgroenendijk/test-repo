import { test, expect } from '@playwright/test';

test('retry button prefills the form', async ({ page }) => {
  // Mock the history response
  await page.route('/api/downloads', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          records: [
            {
              id: '1',
              createdAt: new Date().toISOString(),
              url: 'https://example.com/video',
              mode: 'audio',
              includePlaylist: true,
              status: 'failed',
              files: [],
              logTail: ''
            }
          ],
          storageUsage: 0
        }
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');

  // Wait for history to load
  const retryButton = page.getByRole('button', { name: 'Retry' });
  await expect(retryButton).toBeVisible();

  // Click retry
  await retryButton.click();

  // Check form values
  await expect(page.locator('input[name="video-url"]')).toHaveValue('https://example.com/video');
  await expect(page.locator('select#mode')).toHaveValue('audio');
  await expect(page.locator('input#playlist')).toBeChecked();
});
