import { test, expect } from '@playwright/test';

test('should clear history', async ({ page }) => {
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

  // Mock API behavior
  await page.route('**/api/downloads', async route => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        json: {
          records: historyRecords,
          storageUsage: 1024 // Mock some usage
        }
      });
    } else if (method === 'DELETE') {
        historyRecords = []; // Clear server state
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
  // This implicitly verifies that loadHistory() was called and returned empty list
  await expect(page.getByText('No downloads yet.')).toBeVisible();
});
