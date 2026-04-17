import { test, expect } from "@playwright/test";

const BASE_URL = "https://mega-idle-dev.onrender.com";

/**
 * Hero Growth Through Exploration Only
 * - NO training - heroes gain XP only through exploration battles
 * - Target: Level 30 heroes
 * - Duration: Up to 12 hours
 */
test("Hero Growth Through Exploration - Level heroes to 30 via combat only", async ({ page }) => {
  test.setTimeout(43200000); // 12 hours

  // Login
  await page.goto(`${BASE_URL}/game`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  const url = page.url();
  if (url.includes("auth") || url === BASE_URL + "/") {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1000);
    await page.locator(".discord-btn").click();
    await page.waitForURL(`${BASE_URL}/game`, { timeout: 30000 });
    await page.waitForTimeout(2000);
  }

  console.log("\n=== Hero Growth Through Exploration ===");
  console.log("Rules: NO training - XP only from combat");
  console.log("Target: Level 30 heroes\n");

  const TARGET_LEVEL = 30;
  const ZONE_TIMEOUT = 45000; // 45 seconds per exploration cycle
  const CHECK_INTERVAL_MS = 60000; // Check level every minute

  // Initial status
  await page.locator(".game-nav").getByText(/英雄/).click();
  await page.waitForTimeout(1000);

  const territoryTab = page.locator(".tab-bar .tab").filter({ hasText: /領地/ });
  await territoryTab.click();
  await page.waitForTimeout(500);

  const heroRows = await page.locator(".hero-row").all();
  const maxInitialLevel = await getMaxHeroLevel(page, heroRows);
  console.log(`[START] Territory heroes: ${heroRows.length}`);
  console.log(`[START] Highest level: ${maxInitialLevel}`);

  // Recall all heroes first to ensure clean state
  console.log("\n[SETUP] Recalling all exploring heroes for clean state...");
  await page.locator(".game-nav").getByText(/探索/).click();
  await page.waitForTimeout(1000);
  const initialRecallBtn = page.locator("button").filter({ hasText: /召回/i }).first();
  if (await initialRecallBtn.count() > 0 && !(await initialRecallBtn.isDisabled().catch(() => true))) {
    await initialRecallBtn.click();
    await page.waitForTimeout(2000);
    console.log("[SETUP] All heroes recalled");
  }

  let currentMaxLevel = maxInitialLevel;
  const startTime = Date.now();
  let explorationCount = 0;

  // Exploration loop until target level reached
  while (currentMaxLevel < TARGET_LEVEL) {
    // Check elapsed time
    const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60);
    console.log(`\n[${elapsed}m] Current max level: ${currentMaxLevel}/${TARGET_LEVEL}`);

    // Go to exploration
    await page.locator(".game-nav").getByText(/探索/).click();
    await page.waitForTimeout(1000);

    // Select available hero (idle, not exploring)
    const heroBtn = page.locator(".hero-chip-btn").first();
    if (await heroBtn.count() === 0) {
      console.log("[WARN] No hero available for dispatch");
      await page.waitForTimeout(5000);
      continue;
    }

    await heroBtn.click();
    await page.waitForTimeout(300);

    // Determine best zone based on current level
    // Use zones 1-10, higher zones = higher XP
    const zoneSelect = page.locator("select").first();
    const diffSelect = page.locator("select").nth(1);

    // Auto-select zone based on hero level
    let targetZone = Math.min(10, Math.floor(currentMaxLevel / 3) + 1);
    if (targetZone < 1) targetZone = 1;

    await zoneSelect.selectOption(String(targetZone));
    await page.waitForTimeout(200);

    // Select hardest difficulty
    const diffOptions = await diffSelect.locator("option").all();
    const maxDiff = diffOptions.length;
    await diffSelect.selectOption(String(maxDiff));
    await page.waitForTimeout(200);

    // Check dispatch button
    const dispatchBtn = page.locator("button").filter({ hasText: /派遣/i }).first();
    const canDispatch = await dispatchBtn.count() > 0 && !(await dispatchBtn.isDisabled().catch(() => true));

    if (!canDispatch) {
      console.log("[WARN] Cannot dispatch - attempting recall");
      const recallBtn = page.locator("button").filter({ hasText: /召回/i }).first();
      if (await recallBtn.count() > 0) {
        await recallBtn.click();
        console.log("[WARN] Hero recalled");
        await page.waitForTimeout(2000);
      }
      // Try dispatch again
      const retryDispatchBtn = page.locator("button").filter({ hasText: /派遣/i }).first();
      if (await retryDispatchBtn.count() > 0 && !(await retryDispatchBtn.isDisabled().catch(() => true))) {
        console.log("[WARN] Retrying dispatch after recall");
      } else {
        await page.waitForTimeout(5000);
        continue;
      }
    }

    // Dispatch hero
    await dispatchBtn.click();
    explorationCount++;
    console.log(`[${elapsed}m] Exploration #${explorationCount}: Zone ${targetZone} Difficulty ${maxDiff}`);

    // Wait for exploration to complete (30s cooldown + buffer)
    await page.waitForTimeout(ZONE_TIMEOUT);

    // Recall hero after exploration (to end exploring state)
    const recallBtn = page.locator("button").filter({ hasText: /召回/i }).first();
    if (await recallBtn.count() > 0) {
      await recallBtn.click();
      console.log(`[${elapsed}m] Hero recalled`);
      await page.waitForTimeout(2000);
    }

    // Check stats
    await page.locator(".game-nav").getByText(/首頁/).click();
    await page.waitForTimeout(1000);
    const stats = await page.locator(".stats-list").textContent().catch(() => "");
    console.log(`[${elapsed}m] Stats: ${stats}`);

    // Check hero levels
    await page.locator(".game-nav").getByText(/英雄/).click();
    await page.waitForTimeout(1000);
    await territoryTab.click();
    await page.waitForTimeout(500);

    const updatedHeroRows = await page.locator(".hero-row").all();
    const newMaxLevel = await getMaxHeroLevel(page, updatedHeroRows);

    if (newMaxLevel > currentMaxLevel) {
      console.log(`\n*** LEVEL UP! ${currentMaxLevel} -> ${newMaxLevel} ***\n`);
      currentMaxLevel = newMaxLevel;
    }

    // Small delay before next cycle
    await page.waitForTimeout(2000);
  }

  // Final report
  const endTime = Date.now();
  const totalMinutes = Math.floor((endTime - startTime) / 1000 / 60);
  const totalHours = (totalMinutes / 60).toFixed(1);

  console.log("\n" + "=".repeat(50));
  console.log("=== HERO GROWTH COMPLETE ===");
  console.log(`Total time: ${totalHours} hours (${totalMinutes} minutes)`);
  console.log(`Total explorations: ${explorationCount}`);
  console.log(`Final max level: ${currentMaxLevel}`);
  console.log("=".repeat(50));

  await page.close();
});

/**
 * Helper: Get max level from hero rows
 */
async function getMaxHeroLevel(page: any, heroRows: any[]): Promise<number> {
  let maxLevel = 0;
  for (const row of heroRows) {
    const levelText = await row.locator(".hero-lv").textContent().catch(() => "Lv.0");
    const level = parseInt(levelText.replace(/[^\d]/g, ""), 10) || 0;
    if (level > maxLevel) maxLevel = level;
  }
  return maxLevel;
}
