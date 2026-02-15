import { test, expect } from '@playwright/test';

test('disk usage is displayed and formatted correctly in archive snapshot', async ({ page }) => {
  // Mock the /api/downloads endpoint
  await page.route('/api/downloads', async (route) => {
    const json = {
      records: [],
      storageUsage: 1048576, // 1 MB = 1024 * 1024
    };
    await route.fulfill({ json });
  });

  await page.goto('/');

  // Locate the "Storage Used" text
  const totalUsageLabel = page.getByText('Storage Used');
  await expect(totalUsageLabel).toBeVisible();

  // Locate the value using the data-testid I added
  const usageValue = page.getByTestId('storage-usage');
  await expect(usageValue).toBeVisible();

  // It should be formatted as bytes (e.g., "1 MB")
  await expect(usageValue).toHaveText('1 MB');
});

test('disk usage updates correctly with different value', async ({ page }) => {
   // Mock the /api/downloads endpoint with a different value
  await page.route('/api/downloads', async (route) => {
    const json = {
      records: [],
      storageUsage: 1536, // 1.5 KB = 1.5 * 1024
    };
    await route.fulfill({ json });
  });

  await page.goto('/');
  const usageValue = page.getByTestId('storage-usage');
  await expect(usageValue).toHaveText('1.5 KB');
});
