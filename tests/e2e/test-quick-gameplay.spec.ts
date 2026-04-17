import { test, expect, Browser, Page } from "@playwright/test";
import { testCredentials } from "./helpers/test-config";
import { ensureAuthDir, hasCachedSession, getStorageStatePath } from "./helpers/auth-session";

async function getAuthenticatedPage(browser: Browser, baseURL: string): Promise<Page> {
  ensureAuthDir();
  const storageState = hasCachedSession() ? getStorageStatePath() : undefined;
  const context = await browser.newContext({ storageState, baseURL });
  const page = await context.newPage();
  
  try {
    await page.goto(`${baseURL}/game`, { timeout: 10000 });
    await page.waitForURL(/\/game/, { timeout: 8000 });
    await page.locator(".game-shell").waitFor({ timeout: 10000 });
    return page;
  } catch {
    await page.goto(baseURL);
    await page.getByRole("button", { name: /discord/i }).click();
    await page.waitForURL(/discord\.com\/oauth2/, { timeout: 15000 });
    if (testCredentials) {
      const emailInput = page.locator('input[name="email"]');
      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailInput.fill(testCredentials.email);
        await page.locator('input[name="password"]').fill(testCredentials.password);
        await page.locator('button[type="submit"]').click();
      }
    }
    try {
      const authorizeBtn = page.getByRole("button", { name: /authorize|允許|允许|同意/i });
      await authorizeBtn.waitFor({ timeout: 8000 });
      await authorizeBtn.click();
    } catch {}
    try {
      const continueBtn = page.getByRole("button", { name: /continue to discord/i });
      await continueBtn.waitFor({ timeout: 5000 });
      await continueBtn.click();
    } catch {}
    await page.waitForURL(/\/game$/, { timeout: 20000 });
    await page.locator(".game-shell").waitFor({ timeout: 15000 });
    await context.storageState({ path: getStorageStatePath() });
    return page;
  }
}

async function navigateToTab(page: Page, tabName: string): Promise<void> {
  await page.locator(".game-nav").getByText(new RegExp(tabName)).click();
  await page.waitForTimeout(800);
}

test.describe.configure({ mode: "serial" });

test("Quick Gameplay Test - Core Loop", async ({ browser }) => {
  const page = await getAuthenticatedPage(browser, "https://mega-idle-dev.onrender.com");
  
  console.log("\n=== Quick Gameplay Test ===\n");

  // Phase 1: Home
  console.log("[Phase 1] Home Panel");
  await navigateToTab(page, "首頁");
  const gold = await page.locator(".gold").first().textContent();
  const stones = await page.locator(".stones").first().textContent();
  console.log(`  Gold: ${gold}, Stones: ${stones}`);
  
  // Phase 2: Heroes
  console.log("\n[Phase 2] Heroes Panel");
  await navigateToTab(page, "英雄");
  await page.waitForTimeout(500);
  
  // Count territory heroes
  const territoryTab = page.locator(".tab").filter({ hasText: /領地/i }).first();
  if (await territoryTab.count() > 0) {
    await territoryTab.click();
    await page.waitForTimeout(300);
  }
  const territoryCount = await page.locator(".hero-row").count();
  console.log(`  Territory heroes: ${territoryCount}`);
  
  // Check wandering
  const wanderingTab = page.locator(".tab").filter({ hasText: /流浪/i }).first();
  if (await wanderingTab.count() > 0) {
    await wanderingTab.click();
    await page.waitForTimeout(300);
  }
  const wanderingCount = await page.locator(".hero-row").count();
  console.log(`  Wandering heroes: ${wanderingCount}`);

  // Phase 3: Dispatch
  console.log("\n[Phase 3] Dispatch Panel");
  await navigateToTab(page, "探索");
  await page.waitForTimeout(500);
  
  const heroButtons = await page.locator(".hero-chip-btn").count();
  console.log(`  Available heroes for dispatch: ${heroButtons}`);
  
  if (heroButtons > 0) {
    // Select first hero
    await page.locator(".hero-chip-btn").first().click();
    await page.waitForTimeout(300);
    console.log("  Selected first hero");
    
    // Try dispatch
    const dispatchBtn = page.locator("button").filter({ hasText: /派遣/i }).first();
    if (await dispatchBtn.count() > 0 && !(await dispatchBtn.isDisabled().catch(() => true))) {
      await dispatchBtn.click();
      await page.waitForTimeout(2000);
      console.log("  Dispatch initiated!");
      
      // Wait for cooldown
      console.log("  Waiting 35s for dispatch cooldown...");
      await page.waitForTimeout(35000);
      
      // Recall
      const recallBtn = page.locator("button").filter({ hasText: /召回/i }).first();
      if (await recallBtn.count() > 0 && !(await recallBtn.isDisabled().catch(() => true))) {
        await recallBtn.click();
        await page.waitForTimeout(2000);
        console.log("  Heroes recalled!");
      }
    }
  } else {
    console.log("  No heroes available - checking why...");
    await page.screenshot({ path: './test-results/dispatch-no-heroes.png', fullPage: true });
  }

  // Phase 4: World Boss
  console.log("\n[Phase 4] World Boss Panel");
  await navigateToTab(page, "世界王");
  await page.waitForTimeout(500);
  
  const bossName = await page.locator(".boss-name").textContent().catch(() => "Unknown");
  const bossHp = await page.locator(".hp-text").textContent().catch(() => "Unknown");
  console.log(`  Boss: ${bossName}, HP: ${bossHp}`);
  
  const bossHeroes = await page.locator(".hero-chip-btn").count();
  console.log(`  Available heroes for boss: ${bossHeroes}`);
  
  if (bossHeroes > 0) {
    await page.locator(".hero-chip-btn").first().click();
    await page.waitForTimeout(200);
    const attackBtn = page.locator("button").filter({ hasText: /挑戰|攻擊/i }).first();
    if (!(await attackBtn.isDisabled().catch(() => true))) {
      await attackBtn.click();
      await page.waitForTimeout(3000);
      const msg = await page.locator(".msg").textContent().catch(() => "");
      console.log(`  Attack result: ${msg}`);
    }
  }

  // Phase 5: Buildings
  console.log("\n[Phase 5] Buildings Panel");
  await navigateToTab(page, "建築");
  await page.waitForTimeout(500);
  
  const buildingRows = await page.locator(".bld-row").count();
  console.log(`  Buildings displayed: ${buildingRows}`);
  
  // Check for upgrade buttons
  const upgradeBtns = await page.locator("button").filter({ hasText: /升級/i }).count();
  console.log(`  Upgrade buttons: ${upgradeBtns}`);

  // Phase 6: Rewards
  console.log("\n[Phase 6] Rewards Panel");
  await navigateToTab(page, "獎勵");
  await page.waitForTimeout(500);
  
  const rewardCards = await page.locator(".reward-card").count();
  console.log(`  Reward cards: ${rewardCards}`);
  
  const claimBtns = await page.locator("button").filter({ hasText: /領取/i }).count();
  console.log(`  Claim buttons: ${claimBtns}`);

  // Phase 7: Logs
  console.log("\n[Phase 7] Logs Panel");
  await navigateToTab(page, "戰報");
  await page.waitForTimeout(500);
  
  const logEntries = await page.locator(".log-row, .log-entry").count();
  console.log(`  Log entries: ${logEntries}`);
  
  const filterTabs = await page.locator(".tab-bar .tab").count();
  console.log(`  Filter tabs: ${filterTabs}`);

  console.log("\n=== Test Complete ===");
  await page.screenshot({ path: './test-results/final-state.png', fullPage: true });
  await page.close();
});
