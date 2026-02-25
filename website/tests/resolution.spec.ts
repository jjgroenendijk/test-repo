import { test, expect } from "@playwright/test";

test("selects resolution and submits download request", async ({ page }) => {
  let requestBody: Record<string, unknown> | null = null;
  const postedRecord = {
    id: "run-res-1",
    createdAt: "2026-02-08T12:00:00.000Z",
    url: "https://example.com/watch?v=res",
    mode: "video",
    resolution: "1080p",
    includePlaylist: false,
    status: "completed",
    files: [],
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

  // Check default resolution
  await expect(page.getByLabel("Resolution Limit")).toHaveValue("best");

  // Fill form
  await page.getByLabel("Video URL").fill("https://example.com/watch?v=res");
  await page.getByLabel("Resolution Limit").selectOption("1080p");
  await page.getByRole("button", { name: "Download and Archive" }).click();

  await expect(page.getByTestId("status-text")).toHaveText("Download complete.");

  // Check request body
  expect(requestBody).toEqual({
    url: "https://example.com/watch?v=res",
    mode: "video",
    resolution: "1080p",
    includePlaylist: false,
  });

  // Check history display
  await expect(page.getByTestId("history-list")).toContainText("1080p");
});

test("hides resolution dropdown in audio mode", async ({ page }) => {
  await page.route("**/api/downloads", async (route) => {
    if (route.request().method() === "GET") {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ records: [] }),
        });
    }
  });

  await page.goto("/");
  await expect(page.getByLabel("Resolution Limit")).toBeVisible();

  await page.getByLabel("Mode").selectOption("audio");
  await expect(page.getByLabel("Resolution Limit")).toBeHidden();

  await page.getByLabel("Mode").selectOption("video");
  await expect(page.getByLabel("Resolution Limit")).toBeVisible();
});
