import { test, expect } from '@playwright/test';

test.describe('Cancel All Running Feature', () => {
  test('should show confirmation dialog and cancel all running jobs when accepted', async ({ page }) => {
    let cancelCalled = false;

    // Mock API routes
    await page.route('/api/jobs', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'job-running-1',
              url: 'https://open.spotify.com/track/running1',
              status: 'Running',
              files: 0,
              created_at: new Date().toISOString(),
              completed_at: null,
              error_log: null
            }
          ])
        });
      }
    });

    await page.route('/api/jobs/cancel-running', async (route) => {
      if (route.request().method() === 'POST') {
        cancelCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', cancelled: 1 })
        });
      }
    });

    // Handle the dialog prompt natively
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Are you sure you want to cancel all running jobs? This cannot be undone.');
      await dialog.accept();
    });

    // Navigate to the app
    await page.goto('/');

    // Ensure the button exists
    const cancelBtn = page.locator('#cancel-all-running-btn');
    await expect(cancelBtn).toBeVisible();

    // Setup request listener to wait for API call
    const requestPromise = page.waitForRequest(request => request.url().includes('/api/jobs/cancel-running') && request.method() === 'POST');

    // Click the button
    await cancelBtn.click();

    // Wait for the request
    await requestPromise;

    // Assert that the endpoint was called
    expect(cancelCalled).toBe(true);
  });

  test('should show confirmation dialog and not cancel all running jobs when dismissed', async ({ page }) => {
    let cancelCalled = false;

    // Mock API routes
    await page.route('/api/jobs', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'job-running-2',
              url: 'https://open.spotify.com/track/running2',
              status: 'Running',
              files: 0,
              created_at: new Date().toISOString(),
              completed_at: null,
              error_log: null
            }
          ])
        });
      }
    });

    await page.route('/api/jobs/cancel-running', async (route) => {
      if (route.request().method() === 'POST') {
        cancelCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', cancelled: 1 })
        });
      }
    });

    // Handle the dialog prompt natively
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Are you sure you want to cancel all running jobs? This cannot be undone.');
      await dialog.dismiss();
    });

    // Navigate to the app
    await page.goto('/');

    // Ensure the button exists
    const cancelBtn = page.locator('#cancel-all-running-btn');
    await expect(cancelBtn).toBeVisible();

    // Click the button
    await cancelBtn.click();

    // Wait a brief moment to ensure request would have been sent
    await page.waitForTimeout(500);

    // Assert that the endpoint was NOT called
    expect(cancelCalled).toBe(false);
  });
});
