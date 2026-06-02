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

test("shows confirmation dialog and cancels all queued jobs when accepted", async ({ page }) => {
  const cancelAllQueuedBtn = page.locator("#cancel-all-queued-btn");

  await expect(cancelAllQueuedBtn).toBeVisible();

  let dialogTriggered = false;
  let apiCallMade = false;

  // Handle dialog: automatically accept it
  page.on("dialog", async (dialog) => {
    expect(dialog.message()).toBe("Are you sure you want to cancel all queued jobs? This cannot be undone.");
    dialogTriggered = true;
    await dialog.accept();
  });

  // Mock the cancel API call
  await page.route("**/api/jobs/cancel-queued", async (route) => {
    if (route.request().method() === "POST") {
      apiCallMade = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success", cancelled: 1 }),
      });
    } else {
      await route.continue();
    }
  });

  await cancelAllQueuedBtn.click();

  // Give the UI time to process the click and the fetch request
  await page.waitForTimeout(100);

  expect(dialogTriggered).toBe(true);
  expect(apiCallMade).toBe(true);
});

test("shows confirmation dialog and does not cancel all queued jobs when dismissed", async ({ page }) => {
  const cancelAllQueuedBtn = page.locator("#cancel-all-queued-btn");

  await expect(cancelAllQueuedBtn).toBeVisible();

  let dialogTriggered = false;
  let apiCallMade = false;

  // Handle dialog: automatically dismiss it
  page.on("dialog", async (dialog) => {
    expect(dialog.message()).toBe("Are you sure you want to cancel all queued jobs? This cannot be undone.");
    dialogTriggered = true;
    await dialog.dismiss();
  });

  // Intercept the cancel API call to ensure it's NOT made
  await page.route("**/api/jobs/cancel-queued", async (route) => {
    if (route.request().method() === "POST") {
      apiCallMade = true;
      await route.abort();
    } else {
      await route.continue();
    }
  });

  await cancelAllQueuedBtn.click();

  // Give the UI time to process
  await page.waitForTimeout(100);

  expect(dialogTriggered).toBe(true);
  expect(apiCallMade).toBe(false);
});
