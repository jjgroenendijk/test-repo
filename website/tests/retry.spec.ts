import { test, expect } from '@playwright/test';

test('retry button populates the form', async ({ page }) => {
  // Mock the history response with one item
  await page.route('/api/downloads', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          records: [
            {
              id: 'test-id',
              createdAt: new Date().toISOString(),
              url: 'https://www.youtube.com/watch?v=retrytest',
              mode: 'audio',
              includePlaylist: true,
              status: 'completed',
              files: [],
              logTail: '',
            },
          ],
          storageUsage: 0,
        },
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');

  // Verify the history item is present
  const historyList = page.getByTestId('history-list');
  await expect(historyList).toBeVisible();

  // Find the retry button and click it
  const retryButton = page.getByTitle('Retry this download');
  await expect(retryButton).toBeVisible();
  await retryButton.click();

  // Verify the form fields are populated
  await expect(page.locator('input[name="video-url"]')).toHaveValue('https://www.youtube.com/watch?v=retrytest');
  await expect(page.locator('select#mode')).toHaveValue('audio');
  await expect(page.locator('input#playlist')).toBeChecked();
});
