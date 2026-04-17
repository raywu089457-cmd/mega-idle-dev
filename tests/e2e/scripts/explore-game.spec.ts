/**
 * Full game exploration - plays the game like a human
 * Run: npx playwright test tests/e2e/scripts/explore-game.spec.ts
 */

import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const SESSION_PATH = path.join(__dirname, "../.auth/discord-session.json");

async function safeNav(page: Page, label: RegExp, retries = 2): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
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
        if (attempt === retries) return false;
      }
    }
  }
  return false;
}

test("explore game like a human", async ({ browser }) => {
  const authDir = path.dirname(SESSION_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  if (!fs.existsSync(SESSION_PATH)) {
    test.skip(true, "No cached session - run save-session.spec.ts first");
    return;
  }

  const context = await browser.newContext({
    storageState: SESSION_PATH,
    baseURL: "https://mega-idle-dev.onrender.com",
  });
  const page = await context.newPage();

  console.log("🎮 Starting game exploration...\n");

  // 1. Load game
  console.log("1. Loading game page...");
  await page.goto("https://mega-idle-dev.onrender.com/game");
  await page.waitForURL(/\/game/, { timeout: 15000 });
  await page.locator(".game-shell").waitFor({ timeout: 15000 });
  console.log("   ✓ Game loaded");

  // 2. Check home
  console.log("\n2. Home panel (💰 資源)...");
  const goldText = await page.locator(".gold").first().textContent();
  const stonesText = await page.locator(".stones").first().textContent();
  console.log(`   💰 Gold: ${goldText}`);
  console.log(`   💎 Stones: ${stonesText}`);
  console.log(`   📦 Materials: ${await page.locator(".mat-item").count()}`);
  console.log(`   🏗️ Buildings: ${await page.locator(".bld-item").count()}`);
  console.log(`   🧙 Heroes: ${await page.locator(".hero-chip").count()}`);

  // 3. Heroes tab
  console.log("\n3. Heroes tab (🧙 英雄)...");
  await safeNav(page, /英雄/i);
  console.log(`   ✓ Hero rows: ${await page.locator(".hero-row").count()}`);
  const heroStats = await page.locator(".hero-stat").allTextContents();
  heroStats.forEach(s => console.log(`   ${s}`));

  // 4. Dispatch tab
  console.log("\n4. Dispatch tab (⚔️ 探索)...");
  await safeNav(page, /探索/i);
  console.log(`   ✓ Hero buttons: ${await page.locator(".hero-chip-btn").count()}`);

  // 5. Team tab
  console.log("\n5. Team tab (👥 隊伍)...");
  const teamOk = await safeNav(page, /隊伍/i);
  console.log(`   ${teamOk ? "✓" : "✗"} Team tab`);

  // 6. Buildings tab
  console.log("\n6. Buildings tab (🏗️ 建築)...");
  await safeNav(page, /建築/i);
  console.log(`   ✓ Building rows: ${await page.locator(".bld-row").count()}`);

  // 7. World Boss
  console.log("\n7. World Boss (🐉 世界王)...");
  await safeNav(page, /世界王/i);
  console.log("   ✓ World Boss loaded");

  // 8. Guild
  console.log("\n8. Guild (🏰 公會)...");
  await safeNav(page, /公會/i);
  console.log("   ✓ Guild loaded");

  // 9. Rewards
  console.log("\n9. Rewards (🎁 獎勵)...");
  await safeNav(page, /獎勵/i);
  console.log("   ✓ Rewards loaded");

  // 10. Logs
  console.log("\n10. Logs (📜 戰報)...");
  await safeNav(page, /戰報/i);
  console.log("   ✓ Logs loaded");

  // 11. Home + gold watching
  console.log("\n11. Home (gold increase check)...");
  await safeNav(page, /首頁/i);
  const goldBefore = await page.locator(".gold").first().textContent();
  console.log(`   Gold before: ${goldBefore}`);

  console.log("   Waiting 8s (idle ticks)...");
  await page.waitForTimeout(8000);
  const goldAfter = await page.locator(".gold").first().textContent();
  console.log(`   Gold after: ${goldAfter}`);

  console.log(`\n🎉 Done! Final gold: ${goldAfter}`);
  await browser.close();
});