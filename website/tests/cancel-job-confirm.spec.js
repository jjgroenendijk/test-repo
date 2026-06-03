import { test, expect } from "@playwright/test";

test("does not cancel job when confirmation is dismissed", async ({ page }) => {
  let deleteApiCalled = false;
  let dialogTriggered = false;

  // Mock initial GET to show one queued job
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

  // Handle dialog: dismiss it
  page.on("dialog", async (dialog) => {
    expect(dialog.message()).toBe("Are you sure you want to cancel this job?");
    dialogTriggered = true;
    await dialog.dismiss();
  });

  // Route intercept for DELETE api to verify it's not called
  await page.route("**/api/jobs/*", async (route) => {
    if (route.request().method() === "DELETE") {
      deleteApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success" })
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto("/");

  const cancelBtn = page.getByRole("button", { name: "Cancel", exact: true });
  await expect(cancelBtn).toBeVisible();

  await cancelBtn.click();

  // Wait a little bit to ensure API is not called
  await page.waitForTimeout(500);

  expect(dialogTriggered).toBe(true);
  expect(deleteApiCalled).toBe(false);

  // Button should remain in "Cancel" state
  await expect(cancelBtn).toHaveText("Cancel");
});
