import { test, expect } from "@playwright/test";

test("submits a download with a specific resolution and displays history", async ({ page }) => {
  let requestBody: Record<string, unknown> | null = null;
  const postedRecord = {
    id: "run-2",
    createdAt: "2026-02-08T10:05:00.000Z",
    url: "https://example.com/watch?v=456",
    mode: "video",
    includePlaylist: false,
    resolution: "720p",
    status: "completed",
    files: ["creator/2026-02-08/example-video.mp4"],
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

    requestBody = JSON.parse(route.request().postData() ?? "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        record: postedRecord,
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Video URL").fill("https://example.com/watch?v=456");

  // Make sure we are in video mode
  await page.getByLabel("Mode").selectOption("video");

  // The resolution dropdown should be visible now
  await expect(page.getByLabel("Max Resolution")).toBeVisible();

  // Select HD (720p)
  await page.getByLabel("Max Resolution").selectOption("720p");

  // Uncheck playlist
  await page.getByLabel("Download full playlist").uncheck();

  // Submit
  await page.getByRole("button", { name: "Download and Archive" }).click();

  await expect(page.getByTestId("status-text")).toHaveText("Download complete.");
  await expect(page.getByTestId("history-list")).toContainText("creator/2026-02-08/example-video.mp4");

  // Verify the resolution badge is displayed in the history list
  await expect(page.locator(".resolution-badge")).toHaveText("720p");

  expect(requestBody).toEqual({
    url: "https://example.com/watch?v=456",
    mode: "video",
    includePlaylist: false,
    resolution: "720p",
  });
});
