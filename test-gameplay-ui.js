/**
 * Gameplay UI Test - Auto Register + Login
 * Tests all new features on a fresh account
 *
 * Run: node test-gameplay-ui.js
 */

const { chromium } = require('playwright');

const BASE_URL = 'https://mega-idle-dev.onrender.com';

function generateEmail() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `mega-test-${ts}-${rand}@example.com`;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('=== Gameplay UI Test (Auto Register) ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  const testEmail = generateEmail();
  const testPassword = 'TestPass123!';
  console.log(`Test email: ${testEmail}\n`);

  try {
    // ============ REGISTER ============
    console.log('[REGISTER] Loading landing page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(2000);
    await page.screenshot({ path: 'test-results/01-landing.png', fullPage: true });

    // Click register link
    const registerLink = page.locator('text=/註冊/i').first();
    await registerLink.click();
    await sleep(2000);
    await page.screenshot({ path: 'test-results/02-register-form.png', fullPage: true });

    // Fill form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);

    const usernameInput = page.locator('input[name="username"], input[placeholder*="名稱"]').first();
    if (await usernameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await usernameInput.fill('TestPlayer');
    }

    await page.locator('button[type="submit"]').first().click();
    console.log('[REGISTER] Form submitted');
    await sleep(5000);

    const url = page.url();
    console.log(`[REGISTER] URL after submit: ${url}`);

    if (!url.includes('/game')) {
      // Check for error
      const bodyText = await page.locator('body').innerText();
      console.log(`  Page text: "${bodyText.slice(0, 300)}"`);
      await page.screenshot({ path: 'test-results/03-register-result.png', fullPage: true });

      // Try login mode instead
      const loginLink = page.locator('text=/已有帳號/i, text=/登入/i').first();
      if (await loginLink.count() > 0) {
        await loginLink.click();
        await sleep(1000);
      }

      // Try logging in
      await emailInput.fill(testEmail);
      await passwordInput.fill(testPassword);
      await page.locator('button[type="submit"]').first().click();
      await sleep(5000);
      console.log(`[LOGIN] URL after login: ${page.url()}`);
    }

    if (!page.url().includes('/game')) {
      console.log('[ERROR] Could not reach /game page');
      await browser.close();
      return;
    }

    console.log('[OK] Logged in successfully!');
    await page.screenshot({ path: 'test-results/04-game-loaded.png', fullPage: true });

    // ============ CLAIM DAILY REWARD ============
    console.log('\n[REWARDS] Claiming daily reward...');
    const rewardsTab = page.locator('text=/獎勵/i').first();
    await rewardsTab.click();
    await sleep(2000);
    await page.screenshot({ path: 'test-results/05-rewards.png', fullPage: true });

    const claimDailyBtn = page.locator('button:has-text("每日"), button:has-text("領取")').first();
    if (await claimDailyBtn.count() > 0) {
      const disabled = await claimDailyBtn.isDisabled().catch(() => true);
      if (!disabled) {
        await claimDailyBtn.click();
        await sleep(2000);
        console.log('[OK] Claimed daily reward!');
      } else {
        console.log('[INFO] Daily reward on cooldown');
      }
    }

    // ============ RECRUIT HEROES ============
    console.log('\n[HEROES] Recruiting heroes...');
    const heroTab = page.locator('text=/英雄/i').first();
    await heroTab.click();
    await sleep(2000);

    // Check territory tab
    const territoryTab = page.locator('text=/領地/i').first();
    if (await territoryTab.count() > 0) {
      await territoryTab.click();
      await sleep(1000);
    }

    // Recruit as many as possible
    const recruitBtn = page.locator('button:has-text("招募")').first();
    let recruitedCount = 0;
    for (let i = 0; i < 20; i++) {
      const btn = page.locator('button:has-text("招募")').first();
      const disabled = await btn.isDisabled().catch(() => true);
      if (disabled) {
        console.log(`  Recruit disabled at ${i}`);
        break;
      }
      await btn.click();
      await sleep(1500);
      recruitedCount++;
    }
    console.log(`[OK] Recruited ${recruitedCount} territory heroes`);

    await page.screenshot({ path: 'test-results/06-heroes.png', fullPage: true });

    // Check for S/A/B heroes (recruit 20 times should have decent chance)
    const heroRows = await page.locator('.hero-row').all();
    console.log(`  Total territory heroes: ${heroRows.length}`);

    // Log hero details
    for (let i = 0; i < Math.min(heroRows.length, 5); i++) {
      const text = await heroRows[i].innerText().catch(() => '');
      console.log(`  Hero ${i + 1}: "${text.slice(0, 80).replace(/\n/g, ' | ')}"`);
    }

    // Check for S/A/B colors in hero names or badges
    const sHero = page.locator('text=/S[級典]/i').first();
    const aHero = page.locator('text=/A[級典]/i').first();
    const bHero = page.locator('text=/B[級典]/i').first();
    console.log(`  S hero found: ${await sHero.count() > 0}`);
    console.log(`  A hero found: ${await aHero.count() > 0}`);
    console.log(`  B hero found: ${await bHero.count() > 0}`);

    // ============ DISPATCH ============
    console.log('\n[DISPATCH] Testing dispatch...');
    const dispatchTab = page.locator('text=/探索/i').first();
    await dispatchTab.click();
    await sleep(2000);
    await page.screenshot({ path: 'test-results/07-dispatch.png', fullPage: true });

    const idleHeroes = await page.locator('.hero-chip-btn').all();
    console.log(`  Idle heroes available: ${idleHeroes.length}`);

    if (idleHeroes.length > 0) {
      // Select first 3 heroes
      for (let i = 0; i < Math.min(idleHeroes.length, 3); i++) {
        await idleHeroes[i].click();
        await sleep(300);
      }
      console.log('  Selected heroes');

      // Select zone 1, difficulty easy (subZone 1)
      const selects = await page.locator('select').all();
      if (selects.length >= 1) {
        await selects[0].selectOption('1');
        await sleep(200);
      }
      if (selects.length >= 2) {
        await selects[1].selectOption('1'); // easy
        await sleep(200);
      }

      const dispatchBtn = page.locator('button:has-text("派遣")').first();
      const disabled = await dispatchBtn.isDisabled().catch(() => true);
      if (!disabled) {
        await dispatchBtn.click();
        await sleep(3000);
        console.log('[OK] Dispatched heroes!');

        // Wait cooldown (now 1 second)
        await sleep(2000);

        // Recall
        const recallBtn = page.locator('button:has-text("召回")').first();
        const recallDisabled = await recallBtn.isDisabled().catch(() => true);
        if (!recallDisabled) {
          await recallBtn.click();
          await sleep(1000);
          console.log('[OK] Recalled heroes!');
        }
      } else {
        console.log('[INFO] Dispatch button disabled');
      }
    }

    // ============ TEAM ============
    console.log('\n[TEAM] Testing team management...');
    const teamTab = page.locator('text=/隊伍/i').first();
    await teamTab.click();
    await sleep(2000);
    await page.screenshot({ path: 'test-results/08-team.png', fullPage: true });

    const teamBoxes = await page.locator('.team-box').all();
    console.log(`  Team boxes: ${teamBoxes.length}`);

    // Add hero to team 0
    const idlePoolHeroes = await page.locator('.hero-pool .hero-chip-btn').all();
    if (idlePoolHeroes.length > 0) {
      await idlePoolHeroes[0].click();
      await sleep(500);

      const addBtn = page.locator('.team-box').first().locator('button').first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await sleep(1000);
        console.log('[OK] Added hero to team 0');
      }
    }
    await page.screenshot({ path: 'test-results/09-team-with-hero.png', fullPage: true });

    // ============ BUILDINGS ============
    console.log('\n[BUILDINGS] Testing buildings...');
    const buildTab = page.locator('text=/建築/i').first();
    await buildTab.click();
    await sleep(2000);
    await page.screenshot({ path: 'test-results/10-buildings.png', fullPage: true });

    const bldItems = await page.locator('.bld-item').all();
    console.log(`  Building items: ${bldItems.length}`);

    // Try to upgrade a building
    const upgradeBtn = page.locator('button:has-text("升級")').first();
    if (await upgradeBtn.count() > 0) {
      const disabled = await upgradeBtn.isDisabled().catch(() => true);
      if (!disabled) {
        await upgradeBtn.click();
        await sleep(2000);
        console.log('[OK] Upgraded a building');
      }
    }

    // ============ ARMY (now enabled!) ============
    console.log('\n[ARMY] Testing army panel...');
    const armyTab = page.locator('text=/軍隊/i').first();
    if (await armyTab.count() > 0) {
      await armyTab.click();
      await sleep(2000);
      await page.screenshot({ path: 'test-results/11-army.png', fullPage: true });
      const armyVisible = await page.locator('.army-panel, [class*="army"]').first().isVisible().catch(() => false);
      console.log(`  [${armyVisible ? 'OK' : 'WARN'}] Army panel: ${armyVisible ? 'VISIBLE' : 'not visible'}`);
    } else {
      console.log('  [WARN] Army tab not found in nav');
    }

    // ============ CRAFTING (now enabled!) ============
    console.log('\n[CRAFTING] Testing crafting panel...');
    const craftTab = page.locator('text=/製作/i, text=/合成/i').first();
    if (await craftTab.count() > 0) {
      await craftTab.click();
      await sleep(2000);
      await page.screenshot({ path: 'test-results/12-crafting.png', fullPage: true });
      const craftVisible = await page.locator('.crafting-panel, [class*="crafting"]').first().isVisible().catch(() => false);
      console.log(`  [${craftVisible ? 'OK' : 'WARN'}] Crafting panel: ${craftVisible ? 'VISIBLE' : 'not visible'}`);
    } else {
      console.log('  [WARN] Crafting tab not found');
    }

    // ============ STATISTICS CHECK ============
    console.log('\n[STATS] Checking statistics...');
    await page.goto(`${BASE_URL}/api/user`, { waitUntil: 'networkidle' }).catch(() => {});
    await sleep(2000);
    const apiText = await page.locator('body').innerText().catch(() => '');
    try {
      const apiData = JSON.parse(apiText);
      console.log('  productionRates:', JSON.stringify(apiData.productionRates, null, 2));
      console.log('  statistics keys:', Object.keys(apiData.statistics || {}));
      console.log('  materials keys:', Object.keys(apiData.materials || {}));
    } catch {
      console.log('  Could not parse /api/user response');
    }

    // ============ ERRORS ============
    if (errors.length > 0) {
      console.log('\n[CONSOLE ERRORS]');
      errors.slice(0, 10).forEach(e => console.log(`  ERROR: ${e.slice(0, 200)}`));
    } else {
      console.log('\n[OK] No console errors!');
    }

    console.log('\n=== ALL TESTS COMPLETE ===');
    console.log('Screenshots: test-results/*.png');

  } catch (err) {
    console.error('\nTEST ERROR:', err.message);
    await page.screenshot({ path: 'test-results/ERROR.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
