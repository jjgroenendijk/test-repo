import { expect, test } from "@playwright/test";

test("resolution dropdown visibility and submission", async ({ page }) => {
  await page.route("/api/downloads", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          record: {
            id: "mock-id",
            createdAt: new Date().toISOString(),
            url: body.url,
            mode: body.mode,
            includePlaylist: body.includePlaylist,
            resolution: body.resolution,
            status: "completed",
            files: [],
            logTail: "",
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ records: [], storageUsage: 0 }),
      });
    }
  });

  await page.goto("/");

  // Check default state (Video mode)
  await expect(page.getByLabel("Resolution Limit")).toBeVisible();

  // Switch to Audio
  await page.getByLabel("Mode").selectOption("audio");
  await expect(page.getByLabel("Resolution Limit")).toBeHidden();

  // Switch back to Video
  await page.getByLabel("Mode").selectOption("video");
  await expect(page.getByLabel("Resolution Limit")).toBeVisible();

  // Select 720p
  await page.getByLabel("Resolution Limit").selectOption("720p");
  await page.getByLabel("Video URL").fill("https://example.com/video");

  // Verify request
  const requestPromise = page.waitForRequest((request) =>
    request.url().includes("/api/downloads") && request.method() === "POST"
  );

  await page.getByRole("button", { name: "Download and Archive" }).click();

  const request = await requestPromise;
  const body = request.postDataJSON();

  expect(body.resolution).toBe("720p");
});
