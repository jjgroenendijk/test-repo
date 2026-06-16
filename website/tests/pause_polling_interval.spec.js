import { test, expect } from '@playwright/test';

test.describe('Pause/Resume Polling Interval', () => {
  test('should not poll when paused', async ({ page }) => {
    let statsPollCount = 0;

    // Mock API requests
    await page.route('**/api/jobs*', async route => await route.fulfill({ json: [] }));
    await page.route('**/api/health', async route => await route.fulfill({ status: 200 }));
    await page.route('**/api/stats', async route => {
        statsPollCount++;
        await route.fulfill({ json: { total_jobs: 0, total_files: 0, success_rate: "0" } });
    });

    await page.goto('/');

    const pauseBtn = page.locator('#pause-polling-btn');
    await expect(pauseBtn).toBeVisible();

    // Verify polling starts initially
    await page.waitForTimeout(2500);
    const initialCount = statsPollCount;
    expect(initialCount).toBeGreaterThan(0);

    // Pause polling
    await pauseBtn.click();
    await expect(pauseBtn).toHaveClass(/paused/);

    // Wait and verify no more polling
    const countAfterPause = statsPollCount;
    await page.waitForTimeout(2500);
    expect(statsPollCount).toBe(countAfterPause);
  });
});
