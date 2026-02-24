import { expect, test } from "@playwright/test";

test("selects resolution and submits download", async ({ page }) => {
  // Mock the API to capture the request
  let capturedRequest: any = null;
  await page.route("/api/downloads", async (route) => {
    if (route.request().method() === "POST") {
      capturedRequest = await route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          record: {
            id: "test-id",
            createdAt: new Date().toISOString(),
            url: "https://example.com/watch?v=resolution",
            mode: "video",
            resolution: "1080p",
            includePlaylist: false,
            status: "completed",
            files: [],
            logTail: "Test log",
          },
        }),
      });
    } else if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          records: [
            {
              id: "test-id",
              createdAt: new Date().toISOString(),
              url: "https://example.com/watch?v=resolution",
              mode: "video",
              resolution: "1080p",
              includePlaylist: false,
              status: "completed",
              files: [],
              logTail: "Test log",
            },
          ],
          storageUsage: 1024,
        }),
      });
    } else {
      await route.continue();
    }
  });

  await page.goto("/");

  // Fill in the form
  await page.getByLabel("Video URL").fill("https://example.com/watch?v=resolution");

  // Select Video mode (should be default)
  await expect(page.getByLabel("Mode")).toHaveValue("video");

  // Select Resolution
  await page.getByLabel("Resolution Limit").selectOption("1080p");

  // Submit
  await page.getByRole("button", { name: "Download and Archive" }).click();

  // Verify the request
  expect(capturedRequest).toBeTruthy();
  expect(capturedRequest.url).toBe("https://example.com/watch?v=resolution");
  expect(capturedRequest.mode).toBe("video");
  expect(capturedRequest.resolution).toBe("1080p");

  // Verify the history item displays the resolution
  await expect(page.getByTestId("history-list")).toContainText("video (1080p)");
});
