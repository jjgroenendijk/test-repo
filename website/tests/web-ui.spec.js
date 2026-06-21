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
  await expect(page.getByLabel("Spotify URLs")).toBeVisible();
  await expect(page.getByText("/data", { exact: true })).toBeVisible();
  await expect(page.getByText("10 files")).toBeVisible();
});

test("validates supported Spotify URLs and queues job", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Spotify URLs").fill("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M");
  await page.getByRole("button", { name: "Queue", exact: true }).click();

  await expect(page.getByText("Successfully queued 1 job.")).toBeVisible();
});

test("validates and queues multiple Spotify URLs", async ({ page }) => {
  await page.goto("/");

  // Mock the /api/jobs endpoint to intercept requests
  const requests = [];
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "POST") {
      requests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: `mock-job-${requests.length}`,
          url: route.request().postDataJSON().url,
          status: "Queued",
          created_at: new Date().toISOString(),
          files: 0
        })
      });
    } else {
      await route.continue();
    }
  });

  const urls = "https://open.spotify.com/track/123,https://open.spotify.com/album/456,  https://open.spotify.com/playlist/789  ";
  await page.getByLabel("Spotify URLs").fill(urls);
  await page.getByRole("button", { name: "Queue", exact: true }).click();

  await expect(page.getByText("Successfully queued 3 jobs.")).toBeVisible();

  expect(requests).toHaveLength(3);
  expect(requests[0].url).toBe("https://open.spotify.com/track/123");
  expect(requests[1].url).toBe("https://open.spotify.com/album/456");
  expect(requests[2].url).toBe("https://open.spotify.com/playlist/789");
});


test("shows retry button for failed job and handles click", async ({ page }) => {
  // Mock API route for jobs to provide a failed job
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "126",
            url: "https://open.spotify.com/track/789",
            status: "Failed",
            created_at: new Date().toISOString(),
            files: 0,
            error_log: "Something went wrong"
          }
        ]),
      });
    } else if (route.request().method() === "POST") {
      setTimeout(async () => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "127",
            url: "https://open.spotify.com/track/789",
            status: "Queued",
            created_at: new Date().toISOString(),
            files: 0,
            error_log: null
          })
        });
      }, 500);
    } else {
      await route.fallback();
    }
  });

  await page.goto("/");

  const retryBtn = page.getByRole("button", { name: "Retry", exact: true });
  await expect(retryBtn).toBeVisible();

  await retryBtn.click();

  await expect(page.getByRole("button", { name: "Retrying..." })).toBeVisible();
});

test("can delete a job", async ({ page }) => {
  // Mock API route for jobs to provide a completed job
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "job-to-delete",
            url: "https://open.spotify.com/track/delete-me",
            status: "Completed",
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

  let deleteJobCalled = false;
  await page.route("**/api/jobs/job-to-delete", async (route) => {
    if (route.request().method() === "DELETE") {
      deleteJobCalled = true;
      setTimeout(async () => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "success" })
        });
      }, 500);
    } else {
      await route.fallback();
    }
  });

  await page.goto("/");

  const deleteBtn = page.getByRole("button", { name: "Delete", exact: true });
  await expect(deleteBtn).toBeVisible();

  page.on('dialog', dialog => dialog.accept());
  await deleteBtn.click();
  await expect(page.getByRole("button", { name: "Deleting..." })).toBeVisible();

  expect(deleteJobCalled).toBe(true);
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

  await page.route("**/api/jobs/*", async (route) => {
    if (route.request().method() === "DELETE") {
      setTimeout(async () => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "success" })
        });
      }, 500);
    } else {
      await route.fallback();
    }
  });

  await page.goto("/");

  const cancelBtn = page.getByRole("button", { name: "Cancel", exact: true });
  await expect(cancelBtn).toBeVisible();

  page.once("dialog", dialog => dialog.accept());

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
        completed_at: new Date(Date.now() - 1000).toISOString(),
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

