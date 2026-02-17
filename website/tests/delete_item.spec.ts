import { test, expect } from '@playwright/test';

test('should delete individual history item', async ({ page }) => {
  let historyRecords = [
    {
      id: '1',
      createdAt: new Date().toISOString(),
      url: 'https://youtube.com/watch?v=123',
      mode: 'video' as const,
      includePlaylist: false,
      status: 'completed' as const,
      files: ['video.mp4'],
      logTail: 'done'
    },
    {
      id: '2',
      createdAt: new Date().toISOString(),
      url: 'https://youtube.com/watch?v=456',
      mode: 'audio' as const,
      includePlaylist: false,
      status: 'failed' as const,
      files: [],
      logTail: 'error'
    }
  ];

  // Mock API behavior
  await page.route('**/api/downloads', async route => {
    const method = route.request().method();
    if (method === 'GET') {
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

  // Mock DELETE individual item
  await page.route('**/api/downloads/*', async route => {
      const method = route.request().method();
      if (method === 'DELETE') {
          const url = route.request().url();
          const id = url.split('/').pop();
          historyRecords = historyRecords.filter(r => r.id !== id);
          await route.fulfill({ json: { success: true } });
      } else {
          await route.continue();
      }
  });

  await page.goto('/');

  // Verify history items are present
  await expect(page.getByText('video.mp4')).toBeVisible();
  await expect(page.locator('.status-pill').filter({ hasText: 'failed' })).toBeVisible();

  // Setup dialog handler
  page.on('dialog', dialog => dialog.accept());

  // Click Delete on the first item (id: 1)
  const firstItem = page.locator('.history-item').filter({ hasText: 'video.mp4' });
  await firstItem.getByRole('button', { name: 'Delete' }).click();

  // Verify first item is gone
  await expect(page.getByText('video.mp4')).not.toBeVisible();

  // Verify second item is still there
  await expect(page.locator('.history-item').filter({ hasText: 'failed' })).toBeVisible();
});
