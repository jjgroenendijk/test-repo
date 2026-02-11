import { test, expect } from "@playwright/test";

test("renders downloader dashboard", async ({ page }) => {
  await page.route("**/api/downloads", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ records: [], storageUsage: 123456789 }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/");

  await expect(page).toHaveTitle(/Jules YT-DLP Archive/);
  await expect(page.getByRole("heading", { name: "Video Archive Console" })).toBeVisible();
  await expect(page.getByLabel("Video URL")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download and Archive" })).toBeVisible();
  await expect(page.getByText("No downloads yet.")).toBeVisible();

  await expect(page.getByText("Storage Used")).toBeVisible();
  await expect(page.getByText("117.74 MB")).toBeVisible();
});

test("submits a download and displays history", async ({ page }) => {
  let requestBody: Record<string, unknown> | null = null;

  await page.route("**/api/downloads", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ records: [] }),
      });
      return;
    }

    requestBody = JSON.parse(route.request().postData() ?? "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        record: {
          id: "run-1",
          createdAt: "2026-02-08T10:00:00.000Z",
          url: "https://example.com/watch?v=123",
          mode: "audio",
          includePlaylist: true,
          status: "completed",
          files: ["creator/2026-02-08/example.mp3"],
          logTail: "done",
        },
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Video URL").fill("https://example.com/watch?v=123");
  await page.getByLabel("Mode").selectOption("audio");
  await page.getByLabel("Download full playlist").check();
  await page.getByRole("button", { name: "Download and Archive" }).click();

  await expect(page.getByTestId("status-text")).toHaveText("Download complete.");
  await expect(page.getByTestId("history-list")).toContainText("creator/2026-02-08/example.mp3");

  expect(requestBody).toEqual({
    url: "https://example.com/watch?v=123",
    mode: "audio",
    includePlaylist: true,
  });
});
