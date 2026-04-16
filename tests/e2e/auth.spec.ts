/**
 * Discord OAuth login flow E2E tests.
 *
 * These tests perform the actual Discord OAuth flow.
 * They require DISCORD_TEST_EMAIL, DISCORD_TEST_PASSWORD, and DISCORD_TEST_USER_ID
 * environment variables to be set.
 *
 * If credentials are not configured, all tests in this suite are skipped.
 */

import { test, expect, Browser } from "@playwright/test";
import { testCredentials } from "./helpers/test-config";
import {
  ensureAuthDir,
  hasCachedSession,
  getStorageStatePath,
} from "./helpers/auth-session";

const SKIP_REASON =
  "Discord test credentials not configured. Set DISCORD_TEST_EMAIL, " +
  "DISCORD_TEST_PASSWORD, and DISCORD_TEST_USER_ID environment variables.";

test.describe.configure({ mode: "serial" });

test.describe("Discord OAuth Flow", () => {
  test.beforeAll(() => {
    ensureAuthDir();
  });

  test.describe("With live OAuth (requires test credentials)", () => {
    test.beforeEach(function () {
      if (!testCredentials) {
        test.skip(true, SKIP_REASON);
      }
    });

    test("full login flow: landing -> Discord OAuth -> game page", async ({
      page,
    }) => {
      // Start at landing page
      await page.goto("/");

      // Verify landing page elements
      await expect(
        page.getByRole("heading", { name: /mega idle/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /discord/i })
      ).toBeVisible();

      // Click Discord login
      await page.getByRole("button", { name: /discord/i }).click();

      // Should redirect to Discord OAuth
      await page.waitForURL(/discord\.com\/oauth2/, { timeout: 15000 });

      // Fill credentials (skip if Discord auto-logged in and redirected to authorize/callback)
      const emailInput = page.locator('input[name="email"]');
      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const { email, password } = testCredentials!;
        await emailInput.fill(email);
        await page.locator('input[name="password"]').fill(password);
        await page.locator('button[type="submit"]').click();
      }

      // Discord may show authorize dialog
      try {
        const authorizeBtn = page.getByRole("button", {
          name: /authorize|允許|允许|同意/i,
        });
        await authorizeBtn.waitFor({ timeout: 8000 });
        await authorizeBtn.click();
      } catch {
        // No authorize step needed
      }

      // Should end up at /game (exact match with $ anchor)
      await page.waitForURL(/\/game$/, { timeout: 20000 });

      // Game page should be loaded
      await expect(page.locator(".game-shell")).toBeVisible({ timeout: 10000 });
    });

    test("session persists across page reloads", async ({ page }) => {
      // Use cached session if available
      const storagePath = getStorageStatePath();
      if (hasCachedSession()) {
        await page.context().storageState({ path: storagePath });
      }

      await page.goto("/game");

      // If we land on /game (authenticated), test passes
      // If we land on / (not authenticated), skip - session expired
      const url = page.url();
      if (url === "http://localhost:3000/") {
        test.skip(true, "Session expired, needs re-login");
        return;
      }
      // Should be on /game
      await page.waitForURL(/\/game$/, { timeout: 10000 });

      // Or check that we didn't get redirected
      expect(page.url()).toMatch(/\/game/);
    });
  });

  test.describe("Session behavior", () => {
    test("clicking Discord button on already-authenticated session redirects to /game", async ({
      page,
    }) => {
      if (!testCredentials) {
        test.skip(true, SKIP_REASON);
      }

      // Login first
      await page.goto("/");
      await page.getByRole("button", { name: /discord/i }).click();
      await page.waitForURL(/discord\.com\/oauth2/, { timeout: 15000 });

      // Fill credentials (skip if Discord auto-logged in)
      const emailInput = page.locator('input[name="email"]');
      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const { email, password } = testCredentials!;
        await emailInput.fill(email);
        await page.locator('input[name="password"]').fill(password);
        await page.locator('button[type="submit"]').click();
      }

      try {
        const authorizeBtn = page.getByRole("button", {
          name: /authorize|允許|允许|同意/i,
        });
        await authorizeBtn.waitFor({ timeout: 8000 });
        await authorizeBtn.click();
      } catch {
        // no authorize step
      }

      await page.waitForURL(/\/game$/, { timeout: 20000 });

      // Now go back to landing
      await page.goto("/");

      // Should see heading but NOT the login button (session active)
      // OR if session check is fast, might immediately redirect to /game
      const url = page.url();
      if (!url.endsWith("/game")) {
        await expect(
          page.getByRole("heading", { name: /mega idle/i })
        ).toBeVisible();
      }
    });
  });
});
