import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  // Explicitly navigate to the base path to avoid ambiguity
  await page.goto('/test-repo/');
  await expect(page).toHaveTitle(/Create Next App/);
});

test('check dark mode toggle', async ({ page }) => {
  await page.goto('/test-repo/');

  const html = page.locator('html');
  const initialClass = await html.getAttribute('class');
  const isDark = initialClass?.includes('dark');

  // Use getByLabel since aria-label is set
  const toggle = page.getByLabel('Toggle dark mode');
  await expect(toggle).toBeVisible();
  await toggle.click();

  if (isDark) {
    await expect(html).not.toHaveClass(/dark/);
  } else {
    await expect(html).toHaveClass(/dark/);
  }
});

test('check configure permissions text', async ({ page }) => {
  await page.goto('/test-repo/');
  await expect(page.getByText('Configure Permissions')).toBeVisible();
  await expect(page.getByText('Install Dependencies')).not.toBeVisible();
});
