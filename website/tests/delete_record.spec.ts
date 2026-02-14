import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

test('delete record removes item and files', async ({ page }) => {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), '.data');
  const historyFile = path.join(dataDir, 'history.json');
  const downloadsDir = path.join(dataDir, 'downloads');

  // Ensure directories exist
  await fs.mkdir(downloadsDir, { recursive: true });

  const recordId = 'e2e-test-id';
  const record = {
    id: recordId,
    createdAt: new Date().toISOString(),
    url: 'http://example.com/video',
    mode: 'video',
    includePlaylist: false,
    status: 'completed',
    files: ['e2e-video.mp4'],
    logTail: 'Simulated download',
  };

  // Inject record
  await fs.writeFile(historyFile, JSON.stringify([record]), 'utf8');
  // Create dummy file
  await fs.writeFile(path.join(downloadsDir, 'e2e-video.mp4'), 'content', 'utf8');

  await page.goto('/');

  // Verify record is visible
  const item = page.locator('.history-item').filter({ hasText: 'http://example.com/video' });
  await expect(item).toBeVisible();

  // Click delete
  page.on('dialog', dialog => dialog.accept());
  await item.getByRole('button', { name: 'Delete' }).click();

  // Verify record is gone
  await expect(item).toBeHidden();

  // Verify file is gone
  try {
    await fs.access(path.join(downloadsDir, 'e2e-video.mp4'));
    throw new Error('File should have been deleted');
  } catch (e) {
     if (e instanceof Error && e.message === 'File should have been deleted') {
         throw e;
     }
  }
});
