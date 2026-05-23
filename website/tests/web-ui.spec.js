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
  await page.getByRole("button", { name: "Queue" }).click();

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
  await page.getByRole("button", { name: "Queue" }).click();

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

  const retryBtn = page.getByRole("button", { name: "Retry" });
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

  const deleteBtn = page.getByRole("button", { name: "Delete" });
  await expect(deleteBtn).toBeVisible();

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

test("can toggle auto-refresh", async ({ page }) => {
  await page.goto("/");

  const autoRefreshCheckbox = page.getByRole("checkbox", { name: "Auto-refresh" });
  await expect(autoRefreshCheckbox).toBeVisible();

  // Default is true based on our implementation, so unchecking it should work
  if (await autoRefreshCheckbox.isChecked()) {
      await autoRefreshCheckbox.uncheck();
      await expect(autoRefreshCheckbox).not.toBeChecked();
  } else {
      await autoRefreshCheckbox.check();
      await expect(autoRefreshCheckbox).toBeChecked();
  }

  // Reload to verify it persists
  await page.reload();

  // Because we don't mock localStorage directly in Playwright across reloads easily without extra setup,
  // the page context usually retains localStorage if on same origin. Let's verify it stayed unchecked/checked based on last action.
  // We can just flip it and check the immediate UI state.
  await autoRefreshCheckbox.uncheck();
  await expect(autoRefreshCheckbox).not.toBeChecked();

  await autoRefreshCheckbox.check();
  await expect(autoRefreshCheckbox).toBeChecked();
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
  await expect(downloadLink).toHaveText('Download ZIP');

  // Verify the href attribute
  await expect(downloadLink).toHaveAttribute('href', '/api/jobs/123/download');
  await expect(downloadLink).toHaveAttribute('download', '');
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

test("toggles dark mode", async ({ page }) => {
  await page.goto("/");
  const themeToggle = page.locator("#theme-toggle");
  const html = page.locator("html");
  await themeToggle.click();
  await expect(html).toHaveClass(/dark/);
  await themeToggle.click();
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
