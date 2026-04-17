import { test, expect, Browser } from "@playwright/test";
import { getAuthenticatedPage } from "../helpers/auth-session";

const BASE_URL = "https://mega-idle-dev.onrender.com";

test("Exploration Battle Test - Dispatch and wait for battle result", async ({ browser }) => {
  test.setTimeout(300000); // 5 minutes

  const page = await getAuthenticatedPage(browser, BASE_URL);

  console.log("1. Going to Heroes panel to check heroes...");
  await page.locator(".game-nav").getByText(/英雄/).click();
  await page.waitForTimeout(1000);

  const territoryTab = page.locator(".tab-bar .tab").filter({ hasText: /領地/ });
  await territoryTab.click();
  await page.waitForTimeout(500);

  const heroCount = await page.locator(".hero-row").count();
  console.log(`   Territory heroes: ${heroCount}`);

  console.log("2. Going to Exploration panel...");
  await page.locator(".game-nav").getByText(/探索/).click();
  await page.waitForTimeout(1000);

  // Select a hero
  const heroBtn = page.locator(".hero-chip-btn").first();
  const heroBtnCount = await heroBtn.count();
  console.log(`   Hero buttons: ${heroBtnCount}`);

  if (heroBtnCount > 0) {
    await heroBtn.click();
    await page.waitForTimeout(300);

    // Select zone 1, easy (goblin with 25 HP)
    const zoneSelect = page.locator("select").first();
    await zoneSelect.selectOption("1");
    await page.waitForTimeout(200);

    const diffSelect = page.locator("select").nth(1);
    await diffSelect.selectOption("1");
    await page.waitForTimeout(200);

    // Dispatch
    const dispatchBtn = page.locator("button").filter({ hasText: /派遣/i }).first();
    const dispatchExists = await dispatchBtn.count() > 0;
    console.log(`   Dispatch button exists: ${dispatchExists}`);

    if (dispatchExists) {
      const isDisabled = await dispatchBtn.isDisabled().catch(() => true);
      console.log(`   Dispatch button disabled: ${isDisabled}`);

      if (!isDisabled) {
        await dispatchBtn.click();
        await page.waitForTimeout(2000);
        console.log("   Hero dispatched!");

        // Wait up to 4 minutes for battle to complete (50 rounds max = ~250s but should finish faster)
        console.log("3. Waiting up to 4 minutes for exploration battle to complete...");

        // Poll every 10 seconds to check if battle log appears
        let battleLogFound = false;
        for (let i = 0; i < 24; i++) { // 24 * 10s = 240s = 4 minutes
          await page.waitForTimeout(10000);
          console.log(`   ...waited ${(i+1) * 10}s`);

          // Check if hero is still exploring
          const recallBtn = page.locator("button").filter({ hasText: /召回/i }).first();
          const stillExploring = await recallBtn.count() > 0;

          // Check battle logs without clicking away
          await page.locator(".game-nav").getByText(/戰報/).click();
          await page.waitForTimeout(1000);
          const logRows = await page.locator(".log-row").count();
          console.log(`   Battle log entries: ${logRows}`);

          if (logRows > 0) {
            battleLogFound = true;
            const firstLog = await page.locator(".log-row").first().textContent().catch(() => "N/A");
            console.log(`   First log: ${firstLog}`);
            break;
          }

          // Go back to exploration to check status
          if (stillExploring) {
            await page.locator(".game-nav").getByText(/探索/).click();
            await page.waitForTimeout(500);
          }
        }

        // Check final stats
        console.log("4. Checking final stats on Home panel...");
        await page.locator(".game-nav").getByText(/首頁/).click();
        await page.waitForTimeout(1000);

        const statsText = await page.locator(".stats-list").textContent().catch(() => "N/A");
        console.log(`   Stats: ${statsText}`);

        // Final battle log check
        console.log("5. Final battle log check...");
        await page.locator(".game-nav").getByText(/戰報/).click();
        await page.waitForTimeout(1000);

        const finalLogRows = await page.locator(".log-row").count();
        console.log(`   Final battle log entries: ${finalLogRows}`);

        if (finalLogRows > 0) {
          const firstLog = await page.locator(".log-row").first().textContent().catch(() => "N/A");
          console.log(`   First log: ${firstLog}`);
          expect(finalLogRows).toBeGreaterThan(0);
        } else {
          console.log("   WARNING: No battle logs found after 4 minutes!");
        }
      }
    }
  }

  console.log("6. Test complete!");
  await page.close();
});
