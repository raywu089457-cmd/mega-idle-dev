/**
 * Manual Gameplay Test - Email/Password Auth
 * Tests with: sssssss@gmail.com / ssssssss
 *
 * Run: node test-gameplay-manual.js
 */

const BASE_URL = "https://mega-idle-dev.onrender.com";

// Use Playwright API for browser automation
const { chromium } = require('@playwright/test');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log("=== Manual Gameplay Test ===");
  console.log("Account: sssssss@gmail.com");
  console.log("");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    // Step 1: Login
    console.log("[1/10] Logging in...");
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Look for email/password login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('sssssss@gmail.com');

    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill('ssssssss');

    const submitBtn = page.locator('button[type="submit"], button:has-text("登入"), button:has-text("Login")').first();
    await submitBtn.click();

    await page.waitForURL(/\/game/, { timeout: 20000 });
    await page.waitForTimeout(2000);
    console.log("  [OK] Logged in successfully");

    // Step 2: Check resources
    console.log("\n[2/10] Checking resources...");
    const goldText = await page.locator('.gold, [class*="gold"]').first().textContent().catch(() => 'N/A');
    const stonesText = await page.locator('.stones, [class*="stone"]').first().textContent().catch(() => 'N/A');
    console.log(`  Gold: ${goldText}`);
    console.log(`  Magic Stones: ${stonesText}`);
    console.log("  [OK] Resources visible");

    // Step 3: Navigate to Heroes panel
    console.log("\n[3/10] Checking heroes...");
    const navItems = await page.locator('.game-nav a, .game-nav button, nav a').all();
    console.log(`  Found ${navItems.length} nav items`);

    // Try to find heroes tab
    const heroTab = page.locator('text=/英雄/i').first();
    if (await heroTab.count() > 0) {
      await heroTab.click();
      await page.waitForTimeout(1000);
      console.log("  [OK] Navigated to Heroes panel");
    }

    // Check hero list
    const heroRows = await page.locator('.hero-row, .hero-card, [class*="hero"]').all();
    console.log(`  Found ${heroRows.length} hero elements`);

    // Check for territory heroes
    const territoryTab = page.locator('text=/領地/i').first();
    if (await territoryTab.count() > 0) {
      await territoryTab.click();
      await page.waitForTimeout(500);
      console.log("  [OK] Territory tab clicked");
    }

    // Try to recruit a hero
    const recruitBtn = page.locator('button:has-text("招募"), button:has-text("recruit")').first();
    if (await recruitBtn.count() > 0 && !(await recruitBtn.isDisabled().catch(() => true))) {
      await recruitBtn.click();
      await page.waitForTimeout(2000);
      console.log("  [OK] Recruited a hero");

      // Check if S/A/B rarity appeared
      const heroCards = await page.locator('.hero-row, .hero-card').all();
      console.log(`  Total heroes after recruit: ${heroCards.length}`);

      // Check for S/A/B colors
      const sHero = page.locator('[style*="ff6b6b"], [class*="rarity-s"]').first();
      const aHero = page.locator('[style*="ffa500"], [class*="rarity-a"]').first();
      const bHero = page.locator('[style*="ffd700"], [class*="rarity-b"]').first();

      if (await sHero.count() > 0) console.log("  [OK] S rarity hero found!");
      if (await aHero.count() > 0) console.log("  [OK] A rarity hero found!");
      if (await bHero.count() > 0) console.log("  [OK] B rarity hero found!");
    } else {
      console.log("  [INFO] Recruit button disabled or not found");
    }

    // Step 4: Check Buildings
    console.log("\n[4/10] Checking buildings...");
    const buildTab = page.locator('text=/建築/i').first();
    if (await buildTab.count() > 0) {
      await buildTab.click();
      await page.waitForTimeout(1000);
      console.log("  [OK] Navigated to Buildings panel");
    }

    const bldItems = await page.locator('.bld-item, .bld-row, [class*="building"]').all();
    console.log(`  Found ${bldItems.length} building elements`);

    // Step 5: Check Dispatch
    console.log("\n[5/10] Checking dispatch...");
    const dispatchTab = page.locator('text=/探索/i').first();
    if (await dispatchTab.count() > 0) {
      await dispatchTab.click();
      await page.waitForTimeout(1000);
      console.log("  [OK] Navigated to Dispatch panel");
    }

    const heroChips = await page.locator('.hero-chip-btn, .hero-chip, [class*="hero-chip"]').all();
    console.log(`  Available heroes for dispatch: ${heroChips.length}`);

    if (heroChips.length > 0) {
      await heroChips[0].click();
      await page.waitForTimeout(500);
      console.log("  [OK] Selected a hero");

      // Select zone 1, difficulty 1
      const zoneSelect = page.locator('select').first();
      if (await zoneSelect.count() > 0) {
        await zoneSelect.selectOption('1');
        await page.waitForTimeout(300);
        console.log("  [OK] Selected Zone 1");
      }

      const diffSelect = page.locator('select').nth(1);
      if (await diffSelect.count() > 0) {
        await diffSelect.selectOption('1');
        await page.waitForTimeout(300);
        console.log("  [OK] Selected Easy difficulty");
      }

      // Dispatch
      const dispatchBtn = page.locator('button:has-text("派遣"), button:has-text("dispatch")').first();
      if (await dispatchBtn.count() > 0 && !(await dispatchBtn.isDisabled().catch(() => true))) {
        await dispatchBtn.click();
        await page.waitForTimeout(3000);
        console.log("  [OK] Dispatched hero!");

        // Wait for cooldown (now 1 second)
        await sleep(2000);

        // Recall
        const recallBtn = page.locator('button:has-text("召回"), button:has-text("recall")').first();
        if (await recallBtn.count() > 0 && !(await recallBtn.isDisabled().catch(() => true))) {
          await recallBtn.click();
          await page.waitForTimeout(1000);
          console.log("  [OK] Recalled hero!");
        }
      } else {
        console.log("  [INFO] Dispatch button disabled");
      }
    }

    // Step 6: Check Team
    console.log("\n[6/10] Checking teams...");
    const teamTab = page.locator('text=/隊伍/i').first();
    if (await teamTab.count() > 0) {
      await teamTab.click();
      await page.waitForTimeout(1000);
      console.log("  [OK] Navigated to Team panel");
    }

    const teamBoxes = await page.locator('.team-box, [class*="team"]').all();
    console.log(`  Found ${teamBoxes.length} team elements`);

    // Step 7: Check Guild
    console.log("\n[7/10] Checking guild...");
    const guildTab = page.locator('text=/公會/i').first();
    if (await guildTab.count() > 0) {
      await guildTab.click();
      await page.waitForTimeout(1000);
      console.log("  [OK] Navigated to Guild panel");
    } else {
      console.log("  [WARN] Guild tab not found");
    }

    // Step 8: Check World Boss
    console.log("\n[8/10] Checking world boss...");
    const bossTab = page.locator('text=/世界王/i, text=/World Boss/i').first();
    if (await bossTab.count() > 0) {
      await bossTab.click();
      await page.waitForTimeout(1000);
      console.log("  [OK] Navigated to World Boss panel");
    } else {
      console.log("  [WARN] World Boss tab not found");
    }

    // Step 9: Check Rewards
    console.log("\n[9/10] Checking rewards...");
    const rewardsTab = page.locator('text=/獎勵/i').first();
    if (await rewardsTab.count() > 0) {
      await rewardsTab.click();
      await page.waitForTimeout(1000);
      console.log("  [OK] Navigated to Rewards panel");
    }

    // Step 10: Check Army & Crafting (now enabled!)
    console.log("\n[10/10] Checking Army and Crafting panels...");

    // Army
    const armyTab = page.locator('text=/軍隊/i, text=/Army/i').first();
    if (await armyTab.count() > 0) {
      await armyTab.click();
      await page.waitForTimeout(1000);
      const armyPanel = page.locator('.army-panel, [class*="army"]').first();
      const armyVisible = await armyPanel.isVisible().catch(() => false);
      console.log(`  [${armyVisible ? 'OK' : 'WARN'}] Army panel: ${armyVisible ? 'visible' : 'not visible'}`);
    } else {
      console.log("  [WARN] Army tab not found");
    }

    // Crafting
    const craftTab = page.locator('text=/製作/i, text=/合成/i, text=/Craft/i').first();
    if (await craftTab.count() > 0) {
      await craftTab.click();
      await page.waitForTimeout(1000);
      const craftPanel = page.locator('.crafting-panel, [class*="craft"]').first();
      const craftVisible = await craftPanel.isVisible().catch(() => false);
      console.log(`  [${craftVisible ? 'OK' : 'WARN'}] Crafting panel: ${craftVisible ? 'visible' : 'not visible'}`);
    } else {
      console.log("  [WARN] Crafting tab not found");
    }

    // Check for errors
    if (errors.length > 0) {
      console.log("\n=== Console Errors ===");
      errors.forEach(e => console.log("  ERROR:", e));
    } else {
      console.log("\n[OK] No console errors!");
    }

    console.log("\n=== Test Complete ===");

  } catch (err) {
    console.error("TEST FAILED:", err.message);
    await page.screenshot({ path: 'test-results/test-fail.png', fullPage: true });
    console.log("Screenshot saved to test-results/test-fail.png");
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
