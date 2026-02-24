import { test, expect } from "@playwright/test";

test("selects resolution and submits download request", async ({ page }) => {
  let requestBody: Record<string, unknown> | null = null;
  const postedRecord = {
    id: "run-res-1",
    createdAt: "2026-02-08T10:00:00.000Z",
    url: "https://example.com/watch?v=res123",
    mode: "video",
    includePlaylist: false,
    resolution: "1080p",
    status: "completed",
    files: ["creator/2026-02-08/video-1080p.mp4"],
    logTail: "done",
  };

  await page.route("**/api/downloads", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ records: requestBody ? [postedRecord] : [] }),
      });
      return;
    }

    if (method === "POST") {
      requestBody = JSON.parse(route.request().postData() ?? "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          record: postedRecord,
        }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/");
  await page.getByLabel("Video URL").fill("https://example.com/watch?v=res123");
  await page.getByLabel("Mode").selectOption("video"); // Ensure video mode is selected to see resolution
  await page.getByLabel("Resolution Limit").selectOption("1080p");
  await page.getByRole("button", { name: "Download and Archive" }).click();

  await expect(page.getByTestId("status-text")).toHaveText("Download complete.");
  await expect(page.getByTestId("history-list")).toContainText("creator/2026-02-08/video-1080p.mp4");

  expect(requestBody).toEqual({
    url: "https://example.com/watch?v=res123",
    mode: "video",
    includePlaylist: false,
    resolution: "1080p",
  });
});

test("hides resolution dropdown when audio mode is selected", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Resolution Limit")).toBeVisible();

  await page.getByLabel("Mode").selectOption("audio");
  await expect(page.getByLabel("Resolution Limit")).toBeHidden();

  await page.getByLabel("Mode").selectOption("video");
  await expect(page.getByLabel("Resolution Limit")).toBeVisible();
});
