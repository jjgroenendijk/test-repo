import { test, expect } from '@playwright/test';

test.describe('Delete Job Confirmation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the stats endpoint
    await page.route('/api/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_disk_usage_bytes: 1024 * 1024 * 500, // 500 MB
          total_storage_capacity_bytes: 1024 * 1024 * 1024 * 10, // 10 GB
          storage_usage_percent: 5,
        }),
      });
    });

    // Mock the initial jobs endpoint
    await page.route('/api/jobs', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'job-to-delete',
              url: 'https://open.spotify.com/track/delete-me',
              status: 'Completed',
              created_at: new Date().toISOString(),
              files: 1,
              error_log: null
            }
          ]),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/');
  });

  test('does not delete job if confirmation is cancelled', async ({ page }) => {
    let deleteRequestMade = false;

    await page.route('**/api/jobs/job-to-delete', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteRequestMade = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success' })
        });
      } else {
        await route.fallback();
      }
    });

    // Handle dialog: click cancel
    page.on('dialog', dialog => dialog.dismiss());

    const deleteBtn = page.getByRole('button', { name: 'Delete', exact: true });
    await expect(deleteBtn).toBeVisible();

    await deleteBtn.evaluate(node => node.click());

    // Verify the button text is still "Delete"
    await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Deleting...', exact: true })).not.toBeVisible();

    expect(deleteRequestMade).toBe(false);
  });

  test('deletes job if confirmation is accepted', async ({ page }) => {
    let deleteRequestMade = false;

    await page.route('**/api/jobs/job-to-delete', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteRequestMade = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success' })
        });
      } else {
        await route.fallback();
      }
    });

    // Handle dialog: click accept
    page.on('dialog', dialog => dialog.accept());

    const deleteBtn = page.getByRole('button', { name: 'Delete', exact: true });
    await expect(deleteBtn).toBeVisible();

    const requestPromise = page.waitForRequest(request =>
      request.url().includes('/api/jobs/job-to-delete') && request.method() === 'DELETE'
    );

    // Using dispatchEvent to correctly trigger listeners
    await deleteBtn.dispatchEvent('click');

    // We expect the text to change temporarily, wait for it
    await expect(page.getByRole('button', { name: 'Deleting...', exact: true })).toBeVisible();
    await requestPromise;

    expect(deleteRequestMade).toBe(true);
  });
});
