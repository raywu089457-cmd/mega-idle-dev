/**
 * One-time login script: Opens browser, performs OAuth, saves session to file.
 * Run this ONCE manually when you need to refresh the test session.
 *
 * Usage: npx ts-node --esm tests/e2e/scripts/login-and-save-session.ts
 * Or: node --loader ts-node/esm tests/e2e/scripts/login-and-save-session.ts
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_PATH = path.join(__dirname, "../.auth/discord-session.json");

async function main() {
  const email = process.env.DISCORD_TEST_EMAIL;
  const password = process.env.DISCORD_TEST_PASSWORD;

  if (!email || !password) {
    console.error("Set DISCORD_TEST_EMAIL and DISCORD_TEST_PASSWORD environment variables");
    process.exit(1);
  }

  const authDir = path.dirname(SESSION_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("1. Going to landing page...");
  await page.goto("http://localhost:3000");
  await page.waitForLoadState("networkidle");
  console.log("   Landing page loaded");

  console.log("2. Clicking Discord login...");
  await page.click('button:has-text("Discord")');
  await page.waitForURL(/discord\.com\/oauth2/, { timeout: 15000 });
  console.log("   On Discord OAuth page");

  // Handle the Discord login - either fill form OR Discord auto-filled
  // Wait for either the email input OR redirect to callback
  const emailInput = page.locator('input[name="email"]');
  const hasEmailInput = await emailInput.isVisible().catch(() => false);

  if (hasEmailInput) {
    console.log("3. Filling credentials...");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    console.log("   Credentials submitted");
  } else {
    console.log("3. Credentials already filled by Discord (auto-login)");
  }

  // Handle optional authorize step
  try {
    const authorizeBtn = page.getByRole("button", {
      name: /authorize|允許|允许|同意/i,
    });
    await authorizeBtn.waitFor({ timeout: 8000 });
    await authorizeBtn.click();
    console.log("4. Clicked authorize button");
  } catch {
    console.log("4. No authorize step (already authorized or auto-authorized)");
  }

  console.log("5. Waiting for /game page...");
  await page.waitForURL(/\/game/, { timeout: 30000 });
  console.log("   Redirected to /game!");

  await page.waitForSelector(".game-shell", { timeout: 15000 });
  console.log("   Game shell loaded!");

  console.log("6. Saving session...");
  await context.storageState({ path: SESSION_PATH });
  console.log(`   Session saved to: ${SESSION_PATH}`);

  await browser.close();
  console.log("\n✓ Done! Session will be reused in subsequent test runs.");
  console.log("  Delete the session file to force a new login.");
}

main().catch((err) => {
  console.error("Login failed:", err.message);
  process.exit(1);
});
