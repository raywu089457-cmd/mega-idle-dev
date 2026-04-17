/**
 * One-time login test to establish and cache session.
 * Run: npx playwright test tests/e2e/scripts/save-session.spec.ts
 */

import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const SESSION_PATH = path.join(__dirname, "../.auth/discord-session.json");

test("save Discord session", async ({ browser }) => {
  const email = process.env.DISCORD_TEST_EMAIL;
  const password = process.env.DISCORD_TEST_PASSWORD;

  if (!email || !password) {
    test.skip(true, "DISCORD_TEST_EMAIL/DISCORD_TEST_PASSWORD not set");
    return;
  }

  // Ensure auth dir
  const authDir = path.dirname(SESSION_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("1. Going to landing page...");
  await page.goto("https://mega-idle-dev.onrender.com");
  await page.waitForLoadState("networkidle");

  console.log("2. Clicking Discord login...");
  await page.click('button:has-text("Discord")');
  await page.waitForURL(/discord\.com\/oauth2/, { timeout: 15000 });

  const emailInput = page.locator('input[name="email"]');
  const hasEmailInput = await emailInput.isVisible().catch(() => false);

  if (hasEmailInput) {
    console.log("3. Filling credentials...");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
  } else {
    console.log("3. Credentials already filled by Discord");
  }

  try {
    const authorizeBtn = page.getByRole("button", {
      name: /authorize|允許|允许|同意/i,
    });
    await authorizeBtn.waitFor({ timeout: 8000 });
    await authorizeBtn.click();
    console.log("4. Clicked authorize");
  } catch {
    console.log("4. No authorize step");
  }

  console.log("5. Waiting for /game...");
  await page.waitForURL(/\/game/, { timeout: 30000 });

  await page.locator(".game-shell").waitFor({ timeout: 15000 });
  console.log("   Game shell loaded!");

  console.log("6. Saving session...");
  await context.storageState({ path: SESSION_PATH });
  console.log(`   Saved to: ${SESSION_PATH}`);

  await browser.close();
  console.log("\n✓ Session saved!");
});