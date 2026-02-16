import { test, expect } from "@playwright/test";

test.describe("Delete Record", () => {
  test("should delete a record from the history list", async ({ page }) => {
    let records = [
      {
        id: "rec1",
        createdAt: new Date().toISOString(),
        url: "http://example.com/video",
        mode: "video",
        includePlaylist: false,
        status: "completed",
        files: ["video.mp4"],
        logTail: "Success",
      },
    ];

    // Mock GET /api/downloads
    await page.route("/api/downloads", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          json: {
            records: records,
            storageUsage: 1000,
          },
        });
      } else {
        await route.continue();
      }
    });

    // Mock DELETE /api/downloads/rec1
    await page.route("/api/downloads/rec1", async (route) => {
      expect(route.request().method()).toBe("DELETE");
      records = []; // Update server state
      await route.fulfill({ status: 200, json: { success: true } });
    });

    // Handle dialog (confirm delete)
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/");

    // Check if record is present
    await expect(page.getByText("http://example.com/video")).toBeVisible();

    // Click Delete
    await page.getByRole("button", { name: "Delete" }).click();

    // Verify record is gone
    await expect(page.getByText("http://example.com/video")).toBeHidden();
  });
});
