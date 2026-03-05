import { test, expect } from "@playwright/test";

test.describe("Custom Filename selection", () => {
  test("allows selecting a custom filename, sends it in request, and displays badge", async ({ page }) => {
    // Mock the initial GET request for history load
    await page.route("/api/downloads", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            records: [],
            storageUsage: 0,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/");

    const urlInput = page.getByLabel("Video URL");
    await urlInput.fill("https://example.com/watch?v=custom-filename");

    const customFilenameInput = page.getByLabel("Custom Filename (Optional)");
    await expect(customFilenameInput).toBeVisible();
    await customFilenameInput.fill("MyAwesomeVideo.%(ext)s");

    // Intercept POST to verify payload and return mocked record with custom filename
    let interceptedRequestPayload: any = null;
    await page.route("/api/downloads", async (route) => {
      if (route.request().method() === "POST") {
        interceptedRequestPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            record: {
              id: "test-id",
              createdAt: new Date().toISOString(),
              url: "https://example.com/watch?v=custom-filename",
              mode: "video",
              includePlaylist: false,
              resolution: "best",
              customFilename: "MyAwesomeVideo.%(ext)s",
              status: "completed",
              files: ["MyAwesomeVideo.mp4"],
              logTail: "done",
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    const submitBtn = page.getByRole("button", { name: "Download and Archive" });
    await submitBtn.click();

    // Verify request payload
    expect(interceptedRequestPayload).not.toBeNull();
    expect(interceptedRequestPayload.customFilename).toBe("MyAwesomeVideo.%(ext)s");

    // Verify history rendering includes the custom filename badge
    const historyList = page.getByTestId("history-list");
    await expect(historyList).toBeVisible();

    const historyItems = historyList.locator("li.history-item");
    await expect(historyItems).toHaveCount(1);

    const customBadge = historyItems.first().locator(".custom-filename-badge");
    await expect(customBadge).toBeVisible();
    await expect(customBadge).toHaveText("Custom Name");
  });
});
