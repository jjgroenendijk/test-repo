import { test, expect } from '@playwright/test';

test('verify github link', async ({ page }) => {
  // Navigate to the homepage, accounting for basePath
  await page.goto('/test-repo/');

  // Check for the GitHub link
  const githubLink = page.getByLabel('View on GitHub');

  // Assert visibility
  await expect(githubLink).toBeVisible();

  // Assert href
  await expect(githubLink).toHaveAttribute('href', 'https://github.com/jjgroenendijk/test-repo');

  // Assert target _blank
  await expect(githubLink).toHaveAttribute('target', '_blank');

  // Take a screenshot for visual verification
  await page.screenshot({ path: 'github-link-verification.png' });
});
