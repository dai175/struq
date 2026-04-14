import { expect, test } from "@playwright/test";

test("/ redirects unauthenticated user to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("/login shows Struq title and Google login button", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("h1")).toHaveText("Struq");
  await expect(page.locator('a[href="/api/auth/google"]')).toBeVisible();
});