test("can toggle auto-refresh", async ({ page }) => {
  await page.goto("/");

  const pauseBtn = page.locator('#pause-polling-btn');
  await expect(pauseBtn).toBeVisible();
  await expect(pauseBtn).toHaveText('Pause Auto-refresh');

  // Click to pause
  await pauseBtn.click();
  await expect(pauseBtn).toHaveText('Resume Auto-refresh');
  await expect(pauseBtn).toHaveClass(/paused/);

  // Reload to verify it persists
  await page.reload();
  await expect(pauseBtn).toHaveText('Resume Auto-refresh');
  await expect(pauseBtn).toHaveClass(/paused/);

  // Click to resume
  await pauseBtn.click();
  await expect(pauseBtn).toHaveText('Pause Auto-refresh');
  await expect(pauseBtn).not.toHaveClass(/paused/);
});

test("can refresh job list", async ({ page }) => {
  let fetchJobsCalledCount = 0;
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      fetchJobsCalledCount++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto("/");

  const refreshBtn = page.getByRole("button", { name: "Refresh jobs" });
  await expect(refreshBtn).toBeVisible();

  // Reset count after initial load and polling that might happen
  fetchJobsCalledCount = 0;

  await refreshBtn.click();

  // Wait for button to be enabled again
  await expect(page.getByRole("button", { name: "Refresh jobs" })).toBeVisible();

  // Verify that a network request was made
  expect(fetchJobsCalledCount).toBeGreaterThan(0);
});

test("can clear queued jobs", async ({ page }) => {
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "test-queued-job-1", status: "Queued", url: "https://open.spotify.com/track/queued1" },
          { id: "test-completed-job-1", status: "Completed", url: "https://open.spotify.com/track/completed1" }
        ])
      });
    } else {
      await route.fallback();
    }
  });

  let clearQueuedCalled = false;
  await page.route("/api/history/clear-queued", async (route) => {
    if (route.request().method() === "DELETE") {
      clearQueuedCalled = true;
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

  const clearQueuedBtn = page.getByRole("button", { name: "Clear queued" });
  await expect(clearQueuedBtn).toBeVisible();

  page.once("dialog", dialog => dialog.accept());

  const requestPromise = page.waitForRequest(request =>
    request.url().endsWith("/api/history/clear-queued") && request.method() === "DELETE"
  );
  await clearQueuedBtn.click();
  await requestPromise;

  expect(clearQueuedCalled).toBe(true);
});

test("can clear running jobs", async ({ page }) => {
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

  let clearRunningCalled = false;
  await page.route("/api/history/clear-running", async (route) => {
    if (route.request().method() === "DELETE") {
      clearRunningCalled = true;
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

  const clearRunningBtn = page.getByRole("button", { name: "Clear running" });
  await expect(clearRunningBtn).toBeVisible();

  page.once("dialog", dialog => dialog.accept());

  await clearRunningBtn.click();

  expect(clearRunningCalled).toBe(true);
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

  page.once("dialog", dialog => dialog.accept());
  await clearBtn.click();

  // Playwright executes the mock fetch almost instantly, so we might miss the 'Clearing...' text.
  // We can just verify it returned to 'Clear history' and the mock was called.
  await expect(page.getByRole("button", { name: "Clear history" })).toBeVisible();

  expect(clearHistoryCalled).toBe(true);
});

test("displays visual progress bar for running jobs", async ({ page }) => {
  // Mock API route for jobs to provide a running job
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "running-job-id",
            url: "https://open.spotify.com/album/progress",
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

  // Mock API route for progress
  await page.route("/api/jobs/running-job-id/progress", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          current: 5,
          total: 10,
          track: "Track 5",
          percentage: 50
        })
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto("/");

  // Wait for the job card to load
  const jobCard = page.locator(".job-card").filter({ hasText: "Running" });
  await expect(jobCard).toBeVisible();

  // Verify the progress text is present
  await expect(jobCard.locator("strong:has-text('Progress:')")).toBeVisible();
  await expect(jobCard).toContainText("[5/10]: Track 5 (50%)");

  // Verify progress bar background
  const progressBarBg = jobCard.locator(".progress-bar-bg");
  await expect(progressBarBg).toBeVisible();

  // Verify progress bar fill width
  const progressBarFill = jobCard.locator(".progress-bar-fill");
  await expect(progressBarFill).toBeVisible();

  // Checking the style width property
  await expect(progressBarFill).toHaveCSS("width", /.+/);
  // Specifically wait for the width to reflect 50%
  // We check style="width: 50%;" inline style
  await expect(progressBarFill).toHaveAttribute("style", "width: 50%;");
});

test('displays Download ZIP link for completed jobs', async ({ page }) => {
  await page.goto('/');

  // Wait for the job card with ID 123 (which is mocked as "Completed" in beforeEach)
  const jobCard = page.locator('.job-card').filter({ hasText: '1ATL5GLyefJaxhQzSPVrLX' });
  await expect(jobCard).toBeVisible();

  // Find the Download ZIP link
  const downloadLink = jobCard.locator('.download-zip-btn');
  await expect(downloadLink).toBeVisible();
  await expect(downloadLink).toHaveText('Download All');

  // Verify the href attribute
  await expect(downloadLink).toHaveAttribute('href', '/api/jobs/123/download');
  await expect(downloadLink).toHaveAttribute('download', '');
});

test('displays Download All button on job card when completed', async ({ page }) => {
  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-12345',
            url: 'https://open.spotify.com/album/1ATL5GLyefJaxhQzSPVrLX',
            status: 'Completed',
        completed_at: new Date(Date.now() - 1000).toISOString(),
            created_at: new Date().toISOString(),
            files: 10,
            error_log: null
          }
        ]),
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');

  const jobCard = page.locator('.job-card[data-job-id="job-12345"]');
  await expect(jobCard).toBeVisible();

  const downloadAllBtn = jobCard.locator('a.download-zip-btn');
  await expect(downloadAllBtn).toBeVisible();
  await expect(downloadAllBtn).toHaveText('Download All');
  await expect(downloadAllBtn).toHaveAttribute('href', '/api/jobs/job-12345/download');
  await expect(downloadAllBtn).toHaveAttribute('download', '');
});


