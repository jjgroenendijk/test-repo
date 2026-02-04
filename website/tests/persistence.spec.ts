import { test, expect } from '@playwright/test';

test('world persistence works', async ({ page }) => {
  await page.goto('/test-repo/game');

  // Wait for canvas
  await page.waitForSelector('canvas');

  // Verify Reset World button exists
  const resetButton = page.getByText('Reset World');
  await expect(resetButton).toBeVisible();

  // Trigger a change to force save. Initial load might not save immediately if state hasn't "changed".
  await resetButton.click();

  // Wait for store to update and persist
  await page.waitForTimeout(2000);

  // Check localStorage
  const storage = await page.evaluate(() => localStorage.getItem('world-storage'));
  expect(storage).toBeTruthy();
  const parsed = JSON.parse(storage!);
  expect(parsed.state.cubes.length).toBeGreaterThan(0);
  const initialCubes = parsed.state.cubes.length;

  // Reload page
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForTimeout(2000);

  // Check localStorage again
  const storageAfter = await page.evaluate(() => localStorage.getItem('world-storage'));
  expect(storageAfter).toBeTruthy();
  const parsedAfter = JSON.parse(storageAfter!);

  // Should verify the count matches (persistence worked)
  expect(parsedAfter.state.cubes.length).toEqual(initialCubes);
});
