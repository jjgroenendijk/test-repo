import { test, expect } from "@playwright/test";

test("renders reset placeholder", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Jules SpotiFLAC Reset/);
  await expect(page.getByRole("heading", { name: "Project Reset In Progress" })).toBeVisible();
  await expect(page.getByText("Legacy yt-dlp product code removed.")).toBeVisible();
  await expect(page.getByText("Jules bridge kept")).toBeVisible();
});
