import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Helper to create a dummy file
const createDummyFile = (filePath: string, sizeInBytes: number) => {
  const buffer = Buffer.alloc(sizeInBytes);
  fs.writeFileSync(filePath, buffer);
};

test.describe('Disk Usage', () => {
  const dataDir = path.join(process.cwd(), '.data');
  const downloadsDir = path.join(dataDir, 'downloads');
  const dummyFile = path.join(downloadsDir, 'test-file-5mb.bin');
  const fileSize = 5 * 1024 * 1024; // 5 MB
  const tolerance = 0.1 * 1024 * 1024; // 100KB tolerance

  test.beforeAll(async () => {
    // Ensure directory exists
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
  });

  test.afterEach(() => {
    // Cleanup
    if (fs.existsSync(dummyFile)) {
      fs.unlinkSync(dummyFile);
    }
  });

  test('displays correct storage usage', async ({ page }) => {
    // Get initial usage
    await page.goto('/');
    const initialUsageText = await page.getByTestId('storage-usage').textContent();

    const parseUsage = (text: string | null) => {
      if (!text) return 0;
      const parts = text.split(' ');
      const value = parseFloat(parts[0]);
      const unit = parts[1];
      let bytes = value;
      if (unit === 'KB') bytes *= 1024;
      if (unit === 'MB') bytes *= 1024 * 1024;
      if (unit === 'GB') bytes *= 1024 * 1024 * 1024;
      if (unit === 'TB') bytes *= 1024 * 1024 * 1024 * 1024;
      return bytes;
    };

    const initialBytes = parseUsage(initialUsageText);

    // Create 5MB file
    createDummyFile(dummyFile, fileSize);

    // Refresh page
    await page.reload();

    // Check usage with retry logic
    await expect.poll(async () => {
      const text = await page.getByTestId('storage-usage').textContent();
      const currentBytes = parseUsage(text);
      return Math.abs(currentBytes - initialBytes - fileSize);
    }, {
      message: 'Storage usage did not update correctly',
      timeout: 5000,
    }).toBeLessThan(tolerance);
  });
});
