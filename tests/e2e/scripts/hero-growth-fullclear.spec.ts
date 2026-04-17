import { test, expect } from "@playwright/test";

const BASE_URL = "https://mega-idle-dev.onrender.com";

/**
 * Hero Growth & Full Clear Test
 * 1. Train heroes to level 10
 * 2. Clear all 10 exploration zones
 */
test("Hero Growth & Full Clear - Train heroes to Lv10 and clear all zones", async ({ page }) => {
  test.setTimeout(600000);

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

  console.log("\n=== Hero Growth & Full Clear Test ===");

  // Go to Heroes panel
  console.log("1. Going to Heroes panel...");
  await page.locator(".game-nav").getByText(/英雄/).click();
  await page.waitForTimeout(1000);

  // Switch to territory tab
  const territoryTab = page.locator(".tab-bar .tab").filter({ hasText: /領地/ });
  await territoryTab.click();
  await page.waitForTimeout(500);

  // Get all heroes
  const heroRows = await page.locator(".hero-row").all();
  console.log(`   Found ${heroRows.length} territory heroes`);

  // Train each hero a few times (costs gold)
  console.log("2. Training heroes to increase levels...");
  for (const row of heroRows) {
    const name = await row.locator(".hero-name").textContent().catch(() => "Unknown");
    const level = await row.locator(".hero-lv").textContent().catch(() => "Lv.1");
    console.log(`   ${name} ${level} - opening training...`);

    // Click hero to open detail modal
    await row.click();
    await page.waitForTimeout(500);

    // Check if train button is enabled
    const trainBtn = page.locator("button").filter({ hasText: /訓練/i });
    const trainBtnCount = await trainBtn.count();
    if (trainBtnCount > 0) {
      const isDisabled = await trainBtn.isDisabled().catch(() => true);
      if (!isDisabled) {
        // Try training a few times
        for (let i = 0; i < 3; i++) {
          await trainBtn.click();
          await page.waitForTimeout(300);
          const disabled = await trainBtn.isDisabled().catch(() => true);
          if (disabled) break;
        }
        console.log(`   Trained ${name}`);
      }
    }

    // Close modal
    const closeBtn = page.locator(".btn-close");
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // Check gold for more training
  console.log("3. Checking resources...");
  await page.locator(".game-nav").getByText(/首頁/).click();
  await page.waitForTimeout(1000);
  const goldText = await page.locator(".gold").first().textContent();
  console.log(`   Current Gold: ${goldText}`);

  // Go to Exploration
  console.log("4. Starting exploration progress...");
  await page.locator(".game-nav").getByText(/探索/).click();
  await page.waitForTimeout(1000);

  // Select first hero
  const heroBtn = page.locator(".hero-chip-btn").first();
  if (await heroBtn.count() > 0) {
    await heroBtn.click();
    await page.waitForTimeout(300);
  }

  // Progress through zones 1-10
  for (let zone = 1; zone <= 10; zone++) {
    const zoneSelect = page.locator("select").first();
    await zoneSelect.selectOption(String(zone));
    await page.waitForTimeout(200);

    // Select hardest difficulty for each zone
    const diffSelect = page.locator("select").nth(1);
    const diffOptions = await diffSelect.locator("option").all();
    const maxDiff = diffOptions.length;
    await diffSelect.selectOption(String(maxDiff));
    await page.waitForTimeout(200);

    const dispatchBtn = page.locator("button").filter({ hasText: /派遣/i }).first();
    const dispatchExists = await dispatchBtn.count() > 0;

    if (dispatchExists) {
      const isDisabled = await dispatchBtn.isDisabled().catch(() => true);
      if (!isDisabled) {
        console.log(`   Dispatching to Zone ${zone} (Difficulty ${maxDiff})...`);
        await dispatchBtn.click();
        await page.waitForTimeout(2000);

        // Wait for cooldown + battle (35 seconds)
        console.log(`   Waiting for exploration...`);
        await page.waitForTimeout(35000);

        // Check result
        await page.locator(".game-nav").getByText(/首頁/).click();
        await page.waitForTimeout(1000);
        const stats = await page.locator(".stats-list").textContent().catch(() => "");
        console.log(`   Stats after Zone ${zone}: ${stats}`);

        // Go back to exploration for next zone
        await page.locator(".game-nav").getByText(/探索/).click();
        await page.waitForTimeout(1000);

        // Re-select hero
        const heroBtnNew = page.locator(".hero-chip-btn").first();
        if (await heroBtnNew.count() > 0) {
          await heroBtnNew.click();
          await page.waitForTimeout(300);
        }
      } else {
        console.log(`   Dispatch disabled for Zone ${zone} - not enough resources or hero unavailable`);
      }
    }
  }

  // Final check
  console.log("5. Final status...");
  await page.locator(".game-nav").getByText(/首頁/).click();
  await page.waitForTimeout(1000);
  const finalStats = await page.locator(".stats-list").textContent().catch(() => "");
  console.log(`   Final Stats: ${finalStats}`);

  await page.locator(".game-nav").getByText(/戰報/).click();
  await page.waitForTimeout(1000);
  const logCount = await page.locator(".log-row").count();
  console.log(`   Total battle logs: ${logCount}`);

  console.log("\n=== TEST COMPLETE ===");
});
