import { expect, test } from "@playwright/test";

test("sends resolution limit in download request", async ({ page }) => {
  await page.route("/api/downloads", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: { records: [], storageUsage: 0 },
      });
    } else if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({
        url: "https://www.youtube.com/watch?v=123",
        mode: "video",
        resolution: "1080p",
        includePlaylist: false,
      });

      await route.fulfill({
        json: {
          record: {
            id: "test-id",
            createdAt: new Date().toISOString(),
            url: "https://www.youtube.com/watch?v=123",
            mode: "video",
            resolution: "1080p",
            includePlaylist: false,
            status: "completed",
            files: [],
            logTail: "done",
          },
        },
      });
    }
  });

  await page.goto("/");
  await page.fill("#video-url", "https://www.youtube.com/watch?v=123");

  // Select 1080p
  await page.selectOption("#resolution", "1080p");

  await page.click("button[type='submit']");

  await expect(page.getByText("Download complete.")).toBeVisible();
});
