import { test, expect } from "@playwright/test";

test("should delete a history item", async ({ page }) => {
  const mockRecord = {
    id: "test-id",
    createdAt: new Date().toISOString(),
    url: "https://example.com/video",
    mode: "video",
    includePlaylist: false,
    status: "completed",
    files: ["video.mp4"],
    logTail: "Done",
  };

  let getCount = 0;
  await page.route("/api/downloads", async (route) => {
    if (route.request().method() === "GET") {
      getCount++;
      if (getCount === 1) {
        await route.fulfill({
          json: {
            records: [mockRecord],
            storageUsage: 1024,
          },
        });
      } else {
        await route.fulfill({
          json: {
            records: [],
            storageUsage: 0,
          },
        });
      }
    } else {
      await route.continue();
    }
  });

  await page.route(`/api/downloads/${mockRecord.id}`, async (route) => {
    expect(route.request().method()).toBe("DELETE");
    await route.fulfill({
      status: 200,
      json: { success: true },
    });
  });

  await page.goto("/");

  // Check if item is present
  await expect(page.getByText("https://example.com/video")).toBeVisible();

  // Setup dialog handler
  page.on("dialog", (dialog) => dialog.accept());

  // Click delete
  await page.locator(".delete-btn").click();

  // Check if item is removed
  await expect(page.getByText("https://example.com/video")).not.toBeVisible();
  await expect(page.getByText("No downloads yet.")).toBeVisible();
});
