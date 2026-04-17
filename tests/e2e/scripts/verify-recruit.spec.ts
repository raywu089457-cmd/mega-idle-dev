import { test, expect } from "@playwright/test";

const BASE_URL = "https://mega-idle-dev.onrender.com";

test("Verify hero recruitment works", async ({ page }) => {
  test.setTimeout(60000);

  console.log("1. Going to game page...");
  await page.goto(`${BASE_URL}/game`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  console.log("   Page loaded");

  // Check if logged in
  const url = page.url();
  console.log(`   Current URL: ${url}`);

  if (url.includes("auth") || url === BASE_URL + "/") {
    console.log("   Not logged in, clicking Discord login...");
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1000);
    await page.locator(".discord-btn").click();
    await page.waitForURL(`${BASE_URL}/game`, { timeout: 30000 });
    await page.waitForTimeout(2000);
  }

  await page.waitForTimeout(2000);

  // Navigate to Heroes panel
  console.log("2. Going to Heroes panel...");
  await page.locator(".game-nav").getByText(/英雄/).click();
  await page.waitForTimeout(1000);

  // Check initial state - territory tab
  const territoryTab = page.locator(".tab-bar .tab").first();
  await territoryTab.click();
  await page.waitForTimeout(500);

  const initialCount = await page.locator(".hero-row").count();
  console.log(`   Initial territory heroes: ${initialCount}`);

  // Try recruit on territory tab
  const recruitBtn = page.locator(".panel-footer .btn-primary").filter({ hasText: /招募/ });
  const btnText = await recruitBtn.textContent();
  console.log(`   Recruit button: ${btnText}`);
  const isDisabled = await recruitBtn.isDisabled();
  console.log(`   Button disabled: ${isDisabled}`);

  if (!isDisabled) {
    await recruitBtn.click();
    await page.waitForTimeout(2000);
    const newCount = await page.locator(".hero-row").count();
    console.log(`   After recruit attempt: ${newCount} heroes`);

    const msg = await page.locator(".msg").textContent().catch(() => null);
    console.log(`   Message: ${msg}`);
  }

  // Check wandering tab
  console.log("3. Checking wandering tab...");
  const wanderingTab = page.locator(".tab-bar .tab").filter({ hasText: /流浪/ });
  await wanderingTab.click();
  await page.waitForTimeout(500);

  const wanderingCount = await page.locator(".hero-row").count();
  console.log(`   Wandering heroes: ${wanderingCount}`);

  // Try recruit all
  const recruitAllBtn = page.locator(".btn-secondary").filter({ hasText: /招募全部/ });
  if (await recruitAllBtn.isVisible()) {
    const allDisabled = await recruitAllBtn.isDisabled();
    console.log(`   Recruit All disabled: ${allDisabled}`);
    if (!allDisabled) {
      await recruitAllBtn.click();
      await page.waitForTimeout(3000);
      console.log("   Recruit All clicked!");

      // Go back to territory
      await territoryTab.click();
      await page.waitForTimeout(1000);
      const finalTerritory = await page.locator(".hero-row").count();
      console.log(`   Final territory heroes: ${finalTerritory}`);
    }
  }

  console.log("   Test complete!");
});
