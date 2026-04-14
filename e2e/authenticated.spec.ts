import { expect, test } from "@playwright/test";

test("authenticated user can access /setlists", async ({ page }) => {
  await page.goto("/setlists");
  await expect(page).toHaveURL(/\/setlists/);
});

test("authenticated user can access /songs", async ({ page }) => {
  await page.goto("/songs");
  await expect(page).toHaveURL(/\/songs/);
});
