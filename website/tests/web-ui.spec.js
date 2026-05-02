import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Mock the /api/jobs GET request
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "123",
            url: "https://open.spotify.com/album/1ATL5GLyefJaxhQzSPVrLX",
            status: "Completed",
            created_at: new Date().toISOString(),
            files: 10,
            error_log: null
          }
        ]),
      });
    } else if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
            id: "124",
            url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
            status: "Queued",
            created_at: new Date().toISOString(),
            files: 0,
            error_log: null
        })
      });
    } else if (route.request().method() === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success" })
      });
    } else {
        await route.continue();
    }
  });
});

test("shows the SpotiFLAC queue shell and fetched jobs", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "SpotiFLAC" })).toBeVisible();
  await expect(page.getByLabel("Spotify URL")).toBeVisible();
  await expect(page.getByText("/data", { exact: true })).toBeVisible();
  await expect(page.getByText("10 files")).toBeVisible();
});

test("validates supported Spotify URLs and queues job", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Spotify URL").fill("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M");
  await page.getByRole("button", { name: "Queue" }).click();

  await expect(page.getByText("Job queued successfully.")).toBeVisible();
});


test("shows cancel button for queued job and handles click", async ({ page }) => {
  // First we need to override the initial GET mock to show a queued job
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "125",
            url: "https://open.spotify.com/track/456",
            status: "Queued",
            created_at: new Date().toISOString(),
            files: 0,
            error_log: null
          }
        ]),
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto("/");

  const cancelBtn = page.getByRole("button", { name: "Cancel" });
  await expect(cancelBtn).toBeVisible();

  await cancelBtn.click();

  // Since we don't mock the subsequent GET /api/jobs in a way that changes state
  // (the overridden route still returns "Queued"), we just verify the button
  // text changed indicating the click handler fired.
  await expect(page.getByRole("button", { name: "Cancelling..." })).toBeVisible();
});

test('can view job logs', async ({ page }) => {
  // Mock API route for jobs to provide a completed job
  await page.route('/api/jobs', async route => {
    if (route.request().method() === 'GET') {
      const json = [{
        id: 'mock-job-id',
        url: 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy',
        status: 'Completed',
        created_at: new Date().toISOString(),
        files: 10
      }];
      await route.fulfill({ json });
    } else {
      await route.continue();
    }
  });

  // Mock API route for the log endpoint
  await page.route('/api/jobs/mock-job-id/log', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { log: "Fetching album details...\nDownloading 10 tracks...\nSuccess." } });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');

  // Wait for the job list to populate
  await expect(page.locator('.job-card')).toHaveCount(1);

  // Verify log container is initially hidden
  const logsContainer = page.locator('#logs-container-mock-job-id');
  await expect(logsContainer).toBeHidden();

  // Click View Logs button
  await page.locator('.view-logs-btn[data-job-id="mock-job-id"]').click();

  // Verify log container is visible
  await expect(logsContainer).toBeVisible();

  // Verify log content
  const logsContent = page.locator('#logs-content-mock-job-id');
  await expect(logsContent).toContainText('Fetching album details...');
  await expect(logsContent).toContainText('Success.');

  // Click Close Logs button
  await page.locator('.close-logs-btn[data-job-id="mock-job-id"]').click();

  // Verify log container is hidden again
  await expect(logsContainer).toBeHidden();
});

test("can clear job history", async ({ page }) => {
  // Mock API route for jobs to provide mixed jobs
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "1",
            url: "https://open.spotify.com/track/1",
            status: "Completed",
            created_at: new Date().toISOString(),
            files: 1,
            error_log: null
          },
          {
            id: "2",
            url: "https://open.spotify.com/track/2",
            status: "Running",
            created_at: new Date().toISOString(),
            files: 0,
            error_log: null
          }
        ]),
      });
    } else {
      await route.fallback();
    }
  });

  let clearHistoryCalled = false;
  await page.route("/api/history/clear", async (route) => {
    if (route.request().method() === "DELETE") {
      clearHistoryCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success", cleared: 1 })
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto("/");

  const clearBtn = page.getByRole("button", { name: "Clear history" });
  await expect(clearBtn).toBeVisible();

  await clearBtn.click();

  // Playwright executes the mock fetch almost instantly, so we might miss the 'Clearing...' text.
  // We can just verify it returned to 'Clear history' and the mock was called.
  await expect(page.getByRole("button", { name: "Clear history" })).toBeVisible();

  expect(clearHistoryCalled).toBe(true);
});
