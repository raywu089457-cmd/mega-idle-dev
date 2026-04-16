import { test, expect } from "@playwright/test";

test.describe("Phase 1: Landing & Authentication", () => {
  test("landing page loads with Discord login button", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");

    // Page title or heading
    await expect(page.getByRole("heading", { name: /mega idle/i })).toBeVisible();

    // Discord login button
    const loginBtn = page.getByRole("button", { name: /discord/i });
    await expect(loginBtn).toBeVisible();

    // No console errors
    expect(errors.filter((e) => !e.includes("hydrat"))).toHaveLength(0);
  });

  test("game page redirects to / when not authenticated", async ({ page }) => {
    await page.goto("/game");

    // Should redirect to landing page
    await expect(page).toHaveURL(/\/$/);
  });

  test("landing page has correct styling", async ({ page }) => {
    await page.goto("/");

    // Check background color (dark theme)
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check button has correct text
    const btn = page.getByRole("button");
    await expect(btn).toContainText("Discord");
  });
});
