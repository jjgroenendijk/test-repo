import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Mock the /api/jobs GET request to return two jobs with different creation dates
  await page.route("/api/jobs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "older-job",
            url: "https://open.spotify.com/album/older",
            status: "Completed",
            created_at: new Date(Date.now() - 100000).toISOString(),
            files: 10,
            error_log: null
          },
          {
            id: "newer-job",
            url: "https://open.spotify.com/album/newer",
            status: "Completed",
            created_at: new Date().toISOString(),
            files: 10,
            error_log: null
          }
        ]),
      });
    } else {
        await route.continue();
    }
  });

  await page.route("/api/system/storage", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: 100, used: 10, free: 90 })
    });
  });
});

test("Sorts jobs by newest and oldest correctly", async ({ page }) => {
  await page.goto("/");

  // By default, it should be sorted newest first.
  const jobsBeforeSort = page.locator(".job-card");
  await expect(jobsBeforeSort).toHaveCount(2);

  const firstJobIdNewest = await jobsBeforeSort.nth(0).getAttribute("data-job-id");
  const secondJobIdNewest = await jobsBeforeSort.nth(1).getAttribute("data-job-id");
  expect(firstJobIdNewest).toBe("newer-job");
  expect(secondJobIdNewest).toBe("older-job");

  // Select Oldest First
  await page.locator("#job-sort-select").selectOption("oldest");

  // Wait for the re-render (which calls fetchJobs)
  // We can just wait for the DOM to update by checking the first job's ID
  await expect(page.locator(".job-card").nth(0)).toHaveAttribute("data-job-id", "older-job");

  // It should now be sorted oldest first.
  const firstJobIdOldest = await page.locator(".job-card").nth(0).getAttribute("data-job-id");
  const secondJobIdOldest = await page.locator(".job-card").nth(1).getAttribute("data-job-id");

  expect(firstJobIdOldest).toBe("older-job");
  expect(secondJobIdOldest).toBe("newer-job");
});
