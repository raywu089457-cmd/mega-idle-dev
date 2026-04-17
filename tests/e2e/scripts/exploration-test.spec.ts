import { test, expect, Browser } from "@playwright/test";
import { getAuthenticatedPage } from "./helpers/auth";

const BASE_URL = "https://mega-idle-dev.onrender.com";

test("Exploration Battle Test - Dispatch and wait for battle result", async ({ browser }) => {
  test.setTimeout(120000);

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

    // Select zone 1, easy
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

        // Wait 35 seconds for battle to process
        console.log("3. Waiting 35 seconds for exploration battle...");
        await page.waitForTimeout(35000);

        // Recall hero
        const recallBtn = page.locator("button").filter({ hasText: /召回/i }).first();
        if (await recallBtn.count() > 0) {
          await recallBtn.click();
          await page.waitForTimeout(2000);
          console.log("   Hero recalled");
        }

        // Check home panel stats
        console.log("4. Checking stats on Home panel...");
        await page.locator(".game-nav").getByText(/首頁/).click();
        await page.waitForTimeout(1000);

        const statsText = await page.locator(".stats-list").textContent().catch(() => "N/A");
        console.log(`   Stats: ${statsText}`);

        // Check battle logs
        console.log("5. Checking battle logs...");
        await page.locator(".game-nav").getByText(/戰報/).click();
        await page.waitForTimeout(1000);

        const logRows = await page.locator(".log-row").count();
        console.log(`   Battle log entries: ${logRows}`);

        if (logRows > 0) {
          const firstLog = await page.locator(".log-row").first().textContent().catch(() => "N/A");
          console.log(`   First log: ${firstLog}`);
        }
      }
    }
  }

  console.log("6. Test complete!");
  await page.close();
});
