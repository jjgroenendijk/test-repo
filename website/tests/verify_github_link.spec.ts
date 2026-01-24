import { test, expect } from '@playwright/test';

test('verify github link', async ({ page }) => {
  await page.goto('/test-repo/');

  const githubLink = page.getByLabel('View source on GitHub');
  await expect(githubLink).toBeVisible();
  await expect(githubLink).toHaveAttribute('href', 'https://github.com/jjgroenendijk/test-repo');
});
