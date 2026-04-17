const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('1. Navigating to game...');
  await page.goto('https://mega-idle-dev.onrender.com/game', { timeout: 30000 });

  // Wait for page to load
  await page.waitForTimeout(3000);

  // Check if logged in
  const url = page.url();
  console.log(`   URL: ${url}`);

  if (!url.includes('/game')) {
    console.log('   Not logged in, exiting...');
    await browser.close();
    return;
  }

  // Go to battle logs
  console.log('2. Navigating to battle logs...');
  await page.locator('.game-nav').getByText(/戰報/).click();
  await page.waitForTimeout(2000);

  const logCount = await page.locator('.log-row').count();
  console.log(`   Battle log entries: ${logCount}`);

  // Go to home to see stats
  console.log('3. Checking stats...');
  await page.locator('.game-nav').getByText(/首頁/).click();
  await page.waitForTimeout(2000);

  const stats = await page.locator('.stats-list').textContent().catch(() => '');
  console.log(`   Stats: ${stats}`);

  // Go to heroes
  console.log('4. Checking hero levels...');
  await page.locator('.game-nav').getByText(/英雄/).click();
  await page.waitForTimeout(1000);

  const territoryTab = page.locator('.tab-bar .tab').filter({ hasText: /領地/ });
  await territoryTab.click();
  await page.waitForTimeout(500);

  const heroRows = await page.locator('.hero-row').all();
  let maxLevel = 0;
  let maxHero = '';
  for (const row of heroRows) {
    const name = await row.locator('.hero-name').textContent().catch(() => '');
    const level = await row.locator('.hero-lv').textContent().catch(() => 'Lv.0');
    const levelNum = parseInt(level.replace(/[^\d]/g, ''), 10) || 0;
    if (levelNum > maxLevel) {
      maxLevel = levelNum;
      maxHero = name;
    }
  }
  console.log(`   Max hero: ${maxHero} Lv.${maxLevel}`);

  console.log('\n=== DONE ===');
  await browser.close();
})();