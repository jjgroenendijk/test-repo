import { test, expect } from '@playwright/test';

test('should show download links and allow file download', async ({ page }) => {
  // Mock history
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
    } else {
        await route.continue();
    }
  });

  await page.goto('/');

  const codeElement = page.getByText('video.mp4');
  const link = codeElement.locator('xpath=..');

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/api/files/video.mp4');

  const downloadAttr = await link.getAttribute('download');
  expect(downloadAttr).not.toBeNull();
});

test('should sanitize directory traversal by looking inside downloads', async ({ request }) => {
  const response = await request.get('/api/files/..%2fsecret.txt');
  expect(response.status()).toBe(404);
});

test('should block absolute path attempt', async ({ request }) => {
    // Note: Next.js might clean up double slashes, but let's try
  const response = await request.get('/api/files//etc/passwd');
  // It might be 404 if Next.js routing doesn't match, or 403 if it hits our handler
  expect([403, 404]).toContain(response.status());
});

test('should return 404 for non-existent file', async ({ request }) => {
  const response = await request.get('/api/files/nonexistent.mp4');
  expect(response.status()).toBe(404);
});