test('displays Download all completed button when completed jobs exist', async ({ page }) => {
  // Use the mocked API route to provide a completed job
  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '123',
            url: 'https://open.spotify.com/album/1ATL5GLyefJaxhQzSPVrLX',
            status: 'Completed',
        completed_at: new Date(Date.now() - 1000).toISOString(),
            created_at: new Date().toISOString(),
            files: 10,
            error_log: null
          }
        ]),
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');

  const downloadAllBtn = page.locator('#download-all-btn');
  await expect(downloadAllBtn).toBeVisible();
  await expect(downloadAllBtn).toHaveAttribute('href', '/api/history/download');
  await expect(downloadAllBtn).toHaveAttribute('download', '');
});

test("changes theme via selector", async ({ page }) => {
  await page.goto("/");
  const themeSelector = page.locator("#theme-selector");
  const html = page.locator("html");

  await themeSelector.selectOption("dark");
  await expect(html).toHaveClass(/dark/);

  await themeSelector.selectOption("light");
  await expect(html).not.toHaveClass(/dark/);
});

test("filters jobs by status", async ({ page }) => {
  // Add a Queued job to the mock to test filtering
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
          },
          {
            id: "125",
            url: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
            status: "Queued",
            created_at: new Date().toISOString(),
            files: 0,
            error_log: null
          }
        ]),
      });
    } else {
        await route.continue();
    }
  });

  await page.goto("/");

  // Initially shows both jobs
  await expect(page.locator(".job-card")).toHaveCount(2);

  // Filter by Completed
  await page.locator("#job-status-filter").selectOption("Completed");
  await expect(page.locator(".job-card")).toHaveCount(1);
  await expect(page.locator(".job-card")).toContainText("Completed");

  // Filter by Queued
  await page.locator("#job-status-filter").selectOption("Queued");
  await expect(page.locator(".job-card")).toHaveCount(1);
  await expect(page.locator(".job-card")).toContainText("Queued");

  // Filter by Failed (no jobs should match)
  await page.locator("#job-status-filter").selectOption("Failed");
  await expect(page.locator(".job-card")).toHaveCount(0);
  await expect(page.locator(".empty-state")).toContainText("No jobs match the selected filter.");

  // Filter by All
  await page.locator("#job-status-filter").selectOption("All");
  await expect(page.locator(".job-card")).toHaveCount(2);
});

test("job URLs are rendered as clickable links", async ({ page }) => {
  // Use the mocked API route to provide a job
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "123",
            url: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
            status: "Completed",
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

  await page.goto("/");

  // Wait for the job card to load
  const jobCard = page.locator(".job-card").first();
  await expect(jobCard).toBeVisible();

  // Find the source link inside the job title
  const sourceLink = jobCard.locator(".job-title a.source-link");
  await expect(sourceLink).toBeVisible();

  // Verify href and attributes
  await expect(sourceLink).toHaveAttribute("href", "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC");
  await expect(sourceLink).toHaveAttribute("target", "_blank");
  await expect(sourceLink).toHaveAttribute("rel", "noopener noreferrer");
});

