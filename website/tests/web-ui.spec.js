import { expect, test } from "@playwright/test";

test("shows the SpotiFLAC queue shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "SpotiFLAC" })).toBeVisible();
  await expect(page.getByLabel("Spotify URL")).toBeVisible();
  await expect(page.getByText("/data", { exact: true })).toBeVisible();
});

test("validates supported Spotify URLs", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Spotify URL").fill("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M");
  await page.getByRole("button", { name: "Queue" }).click();

  await expect(page.getByText("Ready to queue playlist")).toBeVisible();
});
