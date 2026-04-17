import { test, expect } from "@playwright/test";

const BASE_URL = "https://mega-idle-dev.onrender.com";

test("Quick Game Verification - All Panels Accessible", async ({ page }) => {
  test.setTimeout(120000);

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

  // Check all nav tabs are accessible
  const navTabs = ["首頁", "英雄", "建築", "探索", "隊伍", "公會", "製作", "背包", "軍隊", "世界王", "戰報", "獎勵"];
  const results: string[] = [];

  for (const tab of navTabs) {
    try {
      await page.locator(".game-nav").getByText(new RegExp(tab)).click();
      await page.waitForTimeout(500);

      // Check for error messages (panel load failures)
      const errorVisible = await page.locator("text=Error").isVisible().catch(() => false);
      const loadingError = await page.locator("text=載入失敗").isVisible().catch(() => false);

      if (errorVisible || loadingError) {
        results.push(`❌ ${tab}: Error loading`);
      } else {
        results.push(`✅ ${tab}: OK`);
      }
    } catch (e) {
      results.push(`❌ ${tab}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  console.log("\n=== Panel Accessibility Results ===");
  results.forEach(r => console.log(r));

  // Verify key stats
  console.log("\n=== Game State ===");

  // Home panel
  await page.locator(".game-nav").getByText(/首頁/).click();
  await page.waitForTimeout(500);
  const goldText = await page.locator(".gold").textContent().catch(() => "N/A");
  const heroCount = await page.locator(".hero-chip").count();
  console.log(`Gold: ${goldText}`);
  console.log(`Hero chips visible: ${heroCount}`);

  // Heroes panel - check territory vs wandering
  await page.locator(".game-nav").getByText(/英雄/).click();
  await page.waitForTimeout(500);
  const territoryTab = page.locator(".tab-bar .tab").filter({ hasText: /領地/ });
  const wanderingTab = page.locator(".tab-bar .tab").filter({ hasText: /流浪/ });

  await territoryTab.click();
  await page.waitForTimeout(300);
  const territoryCount = await page.locator(".hero-row").count();

  await wanderingTab.click();
  await page.waitForTimeout(300);
  const wanderingCount = await page.locator(".hero-row").count();

  console.log(`Territory heroes: ${territoryCount}`);
  console.log(`Wandering heroes: ${wanderingCount}`);

  // Buildings panel
  await page.locator(".game-nav").getByText(/建築/).click();
  await page.waitForTimeout(500);
  const buildingCount = await page.locator(".bld-item").count();
  console.log(`Buildings displayed: ${buildingCount}`);

  console.log("\n=== Test Complete ===");
});
