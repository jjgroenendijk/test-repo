import { test, expect } from '@playwright/test';

test.describe('Select All Jobs', () => {
  const MOCK_JOBS = [
    {
      id: 'job-1',
      url: 'https://open.spotify.com/track/1',
      status: 'Completed',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    },
    {
      id: 'job-2',
      url: 'https://open.spotify.com/track/2',
      status: 'Failed',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    },
    {
      id: 'job-3',
      url: 'https://open.spotify.com/track/3',
      status: 'Queued',
      created_at: new Date().toISOString(),
    }
  ];

  test.beforeEach(async ({ page }) => {
    // Mock the jobs API
    await page.route('**/api/jobs', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: MOCK_JOBS });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200, json: { status: 'success' } });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/jobs/delete-selected', async (route) => {
        await route.fulfill({ status: 200, json: { status: 'success', deleted: 3 } });
    });

    // Mock stats
    await page.route('**/api/stats', route => route.fulfill({
      json: { total_jobs: 3, total_files: 0, success_rate: 33 }
    }));
    await page.route('**/api/system/storage', route => route.fulfill({
      json: { total: 1000, used: 500, free: 500 }
    }));
    await page.route('**/api/system/info', route => route.fulfill({
      json: { version: '1.0', platform: 'linux' }
    }));

    // Setup dialog handler
    page.on('dialog', dialog => dialog.accept());
  });

  test('Select All checkbox selects and deselects all jobs', async ({ page }) => {
    await page.goto('/');

    // Wait for jobs to render
    await expect(page.locator('.job-card')).toHaveCount(3);

    const selectAllCheckbox = page.locator('#select-all-jobs');
    const jobCheckboxes = page.locator('.job-select-checkbox');
    const deleteSelectedBtn = page.locator('#delete-selected-btn');

    // Initially select all is unchecked and delete btn is hidden
    await expect(selectAllCheckbox).not.toBeChecked();
    await expect(deleteSelectedBtn).toBeHidden();

    // Check "Select All"
    await selectAllCheckbox.check();

    // All job checkboxes should be checked
    for (let i = 0; i < 3; i++) {
        await expect(jobCheckboxes.nth(i)).toBeChecked();
    }

    // Delete selected button should be visible and enabled
    await expect(deleteSelectedBtn).toBeVisible();
    await expect(deleteSelectedBtn).toBeEnabled();

    // Uncheck "Select All"
    await selectAllCheckbox.uncheck();

    // All job checkboxes should be unchecked
    for (let i = 0; i < 3; i++) {
        await expect(jobCheckboxes.nth(i)).not.toBeChecked();
    }

    // Delete selected button should be hidden
    await expect(deleteSelectedBtn).toBeHidden();
  });

  test('Manually checking all jobs checks Select All', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.job-card')).toHaveCount(3);

    const selectAllCheckbox = page.locator('#select-all-jobs');
    const jobCheckboxes = page.locator('.job-select-checkbox');
    const deleteSelectedBtn = page.locator('#delete-selected-btn');

    // Check first job
    await jobCheckboxes.nth(0).evaluate(node => node.click());
    await expect(selectAllCheckbox).not.toBeChecked();
    await expect(deleteSelectedBtn).toBeVisible();

    // Check second job
    await jobCheckboxes.nth(1).evaluate(node => node.click());
    await expect(selectAllCheckbox).not.toBeChecked();

    // Check third job
    await jobCheckboxes.nth(2).evaluate(node => node.click());

    // Now Select All should be checked
    await expect(selectAllCheckbox).toBeChecked();

    // Uncheck one job
    await jobCheckboxes.nth(1).evaluate(node => node.click());

    // Select All should be unchecked
    await expect(selectAllCheckbox).not.toBeChecked();
    await expect(deleteSelectedBtn).toBeVisible(); // Still visible since some are checked
  });
});
