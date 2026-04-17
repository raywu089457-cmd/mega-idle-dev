/**
 * Authentication helper for E2E tests.
 *
 * Uses Playwright's storageState to cache Discord OAuth session,
 * avoiding repeated OAuth flows across test runs.
 *
 * Flow:
 * 1. If storageState file exists, load it and skip login
 * 2. Otherwise, perform full Discord OAuth login flow
 * 3. After successful login, save storageState for future runs
 */

import { test as base, Page, Browser } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { testCredentials } from "./test-config";

const STORAGE_STATE_PATH = path.join(
  __dirname,
  "..",
  ".auth",
  "discord-session.json"
);

/**
 * Ensure the .auth directory exists
 */
export function ensureAuthDir(): void {
  const dir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Check if we have a cached auth session
 */
export function hasCachedSession(): boolean {
  return fs.existsSync(STORAGE_STATE_PATH);
}

/**
 * Get the storage state path for use in browser contexts
 */
export function getStorageStatePath(): string {
  return STORAGE_STATE_PATH;
}

/**
 * Perform Discord OAuth login flow.
 * Returns the page after successful login (on /game page).
 */
export async function performDiscordLogin(page: Page): Promise<Page> {
  if (!testCredentials) {
    throw new Error(
      "Discord test credentials not configured. Set DISCORD_TEST_EMAIL, " +
        "DISCORD_TEST_PASSWORD, and DISCORD_TEST_USER_ID environment variables."
    );
  }

  const { email, password } = testCredentials;

  // Click the Discord login button
  await page.getByRole("button", { name: /discord/i }).click();

  // Wait for Discord OAuth page to load
  await page.waitForURL(/discord\.com\/oauth2/, { timeout: 15000 });

  // Fill in Discord credentials
  // The email field on Discord's login page
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);

  // Submit the login form
  await page.locator('button[type="submit"]').click();

  // Discord may show "Authorize" page for third-party app logins
  // Wait for either the authorize button or a redirect back to the app
  try {
    const authorizeButton = page.getByRole("button", {
      name: /authorize|允許|允许|同意/i,
    });
    await authorizeButton.waitFor({ timeout: 10000 });
    await authorizeButton.click();
  } catch {
    // No authorize step (already authorized or different flow)
  }

  // Wait for redirect back to /game
  await page.waitForURL(/\/game/, { timeout: 20000 });

  return page;
}

/**
 * Extended test type that includes authenticated page fixture
 */
export type AuthenticatedPage = Page;

/**
 * Fixture that provides an authenticated page, automatically
 * handling login via cached session or OAuth flow.
 */
export async function authenticatedPage(
  browser: Browser,
  baseURL: string
): Promise<Page> {
  ensureAuthDir();

  const context = await browser.newContext({
    storageState: hasCachedSession() ? STORAGE_STATE_PATH : undefined,
    baseURL,
  });

  const page = await context.newPage();

  // Check if already authenticated
  await page.goto(`${baseURL}/game`);
  const url = page.url();

  if (url.includes("/game")) {
    // Already authenticated, return page
    return page;
  }

  // Need to login
  await page.goto(baseURL);

  await performDiscordLogin(page);

  // Save the session for next time
  await context.storageState({ path: STORAGE_STATE_PATH });

  return page;
}

/**
 * Alias for authenticatedPage for backward compatibility
 */
export const getAuthenticatedPage = authenticatedPage;
