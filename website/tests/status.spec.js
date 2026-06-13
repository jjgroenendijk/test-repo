import { test, expect } from "@playwright/test";

test.describe("Connection Status Indicator", () => {
  test("shows online status when health endpoint is successful", async ({ page }) => {
    // Mock health check and background endpoints
    await page.route("**/api/health", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });
    await page.route("**/api/jobs", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/system/storage", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total: 100, used: 10, free: 90 }),
      });
    });
    await page.route("**/api/stats", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total_jobs: 0, total_files: 0, success_rate: 0 }),
      });
    });

    await page.goto("/");

    const statusContainer = page.locator("#connection-status");
    await expect(statusContainer).toBeVisible();
    await expect(statusContainer).toHaveClass(/status-online/);
    await expect(statusContainer.locator(".status-text")).toHaveText("Online");
  });

  test("shows offline status when health endpoint fails", async ({ page }) => {
    // Mock health check to fail
    await page.route("**/api/health", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });
    // Mock other endpoints
    await page.route("**/api/jobs", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/system/storage", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total: 100, used: 10, free: 90 }),
      });
    });
    await page.route("**/api/stats", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total_jobs: 0, total_files: 0, success_rate: 0 }),
      });
    });

    await page.goto("/");

    const statusContainer = page.locator("#connection-status");
    await expect(statusContainer).toBeVisible();
    await expect(statusContainer).toHaveClass(/status-offline/);
    await expect(statusContainer.locator(".status-text")).toHaveText("Offline");
  });
});
