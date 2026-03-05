import { test, expect } from "@playwright/test";

test("submits a download with custom filename and displays the badge", async ({ page }) => {
  let requestBody: Record<string, unknown> | null = null;
  const postedRecord = {
    id: "run-cf",
    createdAt: "2026-02-09T10:00:00.000Z",
    url: "https://example.com/watch?v=cf",
    mode: "video",
    includePlaylist: false,
    resolution: "best",
    customFilename: "my_custom_name.mp4",
    status: "completed",
    files: ["my_custom_name.mp4"],
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
  await page.getByLabel("Video URL").fill("https://example.com/watch?v=cf");
  await page.getByLabel("Custom Filename (optional)").fill("my_custom_name.mp4");
  await page.getByRole("button", { name: "Download and Archive" }).click();

  await expect(page.getByTestId("status-text")).toHaveText("Download complete.");

  // Verify the payload sent to the backend includes customFilename
  expect(requestBody).toEqual({
    url: "https://example.com/watch?v=cf",
    mode: "video",
    includePlaylist: false,
    resolution: "best",
    customFilename: "my_custom_name.mp4",
  });

  // Verify the custom filename badge is displayed in the history
  await expect(page.locator(".custom-filename-badge")).toHaveText("Format");
  await expect(page.getByTestId("history-list")).toContainText("my_custom_name.mp4");
});
