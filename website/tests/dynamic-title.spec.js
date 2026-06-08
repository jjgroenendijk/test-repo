import { test, expect } from "@playwright/test";

test.describe("Dynamic Page Title", () => {
  test.beforeEach(async ({ page }) => {
    // Mock unrelated endpoints
    await page.route("**/api/stats*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total_jobs: 0, total_files: 0, success_rate: 0 }),
      });
    });

    await page.route("**/api/system/storage*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total: 1000, used: 500, free: 500 }),
      });
    });
  });

  test("shows active job count in title when jobs are running or queued", async ({ page }) => {
    await page.route("**/api/jobs*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "1", status: "Running", url: "https://open.spotify.com/track/1" },
            { id: "2", status: "Queued", url: "https://open.spotify.com/track/2" },
            { id: "3", status: "Completed", url: "https://open.spotify.com/track/3" }
          ]),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto("/");
    await expect(page).toHaveTitle("(2) SpotiFLAC");
  });

  test("shows default title when no jobs are active", async ({ page }) => {
    await page.route("**/api/jobs*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "3", status: "Completed", url: "https://open.spotify.com/track/3" },
            { id: "4", status: "Failed", url: "https://open.spotify.com/track/4" }
          ]),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto("/");
    await expect(page).toHaveTitle("SpotiFLAC");
  });

  test("updates title dynamically when job statuses change", async ({ page }) => {
    let callCount = 0;
    await page.route("**/api/jobs*", async (route) => {
      if (route.request().method() === "GET") {
        callCount++;
        if (callCount === 1) {
          // Initial state: 1 running job
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([
              { id: "1", status: "Running", url: "https://open.spotify.com/track/1" }
            ]),
          });
        } else {
          // Second state: 0 active jobs
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([
              { id: "1", status: "Completed", url: "https://open.spotify.com/track/1" }
            ]),
          });
        }
      } else {
        await route.fallback();
      }
    });

    await page.goto("/");
    await expect(page).toHaveTitle("(1) SpotiFLAC");

    // Click refresh to trigger a second fetch and update
    const refreshBtn = page.getByRole("button", { name: "Refresh jobs" });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    await expect(page).toHaveTitle("SpotiFLAC");
  });
});
