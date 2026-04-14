import { expect, test as setup } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate test user", async ({ request }) => {
  const response = await request.get("/api/auth/test-login");
  expect(response.ok()).toBeTruthy();

  // Save the authenticated state (cookies) for reuse
  await request.storageState({ path: authFile });
});
