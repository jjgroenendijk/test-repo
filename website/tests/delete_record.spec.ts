import { test, expect } from '@playwright/test';

test('should delete individual record', async ({ page }) => {
  let historyRecords = [
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
  ];

  // Mock API behavior for GET
  await page.route('**/api/downloads', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          records: historyRecords,
          storageUsage: 1024
        }
      });
    } else {
        await route.continue();
    }
  });

  // Mock API behavior for DELETE individual record
  await page.route('**/api/downloads/1', async route => {
      if (route.request().method() === 'DELETE') {
          historyRecords = []; // Update mock state
          await route.fulfill({ json: { success: true } });
      } else {
          await route.continue();
      }
  });

  await page.goto('/');

  // Verify history item is present
  const item = page.locator('.history-item').first();
  await expect(item).toBeVisible();
  await expect(item.getByText('video.mp4')).toBeVisible();

  // Setup dialog handler
  page.on('dialog', dialog => dialog.accept());

  // Click Delete button
  await item.getByRole('button', { name: 'Delete' }).click();

  // Verify history item is removed
  // The UI updates optimistically AND reloads history.
  // We expect "No downloads yet." because the list is empty.
  await expect(page.getByText('No downloads yet.')).toBeVisible();
});
