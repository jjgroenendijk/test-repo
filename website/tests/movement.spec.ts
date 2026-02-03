import { test, expect } from '@playwright/test';
import path from 'path';

test('Player movement verification', async ({ page }) => {
  // Navigate to game
  await page.goto('/test-repo/game');

  // Wait for canvas
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20000 });

  // Wait for scene to load and physics to settle
  await page.waitForTimeout(5000);

  // Get initial position
  const initialPos = await page.evaluate(() => {
    return (window as any).__PLAYER_POSITION__;
  });

  console.log('Initial Position:', initialPos);
  expect(initialPos).toBeTruthy();
  expect(initialPos.length).toBe(3);

  // Press W to move forward
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(500); // Walk for 500ms
  await page.keyboard.up('KeyW');

  // Wait a bit for update
  await page.waitForTimeout(100);

  // Get new position
  const newPos = await page.evaluate(() => {
    return (window as any).__PLAYER_POSITION__;
  });

  console.log('New Position:', newPos);

  // Take screenshot
  const screenshotPath = path.resolve(__dirname, '../../docs/screenshots/movement_verification.png');
  await page.screenshot({ path: screenshotPath });

  // Assert movement happened
  // Initial Z should be around 0.
  // Moving forward (pressing W) with default camera (looking at 0,0,0 from 0,5,0?)
  // Wait, Player spawns at 0,5,0. Camera copies player position.
  // Rotation is controlled by mouse. Initial rotation is 0,0,0 (looking down -Z axis).
  // W moves forward (0,0,-1).
  // So Z should decrease (become negative).

  const zDiff = newPos[2] - initialPos[2];
  console.log('Z Difference:', zDiff);

  // Expect Z to decrease (negative difference)
  // SPEED is 5. 0.5s duration. Distance approx 2.5 units.
  expect(zDiff).toBeLessThan(-0.5); // Allow some margin
});
