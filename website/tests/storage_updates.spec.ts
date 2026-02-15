import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// This test verifies that the backend correctly calculates storage usage
// and the frontend updates when page is reloaded.
test('storage usage updates when files are added (backend verification)', async ({ page }) => {
  const projectRoot = path.resolve(__dirname, '..');
  // Use .test_data if available, otherwise default to .data
  const dataDir = process.env.DATA_DIR || path.join(projectRoot, '.data');
  const downloadsDir = path.join(dataDir, 'downloads');

  // Ensure directories exist
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Clear downloads directory to start fresh
  const files = fs.readdirSync(downloadsDir);
  for (const file of files) {
    try {
      fs.unlinkSync(path.join(downloadsDir, file));
    } catch {
      // Ignore if it's a directory or fails
    }
  }

  await page.goto('/');

  // Check initial state (should be 0 B)
  const usageValue = page.getByTestId('storage-usage');
  // Allow some time for initial load
  await expect(usageValue).toHaveText('0 B');

  // Create a 1MB file
  const oneMB = 1024 * 1024;
  const buffer = Buffer.alloc(oneMB, 'a');
  const testFilePath = path.join(downloadsDir, 'test-file.bin');
  fs.writeFileSync(testFilePath, buffer);

  // Reload page to fetch new usage
  await page.reload();

  // Check updated state (should be 1 MB)
  await expect(usageValue).toHaveText('1 MB');

  // Clean up
  try {
    fs.unlinkSync(testFilePath);
  } catch {}
});

// This test verifies that the frontend logic updates storage usage after download actions
// by mocking the API responses.
test('storage usage updates after successful download (frontend verification)', async ({ page }) => {
  // Mock initial GET
  await page.route('**/api/downloads', async (route, request) => {
    if (request.method() === 'GET') {
      await route.fulfill({
        json: { records: [], storageUsage: 0 }
      });
    } else if (request.method() === 'POST') {
      await route.continue();
    } else {
      await route.continue();
    }
  });

  await page.goto('/');
  await expect(page.getByTestId('storage-usage')).toHaveText('0 B');

  // Mock POST and subsequent GET
  let postCalled = false;
  await page.route('**/api/downloads', async (route, request) => {
    if (request.method() === 'POST') {
      postCalled = true;
      await route.fulfill({
        json: {
          record: {
            id: '1',
            createdAt: new Date().toISOString(),
            url: 'http://example.com/video',
            mode: 'video',
            includePlaylist: false,
            status: 'completed',
            files: ['video.mp4'],
            logTail: 'Done'
          }
        }
      });
    } else if (request.method() === 'GET') {
      if (postCalled) {
        // Second GET (after download)
        await route.fulfill({
          json: {
            records: [
              {
                id: '1',
                createdAt: new Date().toISOString(),
                url: 'http://example.com/video',
                mode: 'video',
                includePlaylist: false,
                status: 'completed',
                files: ['video.mp4'],
                logTail: 'Done'
              }
            ],
            storageUsage: 1024 * 1024 * 10 // 10 MB
          }
        });
      } else {
        // Initial GET
        await route.fulfill({
          json: { records: [], storageUsage: 0 }
        });
      }
    } else {
      await route.continue();
    }
  });

  // Fill form and submit
  await page.fill('input[name="video-url"]', 'http://example.com/video');
  await page.click('button[type="submit"]');

  // Check if storage usage updates
  await expect(page.getByTestId('storage-usage')).toHaveText('10 MB');
});

test('storage usage updates after failed download (frontend verification)', async ({ page }) => {
  // Mock initial GET
  let postCalled = false;
  await page.route('**/api/downloads', async (route, request) => {
    if (request.method() === 'POST') {
      postCalled = true;
      await route.fulfill({
        status: 500,
        json: {
          error: "Download failed",
          record: {
            id: '2',
            createdAt: new Date().toISOString(),
            url: 'http://example.com/fail',
            mode: 'video',
            includePlaylist: false,
            status: 'failed',
            files: [],
            logTail: 'Error'
          }
        }
      });
    } else if (request.method() === 'GET') {
      if (postCalled) {
        // Second GET (after failure)
        await route.fulfill({
          json: {
            records: [
              {
                id: '2',
                createdAt: new Date().toISOString(),
                url: 'http://example.com/fail',
                mode: 'video',
                includePlaylist: false,
                status: 'failed',
                files: [],
                logTail: 'Error'
              }
            ],
            storageUsage: 1024 * 1024 * 5 // 5 MB (partial)
          }
        });
      } else {
        // Initial GET
        await route.fulfill({
          json: { records: [], storageUsage: 0 }
        });
      }
    } else {
      await route.continue();
    }
  });

  await page.goto('/');
  await expect(page.getByTestId('storage-usage')).toHaveText('0 B');

  // Fill form and submit
  await page.fill('input[name="video-url"]', 'http://example.com/fail');
  await page.click('button[type="submit"]');

  // Check if storage usage updates
  // This is expected to FAIL currently until the fix is applied
  await expect(page.getByTestId('storage-usage')).toHaveText('5 MB');
});
