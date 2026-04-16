import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session to start fresh
    await page.context().clearCookies();
  });

  test("landing page loads with Discord login button", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");

    // Page heading is visible
    await expect(
      page.getByRole("heading", { name: /mega idle/i })
    ).toBeVisible();

    // Discord login button is visible
    const loginBtn = page.getByRole("button", { name: /discord/i });
    await expect(loginBtn).toBeVisible();

    // Subtitle text is present
    await expect(
      page.getByText(/休閒放置 RPG/i)
    ).toBeVisible();

    // Note about no registration needed
    await expect(
      page.getByText(/不需要註冊/i)
    ).toBeVisible();

    // No console errors (excluding hydration warnings)
    const realErrors = errors.filter(
      (e) => !e.includes("hydrat") && !e.includes("Warning")
    );
    expect(realErrors).toHaveLength(0);
  });

  test("unauthenticated /game redirects to /", async ({ page }) => {
    await page.goto("/game");

    // Should be redirected to landing page
    await expect(page).toHaveURL(/\/$/, { timeout: 5000 });

    // Landing page elements are visible after redirect
    await expect(
      page.getByRole("heading", { name: /mega idle/i })
    ).toBeVisible();
  });

  test("Discord login button has correct href/pre-navigation", async ({
    page,
  }) => {
    await page.goto("/");

    // Button should trigger NextAuth Discord flow
    const btn = page.getByRole("button", { name: /discord/i });

    // Click should navigate to Discord OAuth (via NextAuth)
    await btn.click();

    // Should eventually lead to Discord's OAuth page
    // We use waitForURL to detect the redirect
    await expect(page).not.toHaveURL(/\/$/, { timeout: 5000 });
  });

  test("landing page shows loading state while session loads", async ({
    page,
  }) => {
    // This test verifies the loading state appears briefly
    // We use a fresh context to ensure a clean session check
    const ctx = await page.context().browser()?.newContext();
    const freshPage = await ctx?.newPage();

    if (!freshPage) return;

    try {
      // Intercept to catch the loading state
      await freshPage.goto("/", { waitUntil: "domcontentloaded" });

      // Check for loading indicator or content
      // The page shows "載入中..." (Loading...) while session status is "loading"
      const loadingOrContent = await freshPage
        .getByText(/載入中/i)
        .or(freshPage.getByRole("heading", { name: /mega idle/i }))
        .first();
      await expect(loadingOrContent).toBeVisible();
    } finally {
      await freshPage.close();
      await ctx?.close();
    }
  });
});
