import { test, expect } from '@playwright/test';

test('Download job form submits with URL and quality setting', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');

  // Mock the jobs endpoint for submission
  let submittedPayload = null;
  let postCalls = 0;
  await page.route('/api/jobs', async (route, request) => {
    if (request.method() === 'POST') {
      postCalls++;
      submittedPayload = request.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-job-123',
          url: submittedPayload.url,
          status: 'Queued',
          created_at: new Date().toISOString(),
          error_log: null,
          files: 0,
          total_size: 0
        })
      });
    } else if (request.method() === 'GET') {
       await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    } else {
      await route.continue();
    }
  });

  // Mock health endpoint
  await page.route('/api/health', async route => {
    await route.fulfill({ status: 200, body: '{"status": "ok"}' });
  });

  // Mock storage stats
  await page.route('/api/system/storage', async route => {
    await route.fulfill({ status: 200, body: '{"total": 1000, "free": 500, "used": 500}' });
  });

  // Mock job stats
  await page.route('/api/stats', async route => {
    await route.fulfill({ status: 200, body: '{"total_jobs": 0, "total_files": 0, "success_rate": 100}' });
  });

  // Fill in the URL
  const testUrl = 'https://open.spotify.com/track/123';
  await page.fill('#spotify-url', testUrl);

  // Select a quality setting
  await page.selectOption('#service-select', 'qobuz');
  await page.selectOption('#quality-select', 'LOSSLESS');

  // Verify the payload includes the quality
  // Add a small wait to ensure request is dispatched
  const responsePromise = page.waitForResponse(response => response.url().includes('/api/jobs') && response.request().method() === 'POST');

  // Submit the form
  await page.click('button[type="submit"]');

  await responsePromise;
  expect(submittedPayload).not.toBeNull();
  expect(submittedPayload.url).toBe(testUrl);
  expect(submittedPayload.quality).toBe('LOSSLESS');
  expect(submittedPayload.service).toBe('qobuz');
  expect(postCalls).toBe(1);

  // Verify feedback message
  const feedback = page.locator('#queue-feedback');
  await expect(feedback).toContainText('Successfully queued 1 job');
});