test('search input filters jobs by URL and ID', async ({ page }) => {
  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-111',
            url: 'https://open.spotify.com/track/alpha',
            status: 'Completed',
        completed_at: new Date(Date.now() - 1000).toISOString(),
            created_at: new Date(Date.now() - 2000).toISOString(),
            files: 1,
            error_log: null
          },
          {
            id: 'job-222',
            url: 'https://open.spotify.com/album/beta',
            status: 'Queued',
            created_at: new Date(Date.now() - 1000).toISOString(),
            files: 0,
            error_log: null
          }
        ])
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');

  // Wait for initial jobs to load
  await expect(page.locator('.job-card')).toHaveCount(2);

  // Search by URL substring
  await page.fill('#job-search-input', 'alpha');
  await expect(page.locator('.job-card')).toHaveCount(1);
  await expect(page.locator('.job-card').first()).toContainText('alpha');

  // Search by ID substring
  await page.fill('#job-search-input', '222');
  await expect(page.locator('.job-card')).toHaveCount(1);
  await expect(page.locator('.job-card').first()).toContainText('beta');

  // Search with no matches
  await page.fill('#job-search-input', 'nonexistent');
  await expect(page.locator('.job-card')).toHaveCount(0);
  await expect(page.locator('.empty-state')).toContainText('No jobs match the search query.');

  // Clear search
  await page.fill('#job-search-input', '');
  await expect(page.locator('.job-card')).toHaveCount(2);
});

test('renders audio player for audio files', async ({ page }) => {
  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-audio',
            url: 'https://open.spotify.com/track/audio1',
            status: 'Completed',
        completed_at: new Date(Date.now() - 1000).toISOString(),
            created_at: new Date().toISOString(),
            files: 2,
            error_log: null
          }
        ])
      });
    } else {
      await route.fallback();
    }
  });

  await page.route('/api/jobs/job-audio/files', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: ['song.flac', 'cover.jpg']
        })
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');

  const jobCard = page.locator('.job-card[data-job-id="job-audio"]');
  await expect(jobCard).toBeVisible();

  const viewFilesBtn = jobCard.locator('button.view-files-btn');
  await expect(viewFilesBtn).toBeVisible();
  await viewFilesBtn.click();

  const filesContainer = page.locator('#files-container-job-audio');
  await expect(filesContainer).toBeVisible();

  // The flac file should have an audio element
  const audioEl = filesContainer.locator('audio[src="/api/jobs/job-audio/files/song.flac"]');
  await expect(audioEl).toBeVisible();

  // The jpg file should not have an audio element
  const nonAudioCount = await filesContainer.locator('audio[src="/api/jobs/job-audio/files/cover.jpg"]').count();
  expect(nonAudioCount).toBe(0);
});

test('manual log refresh button updates logs', async ({ page }) => {
  let logCalls = 0;

  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-refresh-logs',
            url: 'https://open.spotify.com/track/refresh-logs',
            status: 'Running',
            created_at: new Date().toISOString(),
            files: 0,
            error_log: null
          }
        ])
      });
    } else {
      await route.fallback();
    }
  });

  await page.route('/api/jobs/job-refresh-logs/log', async (route) => {
    logCalls++;
    if (logCalls === 1) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ log: 'Log line 1' })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ log: 'Log line 1\nLog line 2' })
      });
    }
  });

  await page.goto('/');

  const jobCard = page.locator('.job-card[data-job-id="job-refresh-logs"]');
  await expect(jobCard).toBeVisible();

  // Click View Logs
  const viewLogsBtn = jobCard.locator('button.view-logs-btn');
  await expect(viewLogsBtn).toBeVisible();
  await viewLogsBtn.click();

  const logsContainer = page.locator('#logs-container-job-refresh-logs');
  await expect(logsContainer).toBeVisible();

  const logsContent = logsContainer.locator('#logs-content-job-refresh-logs');
  await expect(logsContent).toHaveText('Log line 1');

  // Click Refresh Logs
  const refreshLogsBtn = logsContainer.locator('button.refresh-logs-btn');
  await expect(refreshLogsBtn).toBeVisible();
  await refreshLogsBtn.click();

  // Verify updated logs
  await expect(logsContent).toHaveText('Log line 1\nLog line 2');
});

