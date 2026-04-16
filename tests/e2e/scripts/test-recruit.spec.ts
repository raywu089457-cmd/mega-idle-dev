/**
 * Test recruit feature - territory vs wandering
 * Run: npx playwright test tests/e2e/scripts/test-recruit.spec.ts
 */

import { test, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const SESSION_PATH = path.join(__dirname, "../.auth/discord-session.json");

async function safeNav(page: Page, label: RegExp) {
  try {
    await page.locator(".game-nav").getByText(label).click({ timeout: 3000 });
    await page.waitForTimeout(800);
    await page.locator(".panel").waitFor({ timeout: 3000 });
    return true;
  } catch {
    try {
      await page.reload();
      await page.locator(".game-shell").waitFor({ timeout: 10000 });
      await page.locator(".game-nav").getByText(label).click({ timeout: 3000 });
      await page.waitForTimeout(800);
      await page.locator(".panel").waitFor({ timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

test("recruit heroes", async ({ browser }) => {
  if (!fs.existsSync(SESSION_PATH)) {
    test.skip(true, "No cached session");
    return;
  }

  const context = await browser.newContext({
    storageState: SESSION_PATH,
    baseURL: "http://localhost:3000",
  });
  const page = await context.newPage();

  console.log("🎮 Testing recruit feature...\n");

  await page.goto("http://localhost:3000/game");
  await page.waitForURL(/\/game/, { timeout: 15000 });
  await page.locator(".game-shell").waitFor({ timeout: 15000 });

  // Go to Heroes tab
  console.log("1. Going to Heroes tab...");
  await safeNav(page, /英雄/i);
  await page.locator(".panel").waitFor({ timeout: 5000 });
  console.log("   ✓ Panel loaded");

  // Check territory tab
  const heroCountBefore = await page.locator(".hero-row").count();
  const statsText = await page.locator(".tab-bar").textContent().catch(() => "");
  console.log(`\n   Territory: ${heroCountBefore} heroes`);
  console.log(`   Tab bar: ${statsText?.replace(/\s+/g, " ") ?? ""}`);

  // Try territory recruit
  const recruitBtn = page.locator("button").filter({ hasText: /招募/ }).first();
  const isDisabled = await recruitBtn.isDisabled();
  console.log(`\n   Territory recruit disabled: ${isDisabled}`);

  if (isDisabled) {
    console.log("   Reason: at capacity (48/48) or no resources");
  } else {
    await recruitBtn.click();
    await page.waitForTimeout(2000);
    const msg = await page.locator(".msg").textContent().catch(() => null);
    console.log(`   Clicked! Msg: ${msg}`);
  }

  // Switch to wandering
  console.log("\n2. Switching to wandering tab...");
  const wanderingTab = page.locator(".tab").filter({ hasText: /流浪/ });
  await wanderingTab.click();
  await page.waitForTimeout(500);

  const wanderingCount = await page.locator(".hero-row").count();
  const wandStatsText = await page.locator(".tab-bar").textContent().catch(() => "");
  console.log(`   Wandering: ${wanderingCount} heroes`);
  console.log(`   Tab bar: ${wandStatsText?.replace(/\s+/g, " ") ?? ""}`);

  // Try wandering recruit
  const recruitBtnWand = page.locator("button").filter({ hasText: /招募/ }).first();
  const isDisabledWand = await recruitBtnWand.isDisabled();
  console.log(`\n   Wandering recruit disabled: ${isDisabledWand}`);

  if (isDisabledWand) {
    console.log("   Reason: at capacity (72/72) or no resources");
  } else {
    await recruitBtnWand.click();
    await page.waitForTimeout(2000);
    const msg = await page.locator(".msg").textContent().catch(() => null);
    console.log(`   Clicked! Msg: ${msg}`);
  }

  console.log("\n✅ Recruit test complete");
  await browser.close();
});