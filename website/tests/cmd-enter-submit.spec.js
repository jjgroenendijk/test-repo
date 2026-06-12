import { test, expect } from '@playwright/test';

test.describe('Keyboard submission', () => {
  test('submits form on Meta+Enter (Cmd+Enter)', async ({ page }) => {
    let jobQueued = false;
    await page.route('**/api/jobs*', async (route, request) => {
      if (request.method() === 'POST' && request.url().endsWith('/api/jobs')) {
        jobQueued = true;
        const body = JSON.parse(request.postData() || '{}');
        expect(body.url).toBe('https://open.spotify.com/track/123');
        await route.fulfill({
          status: 201,
          json: { message: "Job queued successfully", job_id: "test-job" }
        });
        return;
      }
      if (request.method() === 'GET' && request.url().endsWith('/api/jobs')) {
        await route.fulfill({ status: 200, json: [] });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/stats', async route => {
      await route.fulfill({ status: 200, json: { total_jobs: 0, total_files: 0, success_rate: 0 } });
    });

    await page.route('**/api/system/storage', async route => {
      await route.fulfill({ status: 200, json: { total: 100, used: 10, free: 90, percentage: 10 } });
    });

    await page.goto('/');

    const textarea = page.locator('#spotify-url');
    await textarea.fill('https://open.spotify.com/track/123');

    // Press Meta+Enter
    await textarea.press('Meta+Enter');

    // Wait a short moment to ensure request is intercepted
    await page.waitForTimeout(500);

    expect(jobQueued).toBe(true);

    const feedback = page.locator('#queue-feedback');
    await expect(feedback).toHaveText('Successfully queued 1 job.');
    await expect(feedback).toHaveAttribute('data-state', 'success');
  });

  test('submits form on Control+Enter (Ctrl+Enter)', async ({ page }) => {
    let jobQueued = false;
    await page.route('**/api/jobs*', async (route, request) => {
      if (request.method() === 'POST' && request.url().endsWith('/api/jobs')) {
        jobQueued = true;
        const body = JSON.parse(request.postData() || '{}');
        expect(body.url).toBe('https://open.spotify.com/album/456');
        await route.fulfill({
          status: 201,
          json: { message: "Job queued successfully", job_id: "test-job-2" }
        });
        return;
      }
      if (request.method() === 'GET' && request.url().endsWith('/api/jobs')) {
        await route.fulfill({ status: 200, json: [] });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/stats', async route => {
      await route.fulfill({ status: 200, json: { total_jobs: 0, total_files: 0, success_rate: 0 } });
    });

    await page.route('**/api/system/storage', async route => {
      await route.fulfill({ status: 200, json: { total: 100, used: 10, free: 90, percentage: 10 } });
    });

    await page.goto('/');

    const textarea = page.locator('#spotify-url');
    await textarea.fill('https://open.spotify.com/album/456');

    // Press Control+Enter
    await textarea.press('Control+Enter');

    // Wait a short moment to ensure request is intercepted
    await page.waitForTimeout(500);

    expect(jobQueued).toBe(true);

    const feedback = page.locator('#queue-feedback');
    await expect(feedback).toHaveText('Successfully queued 1 job.');
    await expect(feedback).toHaveAttribute('data-state', 'success');
  });
});
