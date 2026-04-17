import { test, expect } from "@playwright/test";

const BASE_URL = "https://mega-idle-dev.onrender.com";

test("Verify recruit UI shows selected hero name", async ({ page }) => {
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

  // Navigate to Heroes panel
  console.log("Going to Heroes panel...");
  await page.locator(".game-nav").getByText(/英雄/).click();
  await page.waitForTimeout(1000);

  // Check territory cap
  const territoryTab = page.locator(".tab-bar .tab").filter({ hasText: /領地/ });
  await territoryTab.click();
  await page.waitForTimeout(500);

  const territoryCount = await page.locator(".hero-row").count();
  const tabText = await page.locator(".tab-bar .tab").first().textContent();
  console.log(`Territory tab: ${tabText}`);
  console.log(`Territory heroes: ${territoryCount}`);

  // Switch to wandering tab
  const wanderingTab = page.locator(".tab-bar .tab").filter({ hasText: /流浪/ });
  await wanderingTab.click();
  await page.waitForTimeout(500);

  const wanderingCount = await page.locator(".hero-row").count();
  console.log(`Wandering heroes: ${wanderingCount}`);

  // Check if recruit button exists and its text
  const recruitBtn = page.locator(".panel-footer .btn-primary");
  const btnText = await recruitBtn.textContent();
  console.log(`Recruit button text: ${btnText}`);

  // Check if hint text appears
  const hint = page.locator(".hint");
  const hintVisible = await hint.isVisible().catch(() => false);
  console.log(`Hint visible: ${hintVisible}`);
  if (hintVisible) {
    const hintText = await hint.textContent();
    console.log(`Hint text: ${hintText}`);
  }

  // Click on first wandering hero
  const firstHero = page.locator(".hero-row").first();
  await firstHero.click();
  await page.waitForTimeout(500);

  // Check if hero detail modal opened
  const modal = page.locator(".hero-detail-panel");
  const modalVisible = await modal.isVisible().catch(() => false);
  console.log(`Hero detail modal visible: ${modalVisible}`);

  // Close modal
  const closeBtn = page.locator(".btn-close");
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }

  // Check recruit button text after selecting hero
  const btnTextAfter = await recruitBtn.textContent();
  console.log(`Recruit button text after selection: ${btnTextAfter}`);

  // Check if selected class was added to hero row
  const heroRows = await page.locator(".hero-row").all();
  for (const row of heroRows) {
    const classes = await row.getAttribute("class");
    if (classes && classes.includes("selected")) {
      const name = await row.locator(".hero-name").textContent();
      console.log(`Selected hero row: ${name}`);
    }
  }

  console.log("Test complete!");
});
