import { test, expect } from '@playwright/test';

test.describe('Settings Persistence', () => {
  test('should persist service and quality settings across reloads', async ({ page }) => {
    // Mock the backend API calls
    await page.route('**/api/jobs*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('**/api/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_jobs: 0,
          total_files: 0,
          success_rate: 0
        })
      });
    });

    // Go to the main page
    await page.goto('/');

    // Verify initial default values
    const serviceSelect = page.locator('#service-select');
    const qualitySelect = page.locator('#quality-select');

    await expect(serviceSelect).toHaveValue('tidal');
    await expect(qualitySelect).toHaveValue('LOSSLESS');

    // Change the values
    await serviceSelect.selectOption('qobuz');
    await qualitySelect.selectOption('HI_RES_LOSSLESS');

    // Verify they are changed
    await expect(serviceSelect).toHaveValue('qobuz');
    await expect(qualitySelect).toHaveValue('HI_RES_LOSSLESS');

    // Reload the page
    await page.reload();

    // Re-locate after reload
    const serviceSelectAfter = page.locator('#service-select');
    const qualitySelectAfter = page.locator('#quality-select');

    // Verify the values persisted
    await expect(serviceSelectAfter).toHaveValue('qobuz');
    await expect(qualitySelectAfter).toHaveValue('HI_RES_LOSSLESS');
  });
});
