import { test, expect } from '@playwright/test';

test('Queue form can be submitted with Ctrl+Enter or Meta+Enter', async ({ page }) => {
  // Mock API for /api/stats and /api/jobs to prevent background polling from interfering
  await page.route('**/api/stats', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ total_jobs: 0, total_files: 0, success_rate: 0 }),
  }));

  await page.route('**/api/jobs', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]),
  }));

  await page.goto('/');

  const trackUrl = 'https://open.spotify.com/track/1234567890';
  const textarea = page.locator('#spotify-url');

  await textarea.fill(trackUrl);

  // Intercept the POST request to create a job
  let createJobCalled = false;
  await page.route('**/api/jobs', async route => {
    if (route.request().method() === 'POST') {
      createJobCalled = true;
      const postData = JSON.parse(route.request().postData());
      expect(postData.url).toBe(trackUrl);

      // Respond with a mock job
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-job-id',
          url: trackUrl,
          status: 'Queued',
          created_at: new Date().toISOString(),
          error_log: null,
          files: 0
        })
      });
    } else {
      await route.continue();
    }
  });

  // Mock fetching jobs again to return the new job
  await page.route('**/api/jobs', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-job-id',
          url: trackUrl,
          status: 'Queued',
          created_at: new Date().toISOString(),
          error_log: null,
          files: 0
        }])
      });
    } else {
        // Fallback for POST if already handled above
        await route.fallback();
    }
  });


  // Wait for the route to be hit when we press Control+Enter
  const requestPromise = page.waitForRequest(request =>
    request.url().includes('/api/jobs') && request.method() === 'POST'
  );

  // Press Control+Enter inside the textarea
  await textarea.press('Control+Enter');

  await requestPromise;

  // Verify the POST request was hit
  expect(createJobCalled).toBe(true);

  // Verify the textarea input was cleared
  await expect(textarea).toHaveValue('');

  // The UI should show the new job card
  await expect(page.locator('.job-card[data-job-id="test-job-id"]')).toBeVisible();

  // Take a screenshot of the successful addition
  await page.screenshot({ path: 'ctrl-enter-shortcut-test.png', fullPage: true });
});