test("filters jobs by type", async ({ page }) => {
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "101",
            url: "https://open.spotify.com/album/1ATL5GLyefJaxhQzSPVrLX",
            status: "Completed",
            created_at: new Date().toISOString(),
            files: 10,
            error_log: null
          },
          {
            id: "102",
            url: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
            status: "Queued",
            created_at: new Date().toISOString(),
            files: 0,
            error_log: null
          },
          {
            id: "103",
            url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
            status: "Running",
            created_at: new Date().toISOString(),
            files: 0,
            error_log: null
          }
        ]),
      });
    } else {
        await route.continue();
    }
  });

  await page.goto("http://127.0.0.1:3000");

  // Initially, all jobs should be visible
  await expect(page.locator('.job-card')).toHaveCount(3);

  // Filter by Album
  await page.selectOption('#job-type-filter', 'Album');
  await expect(page.locator('.job-card')).toHaveCount(1);
  await expect(page.locator('.job-card').first()).toContainText('album');

  // Filter by Track
  await page.selectOption('#job-type-filter', 'Track');
  await expect(page.locator('.job-card')).toHaveCount(1);
  await expect(page.locator('.job-card').first()).toContainText('track');

  // Filter by Playlist
  await page.selectOption('#job-type-filter', 'Playlist');
  await expect(page.locator('.job-card')).toHaveCount(1);
  await expect(page.locator('.job-card').first()).toContainText('playlist');

  // Filter back to All Types
  await page.selectOption('#job-type-filter', 'All Types');
  await expect(page.locator('.job-card')).toHaveCount(3);
});

test('cancel all queued jobs', async ({ page }) => {
  let cancelCalled = false;

  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-queued',
            url: 'https://open.spotify.com/track/queued-track',
            status: 'Queued',
            created_at: new Date().toISOString(),
            files: 0,
            error_log: null
          }
        ])
      });
    } else {
      await route.fallback();
    }
  });

  await page.route('/api/jobs/cancel-queued', async (route) => {
    if (route.request().method() === 'POST') {
      cancelCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', cancelled: 1 })
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');

  // Wait for the job card to load
  await expect(page.locator('.job-card')).toHaveCount(1);

  const cancelAllQueuedBtn = page.locator('#cancel-all-queued-btn');
  await expect(cancelAllQueuedBtn).toBeVisible();

  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  await cancelAllQueuedBtn.click();

  // Give it a moment to call the API
  await page.waitForTimeout(500);

  expect(cancelCalled).toBe(true);
});

test('retry all cancelled jobs', async ({ page }) => {
  let retryCalled = false;
  let retriedUrl = '';

  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-cancelled',
            url: 'https://open.spotify.com/track/cancelled-track',
            status: 'Cancelled',
            created_at: new Date().toISOString(),
            files: 0,
            error_log: null
          }
        ])
      });
    } else if (route.request().method() === 'POST') {
      retryCalled = true;
      const postData = JSON.parse(route.request().postData() || '{}');
      retriedUrl = postData.url;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ job_id: 'new-job-id' })
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');

  // Wait for the job card to load
  await expect(page.locator('.job-card')).toHaveCount(1);

  const retryCancelledBtn = page.locator('#retry-cancelled-btn');
  await expect(retryCancelledBtn).toBeVisible();

  await retryCancelledBtn.click();

  // Give it a moment to call the API
  await page.waitForTimeout(500);

  expect(retryCalled).toBe(true);
  expect(retriedUrl).toBe('https://open.spotify.com/track/cancelled-track');
});

test('can retry all failed jobs', async ({ page }) => {
  let retryCalled = false;
  let retriedUrl = '';

  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-failed',
            url: 'https://open.spotify.com/track/failed-track',
            status: 'Failed',
            created_at: new Date().toISOString(),
            files: 0,
            error_log: 'Test error log'
          }
        ])
      });
    } else if (route.request().method() === 'POST') {
      retryCalled = true;
      const postData = JSON.parse(route.request().postData() || '{}');
      retriedUrl = postData.url;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ job_id: 'new-job-id' })
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');

  // Wait for the job card to load
  await expect(page.locator('.job-card')).toHaveCount(1);

  const retryFailedBtn = page.locator('#retry-failed-btn');
  await expect(retryFailedBtn).toBeVisible();

  await retryFailedBtn.click();

  // Give it a moment to call the API
  await page.waitForTimeout(500);

  expect(retryCalled).toBe(true);
  expect(retriedUrl).toBe('https://open.spotify.com/track/failed-track');
});


