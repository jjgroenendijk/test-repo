import { test, expect } from '@playwright/test';

test('disk usage is displayed in archive snapshot', async ({ page }) => {
  await page.goto('/');

  // Locate the "Storage Used" text
  const totalUsageLabel = page.getByText('Storage Used');
  await expect(totalUsageLabel).toBeVisible();

  // Locate the value using the data-testid I added
  const usageValue = page.getByTestId('storage-usage');
  await expect(usageValue).toBeVisible();

  // It should be formatted as bytes (e.g., "0 B", "12.34 MB")
  await expect(usageValue).toHaveText(/^[0-9]+(\.[0-9]+)?\s?(B|KB|MB|GB|TB)$/);
});
