import { test, expect } from "@playwright/test";

const BASE_URL = "https://mega-idle-dev.onrender.com";

test("Recruit specific wandering hero - select then recruit", async ({ page }) => {
  test.setTimeout(90000);

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

  // Navigate to Heroes panel
  console.log("Going to Heroes panel...");
  await page.locator(".game-nav").getByText(/英雄/).click();
  await page.waitForTimeout(1000);

  // Switch to wandering tab
  const wanderingTab = page.locator(".tab-bar .tab").filter({ hasText: /流浪/ });
  await wanderingTab.click();
  await page.waitForTimeout(500);

  // Count initial wandering heroes
  const initialWanderingCount = await page.locator(".hero-row").count();
  console.log(`Wandering heroes: ${initialWanderingCount}`);

  // Count initial territory heroes
  const territoryTab = page.locator(".tab-bar .tab").filter({ hasText: /領地/ });
  await territoryTab.click();
  await page.waitForTimeout(500);
  const initialTerritoryCount = await page.locator(".hero-row").count();
  console.log(`Territory heroes before: ${initialTerritoryCount}`);

  // Go back to wandering
  await wanderingTab.click();
  await page.waitForTimeout(500);

  // Click on a wandering hero to select it
  const firstWanderingHero = page.locator(".hero-row").first();
  const heroName = await firstWanderingHero.locator(".hero-name").textContent();
  console.log(`Selecting hero: ${heroName}`);
  await firstWanderingHero.click();
  await page.waitForTimeout(300);

  // Check if hero row is highlighted (selected class)
  const isSelected = await firstWanderingHero.evaluate(el => el.classList.contains("selected"));
  console.log(`Hero is selected: ${isSelected}`);

  // Check recruit button text
  const recruitBtn = page.locator(".panel-footer .btn-primary");
  const btnText = await recruitBtn.textContent();
  console.log(`Recruit button text: ${btnText}`);

  // Click recruit
  console.log("Clicking recruit button...");
  await recruitBtn.click();
  await page.waitForTimeout(2000);

  // Check the message
  const msg = await page.locator(".msg").textContent().catch(() => null);
  console.log(`Message: ${msg}`);

  // Go to territory tab and verify count increased
  await territoryTab.click();
  await page.waitForTimeout(500);
  const finalTerritoryCount = await page.locator(".hero-row").count();
  console.log(`Territory heroes after: ${finalTerritoryCount}`);

  // Verify recruitment worked
  if (finalTerritoryCount > initialTerritoryCount) {
    console.log("✅ Recruitment successful!");
  } else {
    console.log("❌ Recruitment may have failed");
  }

  // Go back to wandering to verify count decreased
  await wanderingTab.click();
  await page.waitForTimeout(500);
  const finalWanderingCount = await page.locator(".hero-row").count();
  console.log(`Final wandering heroes: ${finalWanderingCount}`);

  console.log("Test complete!");
});