test('can queue an album URL', async ({ page }) => {
  let queuedUrl = '';

  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'POST') {
      const postData = JSON.parse(route.request().postData() || '{}');
      queuedUrl = postData.url;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ job_id: 'new-job-id-album' })
      });
    } else if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');

  const input = page.locator('#spotify-url');
  await input.fill('https://open.spotify.com/album/123');

  const queueBtn = page.locator('button[type="submit"]');
  await queueBtn.click();

  // Wait for the feedback to indicate success
  const feedback = page.locator('#queue-feedback');
  await expect(feedback).toContainText('Successfully queued 1 job.');

  expect(queuedUrl).toBe('https://open.spotify.com/album/123');
});

test('can queue multiple comma-separated URLs', async ({ page }) => {
  let queuedUrls = [];

  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'POST') {
      const postData = JSON.parse(route.request().postData() || '{}');
      queuedUrls.push(postData.url);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ job_id: 'new-job-id-' + Math.random() })
      });
    } else if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');

  const input = page.locator('#spotify-url');
  await input.fill('https://open.spotify.com/track/1, https://open.spotify.com/track/2,https://open.spotify.com/track/3');

  const queueBtn = page.locator('button[type="submit"]');
  await queueBtn.click();

  // Wait for the feedback to indicate success
  const feedback = page.locator('#queue-feedback');
  await expect(feedback).toContainText('Successfully queued 3 jobs.');

  expect(queuedUrls).toHaveLength(3);
  expect(queuedUrls).toContain('https://open.spotify.com/track/1');
  expect(queuedUrls).toContain('https://open.spotify.com/track/2');
  expect(queuedUrls).toContain('https://open.spotify.com/track/3');
});

test("can clear input field manually", async ({ page }) => {
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([])
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto("/");

  const input = page.locator("#spotify-url");
  const clearBtn = page.locator("#clear-input-btn");

  await expect(clearBtn).toBeHidden();

  await input.fill("https://open.spotify.com/track/123");
  await expect(input).toHaveValue("https://open.spotify.com/track/123");
  await expect(clearBtn).toBeVisible();

  await clearBtn.click();

  await expect(input).toHaveValue("");
  await expect(clearBtn).toBeHidden();

  const feedback = page.locator("#queue-feedback");
  await expect(feedback).toContainText("Tracks, albums, playlists, and artists will run through the SpotiFLAC module.");
});

test('can retry an individual failed job from its card', async ({ page }) => {
  let retryCalled = false;
  let retriedUrl = '';

  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-failed-single',
            url: 'https://open.spotify.com/track/failed-single',
            status: 'Failed',
            created_at: new Date().toISOString(),
            files: 0,
            error_log: 'Single job error'
          }
        ])
      });
    } else if (route.request().method() === 'POST') {
      retryCalled = true;
      const postData = JSON.parse(route.request().postData() || '{}');
      retriedUrl = postData.url;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ job_id: 'new-job-id-single' })
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/');

  const jobCard = page.locator('.job-card[data-job-id="job-failed-single"]');
  await expect(jobCard).toBeVisible();

  const retryBtn = jobCard.getByRole("button", { name: "Retry", exact: true });
  await expect(retryBtn).toBeVisible();

  const requestPromise = page.waitForRequest('/api/jobs');
  await retryBtn.click();
  await requestPromise;

  expect(retryCalled).toBe(true);
  expect(retriedUrl).toBe('https://open.spotify.com/track/failed-single');
});

test('sorts jobs by newest and oldest', async ({ page }) => {
  // Override the GET /api/jobs route for this specific test
  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: "job-oldest",
            url: "https://open.spotify.com/track/old",
            status: "Completed",
            created_at: "2023-01-01T00:00:00Z",
            files: 1,
            error_log: null
          },
          {
            id: "job-newest",
            url: "https://open.spotify.com/track/new",
            status: "Completed",
            created_at: "2023-12-31T23:59:59Z",
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

  // Actually wait for it to be visible first
  await expect(page.locator('.job-card').first()).toBeVisible();

  // Re-fetch since UI updates async
  await expect(page.locator('.job-card').first().locator('.source-link')).toHaveText("https://open.spotify.com/track/new");

  // Change sort to oldest
  await page.selectOption('#job-sort-select', 'oldest');

  // Verify the first job is now the oldest
  await expect(page.locator('.job-card').first().locator('.source-link')).toHaveText("https://open.spotify.com/track/old");
});

