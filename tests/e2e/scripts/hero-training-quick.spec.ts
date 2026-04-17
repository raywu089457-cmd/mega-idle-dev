import { test, expect } from "@playwright/test";

const BASE_URL = "https://mega-idle-dev.onrender.com";

/**
 * Quick Hero Training Test - Single training
 * Train hero once and check if level increases
 */
test("Quick Hero Training Test - Train hero once", async ({ page }) => {
  test.setTimeout(60000);

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

  console.log("\n=== Quick Hero Training Test ===");

  // Check initial gold
  await page.locator(".game-nav").getByText(/首頁/).click();
  await page.waitForTimeout(1000);
  const goldText = await page.locator(".gold").first().textContent();
  console.log(`1. Initial Gold: ${goldText}`);

  // Go to Heroes panel
  console.log("2. Going to Heroes panel...");
  await page.locator(".game-nav").getByText(/英雄/).click();
  await page.waitForTimeout(1000);

  const territoryTab = page.locator(".tab-bar .tab").filter({ hasText: /領地/ });
  await territoryTab.click();
  await page.waitForTimeout(500);

  // Click first hero to open detail
  const firstHero = page.locator(".hero-row").first();
  const heroName = await firstHero.locator(".hero-name").textContent();
  const heroLevel = await firstHero.locator(".hero-lv").textContent();
  console.log(`3. Selected hero: ${heroName} ${heroLevel}`);

  await firstHero.click();
  await page.waitForTimeout(500);

  // Get training cost before clicking
  const trainBtn = page.locator("button").filter({ hasText: /訓練/i });
  const btnText = await trainBtn.textContent().catch(() => "");
  console.log(`4. Train button: "${btnText}"`);

  // Click train
  if (await trainBtn.count() > 0) {
    await trainBtn.click();
    console.log("5. Training clicked");
    await page.waitForTimeout(3000); // Wait for API + SSE

    // Close and reopen to check new level
    const closeBtn = page.locator(".btn-close");
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      await firstHero.click();
      await page.waitForTimeout(500);
    }

    const newLevel = await page.locator(".hero-lv").textContent().catch(() => "unknown");
    console.log(`6. Level after training: ${newLevel}`);
  }

  // Check final gold
  await page.locator(".game-nav").getByText(/首頁/).click();
  await page.waitForTimeout(1000);
  const finalGold = await page.locator(".gold").first().textContent();
  console.log(`7. Final Gold: ${finalGold}`);

  console.log("\n=== TEST COMPLETE ===");
});
