import { test, expect } from "@playwright/test";

test("displays and submits resolution for video downloads", async ({ page }) => {
  let requestBody: Record<string, unknown> | null = null;
  const postedRecord = {
    id: "run-res",
    createdAt: "2026-02-08T10:00:00.000Z",
    url: "https://example.com/watch?v=123",
    mode: "video",
    includePlaylist: false,
    resolution: "1080p",
    status: "completed",
    files: ["creator/2026-02-08/example.mp4"],
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

  // Verify visibility logic
  await expect(page.getByLabel("Resolution")).toBeVisible();

  await page.getByLabel("Mode").selectOption("audio");
  await expect(page.getByLabel("Resolution")).toBeHidden();

  await page.getByLabel("Mode").selectOption("video");
  await expect(page.getByLabel("Resolution")).toBeVisible();

  // Submit form
  await page.getByLabel("Video URL").fill("https://example.com/watch?v=123");
  await page.getByLabel("Resolution").selectOption("1080p");
  await page.getByRole("button", { name: "Download and Archive" }).click();

  await expect(page.getByTestId("status-text")).toHaveText("Download complete.");
  await expect(page.getByTestId("history-list")).toContainText("1080p");

  expect(requestBody).toEqual({
    url: "https://example.com/watch?v=123",
    mode: "video",
    includePlaylist: false,
    resolution: "1080p",
  });
});
