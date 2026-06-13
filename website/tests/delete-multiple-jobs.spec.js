import { test, expect } from '@playwright/test';

test.describe('Remove Multiple Selected Jobs', () => {
  test('should allow selecting multiple jobs and deleting them', async ({ page }) => {
    // Mock the background stats endpoint
    await page.route('**/api/stats', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_jobs: 3,
          total_files: 3,
          success_rate: 100
        })
      });
    });

    const mockJobs = [
      {
        id: 'job-1',
        url: 'https://open.spotify.com/track/111',
        status: 'Completed',
        created_at: new Date('2024-01-01T12:00:00Z').toISOString(),
        completed_at: new Date('2024-01-01T12:05:00Z').toISOString(),
      },
      {
        id: 'job-2',
        url: 'https://open.spotify.com/track/222',
        status: 'Completed',
        created_at: new Date('2024-01-01T11:00:00Z').toISOString(),
        completed_at: new Date('2024-01-01T11:05:00Z').toISOString(),
      },
      {
        id: 'job-3',
        url: 'https://open.spotify.com/track/333',
        status: 'Failed',
        created_at: new Date('2024-01-01T10:00:00Z').toISOString(),
        completed_at: new Date('2024-01-01T10:05:00Z').toISOString(),
      }
    ];

    // Mock initial jobs fetch
    await page.route('**/api/jobs', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockJobs)
        });
      } else {
        await route.continue();
      }
    });

    // Mock delete-selected endpoint
    let deleteSelectedCalled = false;
    let deletedJobIds = [];
    await page.route('**/api/jobs/delete-selected', async (route) => {
      if (route.request().method() === 'POST') {
        deleteSelectedCalled = true;
        const postData = JSON.parse(route.request().postData() || '{}');
        deletedJobIds = postData.job_ids || [];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', deleted: deletedJobIds.length })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    // Wait for jobs to render
    await expect(page.locator('.job-card')).toHaveCount(3);

    const deleteBtn = page.locator('#delete-selected-btn');
    await expect(deleteBtn).toBeHidden();

    // Select the first two jobs (job-1 and job-2 since they are sorted newest first)
    const checkbox1 = page.locator('.job-select-checkbox[data-job-id="job-1"]');
    const checkbox2 = page.locator('.job-select-checkbox[data-job-id="job-2"]');

    await checkbox1.evaluate(node => node.click());
    await checkbox2.evaluate(node => node.click());

    await expect(checkbox1).toBeChecked();
    await expect(checkbox2).toBeChecked();

    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toBeEnabled();

    page.on('dialog', dialog => dialog.accept());

    const requestPromise = page.waitForRequest(request =>
      request.url().includes('/api/jobs/delete-selected') && request.method() === 'POST'
    );

    await deleteBtn.click();
    await requestPromise;

    expect(deleteSelectedCalled).toBeTruthy();
    expect(deletedJobIds).toContain('job-1');
    expect(deletedJobIds).toContain('job-2');
    expect(deletedJobIds).not.toContain('job-3');
    expect(deletedJobIds).toHaveLength(2);

    // After success, button should be hidden again
    await expect(deleteBtn).toBeHidden();
  });
});
