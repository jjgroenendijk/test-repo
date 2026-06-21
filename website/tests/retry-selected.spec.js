import { test, expect } from '@playwright/test';

test.describe('Retry selected jobs functionality', () => {
  test('should display Retry selected button when jobs are checked and perform retry', async ({ page }) => {
    // Mock storage endpoint first so it doesn't hang
    await page.route('**/api/system/storage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 1000, used: 100, free: 900 })
      });
    });

    let retryRequests = [];
    await page.route('**/api/jobs*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'job-1',
              url: 'https://open.spotify.com/track/1',
              status: 'Completed',
              created_at: '2023-01-01T00:00:00Z',
              service: 'spotdl',
              quality: '128k'
            },
            {
              id: 'job-2',
              url: 'https://open.spotify.com/track/2',
              status: 'Failed',
              created_at: '2023-01-01T00:00:00Z',
              service: 'spotdl',
              quality: '128k'
            },
            {
              id: 'job-3',
              url: 'https://open.spotify.com/track/3',
              status: 'Queued',
              created_at: '2023-01-01T00:00:00Z'
            }
          ])
        });
      } else if (route.request().method() === 'POST') {
        const postData = JSON.parse(route.request().postData());
        retryRequests.push(postData);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-job-id',
            url: postData.url,
            status: 'Queued',
            created_at: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    // Go to home page
    await page.goto('http://127.0.0.1:3000/');

    // Initial state: buttons should be hidden
    const retrySelectedBtn = page.locator('#retry-selected-btn');
    await expect(retrySelectedBtn).toBeHidden();

    const checkbox1 = page.locator('.job-select-checkbox[data-job-id="job-1"]');
    const checkbox2 = page.locator('.job-select-checkbox[data-job-id="job-2"]');
    const checkbox3 = page.locator('.job-select-checkbox[data-job-id="job-3"]');

    // Select job-1 (Completed)
    await checkbox1.evaluate(node => node.click());

    // Button should now be visible
    await expect(retrySelectedBtn).toBeVisible();
    await expect(retrySelectedBtn).toBeEnabled();

    // Select job-2 (Failed)
    await checkbox2.evaluate(node => node.click());

    // Select job-3 (Queued - shouldn't be retried)
    await checkbox3.evaluate(node => node.click());

    // Click retry selected
    await retrySelectedBtn.click();

    // Wait for the button text to change back to "Retry selected" which means it's done
    // Or check for the requests
    await expect(async () => {
        expect(retryRequests.length).toBe(2);
    }).toPass();

    // Verify correct requests were sent
    expect(retryRequests).toContainEqual(expect.objectContaining({ url: 'https://open.spotify.com/track/1' }));
    expect(retryRequests).toContainEqual(expect.objectContaining({ url: 'https://open.spotify.com/track/2' }));

    // Ensure job-3 (Queued) was NOT retried
    expect(retryRequests).not.toContainEqual(expect.objectContaining({ url: 'https://open.spotify.com/track/3' }));
  });
});