test('can retry all running jobs', async ({ page }) => {
  let deleteCalled = false;
  let retryCalled = false;
  let retriedUrl = '';

  await page.route('/api/jobs', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-running',
            url: 'https://open.spotify.com/track/running-track',
            status: 'Running',
            created_at: new Date().toISOString(),
            files: 0,
            error_log: null
          }
        ])
      });
    } else if (route.request().method() === 'POST') {
      retryCalled = true;
      const postData = JSON.parse(route.request().postData() || '{}');
      retriedUrl = postData.url;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ job_id: 'new-job-id' })
      });
    } else {
      await route.fallback();
    }
  });

  await page.route('/api/jobs/job-running', async (route) => {
    if (route.request().method() === 'DELETE') {
      deleteCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success' })
      });
    } else {
      await route.fallback();
    }
  });

  await page.route('/api/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ total_jobs: 1, total_files: 0, success_rate: 0 })
    });
  });

  await page.goto('/');

  // Wait for the job card to load
  await expect(page.locator('.job-card')).toHaveCount(1);

  const retryRunningBtn = page.locator('#retry-running-btn');
  await expect(retryRunningBtn).toBeVisible();

  await retryRunningBtn.click();

  // Give it a moment to call the API
  await page.waitForTimeout(500);

  expect(deleteCalled).toBe(true);
  expect(retryCalled).toBe(true);
  expect(retriedUrl).toBe('https://open.spotify.com/track/running-track');
});

test('can queue an artist URL and filter by Artist type', async ({ page }) => {
  let requestMade = false;
  let requestUrl = '';

  await page.route('**/api/jobs*', async (route) => {
    if (route.request().method() === 'POST') {
      requestMade = true;
      const body = JSON.parse(route.request().postData());
      requestUrl = body.url;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          url: body.url,
          status: 'Queued',
          created_at: new Date().toISOString(),
          files: 0,
          error_log: null
        })
      });
    } else if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ total_jobs: 0, total_files: 0, success_rate: 0 })
    });
  });

  await page.goto('/');

  // Verify Artist filter option
  const typeFilter = page.locator('#job-type-filter');
  await expect(typeFilter).toBeVisible();
  const options = await typeFilter.locator('option').allTextContents();
  expect(options).toContain('Artist');

  // Fill and queue artist URL
  const artistUrl = 'https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg';
  await page.fill('[name="spotify-url"]', artistUrl);

  // Set up request listener before clicking
  const requestPromise = page.waitForRequest(req => req.url().includes('/api/jobs') && req.method() === 'POST');
  await page.click('button[type="submit"]');

  // Wait for the request to be made
  const request = await requestPromise;

  await page.waitForTimeout(100);

  expect(request.method()).toBe('POST');
  expect(requestMade).toBe(true);
  expect(requestUrl).toBe(artistUrl);
});

test('can re-queue a completed job', async ({ page }) => {
  let retryCalled = false;
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "123",
            url: "https://open.spotify.com/track/123",
            status: "Completed",
            created_at: new Date().toISOString(),
            files: 1,
            error_log: null
          }
        ])
      });
    } else if (route.request().method() === "POST") {
      retryCalled = true;
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "124",
          url: body.url,
          status: "Queued",
          created_at: new Date().toISOString(),
          files: 0,
          error_log: null
        })
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto("/");

  // Wait for the completed job card to appear
  const jobCard = page.locator(".job-card").filter({ hasText: "Completed" });
  await expect(jobCard).toBeVisible();

  // Find the Re-queue button and verify it's visible
  const requeueBtn = jobCard.getByRole("button", { name: "Re-queue" });
  await expect(requeueBtn).toBeVisible();

  // Click the button
  await requeueBtn.click();

  // Give the UI a moment to call the API
  await page.waitForTimeout(500);

  // Assert the POST /api/jobs route was called
  expect(retryCalled).toBe(true);
});
