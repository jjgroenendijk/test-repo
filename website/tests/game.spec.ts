import { test, expect } from '@playwright/test';
import path from 'path';

test('Game loads and captures screenshot', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', exception => console.log('PAGE ERROR:', exception));

  await page.goto('/test-repo/game');
  console.log('Current URL:', page.url());

  // Check if we are on 404
  const heading = page.getByRole('heading', { level: 1 });
  if (await heading.isVisible()) {
      console.log('Heading found:', await heading.innerText());
  }

  // Expect canvas to be present
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 20000 });

  // Wait for a bit to let 3D scene load
  await page.waitForTimeout(3000);

  // Take screenshot
  const screenshotPath = path.resolve(__dirname, '../../docs/screenshots/gameplay.png');
  await page.screenshot({ path: screenshotPath });

  // Verify UI elements
  await expect(page.getByText('Minecraft Explorer')).toBeVisible();
  await expect(page.getByText('WASD to Move')).toBeVisible();
});
