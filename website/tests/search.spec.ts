import { test, expect } from "@playwright/test";

test("filters history based on search query", async ({ page }) => {
  const records = [
    {
      id: "run-1",
      createdAt: "2026-02-08T10:00:00.000Z",
      url: "https://example.com/watch?v=111",
      mode: "video",
      includePlaylist: false,
      status: "completed",
      files: ["creator/2026-02-08/video1.mp4"],
      logTail: "done",
    },
    {
      id: "run-2",
      createdAt: "2026-02-08T11:00:00.000Z",
      url: "https://example.com/watch?v=222",
      mode: "audio",
      includePlaylist: false,
      status: "completed",
      customFilename: "MyAudioTrack",
      files: ["creator/2026-02-08/MyAudioTrack.mp3"],
      logTail: "done",
    },
    {
      id: "run-3",
      createdAt: "2026-02-08T12:00:00.000Z",
      url: "https://example.com/watch?v=333",
      mode: "video",
      includePlaylist: false,
      status: "failed",
      files: [],
      logTail: "error",
    },
  ];

  await page.route("**/api/downloads", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ records, storageUsage: 0 }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/");

  // Verify all are present initially
  await expect(page.getByTestId("history-list")).toContainText("https://example.com/watch?v=111");
  await expect(page.getByTestId("history-list")).toContainText("https://example.com/watch?v=222");
  await expect(page.getByTestId("history-list")).toContainText("https://example.com/watch?v=333");

  // Search by URL
  await page.getByTestId("search-input").fill("v=111");
  await expect(page.getByTestId("history-list")).toContainText("https://example.com/watch?v=111");
  await expect(page.getByTestId("history-list")).not.toContainText("https://example.com/watch?v=222");
  await expect(page.getByTestId("history-list")).not.toContainText("https://example.com/watch?v=333");

  // Search by custom filename
  await page.getByTestId("search-input").fill("MyAudioTrack");
  await expect(page.getByTestId("history-list")).not.toContainText("https://example.com/watch?v=111");
  await expect(page.getByTestId("history-list")).toContainText("https://example.com/watch?v=222");
  await expect(page.getByTestId("history-list")).not.toContainText("https://example.com/watch?v=333");

  // Search by status
  await page.getByTestId("search-input").fill("failed");
  await expect(page.getByTestId("history-list")).not.toContainText("https://example.com/watch?v=111");
  await expect(page.getByTestId("history-list")).not.toContainText("https://example.com/watch?v=222");
  await expect(page.getByTestId("history-list")).toContainText("https://example.com/watch?v=333");

  // Search by something not present
  await page.getByTestId("search-input").fill("nonexistent");
  await expect(page.getByText("No matches found.")).toBeVisible();
  await expect(page.getByTestId("history-list")).not.toBeVisible();
});
