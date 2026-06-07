import { test, expect } from '@playwright/test';

test.describe('Copy Job ID Feature', () => {
  test('should display job ID and copy to clipboard on button click', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const testJobId = 'test-job-id-12345';

    // Mock the endpoints
    await page.route('**/api/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_jobs: 1, total_files: 0, success_rate: 100 })
      });
    });

    await page.route('**/api/jobs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: testJobId,
            url: 'https://open.spotify.com/track/123',
            status: 'Completed',
            created_at: new Date().toISOString()
          }
        ])
      });
    });

    await page.route('**/api/system/storage*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ total: 1000, used: 500, free: 500 })
        });
    });

    await page.goto('/');

    // Wait for the job card to appear
    const jobCard = page.locator(`.job-card[data-job-id="${testJobId}"]`);
    await expect(jobCard).toBeVisible();

    // Verify the ID is initially hidden or zero height
    const idDisplay = jobCard.locator('.job-id-display');

    // Hover over the job card to reveal the job ID
    await jobCard.hover();

    // Verify the ID is displayed after hover
    await expect(idDisplay).toBeVisible();
    await expect(idDisplay).toContainText(`ID: ${testJobId}`);

    // Verify the button exists and click it
    const copyButton = jobCard.locator('.copy-job-id-btn');
    await expect(copyButton).toBeVisible();

    // Set a dummy value in the clipboard first to ensure it actually changes
    await page.evaluate(() => navigator.clipboard.writeText('initial-clipboard-value'));

    // Click the copy button
    await copyButton.click();

    // Verify button text changed to "Copied!"
    await expect(copyButton).toHaveText('Copied!');

    // Verify it disabled
    await expect(copyButton).toBeDisabled();

    // Read clipboard text directly in page context
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(testJobId);
  });
});
