import { test, expect } from '@playwright/test';

test.describe('Pause/Resume Polling', () => {
  test('should toggle pause polling button and state', async ({ page }) => {
    // Mock API requests to avoid errors
    await page.route('**/api/jobs*', async route => await route.fulfill({ json: [] }));
    await page.route('**/api/health', async route => await route.fulfill({ status: 200 }));
    await page.route('**/api/stats', async route => await route.fulfill({ json: { total_jobs: 0, total_files: 0, success_rate: "0" } }));

    await page.goto('/');

    const pauseBtn = page.locator('#pause-polling-btn');
    await expect(pauseBtn).toBeVisible();
    await expect(pauseBtn).toHaveText('Pause Polling');

    await pauseBtn.click();
    await expect(pauseBtn).toHaveText('Resume Polling');
    await expect(pauseBtn).toHaveClass(/paused/);

    await pauseBtn.click();
    await expect(pauseBtn).toHaveText('Pause Polling');
    await expect(pauseBtn).not.toHaveClass(/paused/);
  });
});
