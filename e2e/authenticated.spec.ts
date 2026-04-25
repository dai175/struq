import { expect, type Page, test } from "@playwright/test";

test("authenticated user can access /setlists", async ({ page }) => {
  await page.goto("/setlists");
  await expect(page).toHaveURL(/\/setlists/);
});

test("authenticated user can access /songs", async ({ page }) => {
  await page.goto("/songs");
  await expect(page).toHaveURL(/\/songs/);
});

function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

async function createSong(page: Page, title: string): Promise<string> {
  await page.goto("/songs/new");
  await page.getByLabel("Title").first().fill(title);
  await page.getByLabel("Artist").first().fill("E2E Artist");
  await page
    .getByRole("button", { name: /create song/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/songs\/[0-9a-f-]+$/);
  const id = page.url().match(/\/songs\/([0-9a-f-]+)$/)?.[1];
  if (!id) throw new Error("Failed to extract song id from URL");
  return id;
}

async function createSetlistWithSong(page: Page, title: string, songTitle: string): Promise<string> {
  await page.goto("/setlists/new");
  await page.getByLabel("Title").first().fill(title);
  await page
    .getByRole("button", { name: /add song from library/i })
    .first()
    .click();

  const dialog = page.getByRole("dialog", { name: /add song/i });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: songTitle, exact: false }).first().click();
  await dialog.getByRole("button", { name: /close/i }).click();

  await page
    .getByRole("button", { name: /create setlist/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/setlists\/[0-9a-f-]+$/);
  const id = page.url().match(/\/setlists\/([0-9a-f-]+)$/)?.[1];
  if (!id) throw new Error("Failed to extract setlist id from URL");
  return id;
}

test("can create and search a song", async ({ page }) => {
  const songTitle = uniqueName("E2E Song");
  await createSong(page, songTitle);

  await page.goto("/songs");
  await page
    .getByPlaceholder(/search by title or artist/i)
    .first()
    .fill(songTitle);
  await expect(page.getByText(songTitle).first()).toBeVisible();
});

test("can create setlist with song from library", async ({ page }) => {
  const songTitle = uniqueName("E2E Song Setlist");
  const setlistTitle = uniqueName("E2E Setlist");

  await createSong(page, songTitle);
  const setlistId = await createSetlistWithSong(page, setlistTitle, songTitle);

  await page.goto(`/setlists/${setlistId}`);
  await expect(page.getByText(songTitle).first()).toBeVisible();
});

test("deleting a song removes it from existing setlist", async ({ page }) => {
  const songTitle = uniqueName("E2E Song Cascade");
  const setlistTitle = uniqueName("E2E Setlist Cascade");

  const songId = await createSong(page, songTitle);
  const setlistId = await createSetlistWithSong(page, setlistTitle, songTitle);

  await page.goto(`/songs/${songId}`);
  await page
    .getByRole("button", { name: /delete song/i })
    .first()
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: /^delete$/i })
    .click();
  await expect(page).toHaveURL(/\/songs$/);

  await page.goto(`/setlists/${setlistId}`);
  await expect(page.getByText(/no songs in this setlist/i)).toBeVisible();
});
