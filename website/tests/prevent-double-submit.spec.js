import { test, expect } from '@playwright/test';

test('Queue form prevents double submission on rapid Enter presses', async ({ page }) => {
  test.setTimeout(15000);

  // Mock initial requests
  await page.route('**/api/system/storage', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ free: 500000000, total: 1000000000 }),
  }));

  await page.route('**/api/stats', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ total_jobs: 0, total_files: 0, success_rate: 0 }),
  }));

  let postCount = 0;
  // Intercept the POST request first so it takes precedence over the GET handler
  await page.route('**/api/jobs', async route => {
    if (route.request().method() === 'POST') {
      postCount++;
      // Do not fulfill or abort to simulate hanging response
    } else {
      await route.fallback();
    }
  });

  // Then intercept GET
  await page.route('**/api/jobs', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');

  const requestPromise = page.waitForRequest(request => request.url().endsWith('/api/jobs') && request.method() === 'POST');

  const textarea = page.locator('#spotify-url');
  await textarea.fill('https://open.spotify.com/track/1234567890');

  // Press Control+Enter twice rapidly
  await textarea.press('Control+Enter');

  // Wait for the first POST request to be fired before pressing again
  // so we know the handler is attached and blocked
  await requestPromise;

  await textarea.press('Control+Enter');

  // Assert that only one POST request was made
  await expect.poll(() => postCount).toBe(1);
});
