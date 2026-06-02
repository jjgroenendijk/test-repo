import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Mock the /api/jobs GET request using wildcard pattern
  await page.route("**/api/jobs*", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "job-123",
            url: "https://open.spotify.com/album/1ATL5GLyefJaxhQzSPVrLX",
            status: "Completed",
            created_at: new Date().toISOString(),
            files: 10,
            error_log: null
          },
          {
            id: "job-456",
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
});

test("shows clear search button when typing and clears input when clicked", async ({ page }) => {
  const searchInput = page.locator("#job-search-input");
  const clearSearchBtn = page.locator("#clear-search-btn");

  // Ensure button is initially hidden
  await expect(clearSearchBtn).not.toBeVisible();

  // Type into search input
  await searchInput.fill("job-123");

  // Wait for fetchJobs debounce
  await page.waitForTimeout(350);

  // Verify button becomes visible
  await expect(clearSearchBtn).toBeVisible();

  // Verify jobs list filters based on search
  await expect(page.locator('.job-card')).toHaveCount(1);
  await expect(page.locator('.job-card').first()).toHaveAttribute("data-job-id", "job-123");

  // Click the clear button
  await clearSearchBtn.click();

  // Wait for fetchJobs
  await page.waitForTimeout(350);

  // Verify the input is cleared
  await expect(searchInput).toHaveValue("");

  // Verify button becomes hidden again
  await expect(clearSearchBtn).not.toBeVisible();

  // Verify jobs list resets
  await expect(page.locator('.job-card')).toHaveCount(2);
});
