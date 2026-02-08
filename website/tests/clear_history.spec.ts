import { test, expect } from '@playwright/test';

test('should clear history', async ({ page }) => {
  // Mock initial history
  await page.route('**/api/downloads', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          records: [
            {
              id: '1',
              createdAt: new Date().toISOString(),
              url: 'https://youtube.com/watch?v=123',
              mode: 'video',
              includePlaylist: false,
              status: 'completed',
              files: ['video.mp4'],
              logTail: 'done'
            }
          ]
        }
      });
    } else if (route.request().method() === 'DELETE') {
        await route.fulfill({ json: { success: true } });
    } else {
        await route.continue();
    }
  });

  await page.goto('/');

  // Verify history item is present
  await expect(page.getByText('video.mp4')).toBeVisible();

  // Setup dialog handler
  page.on('dialog', dialog => dialog.accept());

  // Click Clear History
  await page.getByText('Clear History').click();

  // Verify history is cleared
  await expect(page.getByText('No downloads yet.')).toBeVisible();
});
