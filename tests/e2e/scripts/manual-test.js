/**
 * Manual E2E Test Script for Mega Idle Game
 *
 * Uses Playwright directly (not the test runner) to test all game features.
 * Session cookie should already exist from previous test runs.
 *
 * Run with: node tests/e2e/scripts/manual-test.js
 */

const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const SESSION_PATH = path.join(__dirname, '..', '.auth', 'discord-session.json');

// Tab label mappings (English -> Chinese found in game)
const TAB_LABELS = {
  'home': '首頁',
  'heroes': '英雄',
  'dispatch': '探索',
  'team': '隊伍',
  'buildings': '建築',
  'army': '軍隊',
  'worldboss': '世界王',
  'crafting': '製作',
  'guild': '公會',
  'inventory': '背包',
  'rewards': '獎勵',
  'stats': '統計',
  'logs': '戰報'
};

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  [Screenshot saved] ${name}.png`);
  return filePath;
}

async function runTest(name, fn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${name}`);
  console.log('='.repeat(60));
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.log(`  [FAIL] ${name}: ${err.message}`);
  }
}

async function clickTabByLabel(page, labels) {
  const allButtons = await page.locator('button').all();
  for (const btn of allButtons) {
    const text = await btn.textContent().catch(() => '');
    for (const label of labels) {
      if (text.includes(label)) {
        await btn.click();
        return true;
      }
    }
  }
  return false;
}

async function main() {
  console.log('Starting Mega Idle Game E2E Manual Test');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshot dir: ${SCREENSHOT_DIR}`);

  // Check for session file
  if (!fs.existsSync(SESSION_PATH)) {
    console.error('ERROR: No session file found at', SESSION_PATH);
    console.error('Please run login first to create session.');
    process.exit(1);
  }

  // Load browser
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-dev-shm-usage']
  });

  // Create context with stored session
  const context = await browser.newContext({
    storageState: SESSION_PATH,
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Helper to navigate with proper waiting
  async function goTo(url) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
  }

  // Test 1: Login Flow
  await runTest('1. Login Flow', async () => {
    await goTo(BASE_URL);

    const url = page.url();
    console.log(`  Current URL: ${url}`);

    if (url.includes('/game')) {
      console.log('  [OK] Redirected to /game');
      await screenshot(page, '01-login-game-shell');
    } else if (url.endsWith('/') || url === BASE_URL) {
      console.log('  [INFO] On landing page');
      await screenshot(page, '01-landing-page');
    }
  });

  // Test 2: Home Panel
  await runTest('2. Home Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    await screenshot(page, '02-home-panel');

    // Check for game shell
    const gameShell = page.locator('.game-shell');
    const shellVisible = await gameShell.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(shellVisible ? '  [OK] Game shell visible' : '  [WARN] Game shell not found');

    // Check for navigation bar
    const nav = page.locator('.game-nav');
    if (await nav.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  [OK] Navigation bar visible');
    }

    // Check for header info (gold, stones, username)
    const header = page.locator('.game-header');
    if (await header.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  [OK] Game header visible');
    }
  });

  // Test 3: Heroes Panel (英雄)
  await runTest('3. Heroes Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['英雄', 'heroes', 'Hero']);
    await page.waitForTimeout(500);
    await screenshot(page, '03-heroes-panel');

    if (found) {
      console.log('  [OK] Clicked 英雄 (Heroes) tab');

      // Check for hero cards
      const heroCards = page.locator('[class*="hero-card"], [data-testid*="hero"]');
      const count = await heroCards.count().catch(() => 0);
      if (count > 0) {
        console.log(`  [INFO] Found ${count} hero cards`);
      }

      // Check for XP bars
      const xpBars = page.locator('[class*="xp"], [class*="progress"]');
      const xpCount = await xpBars.count().catch(() => 0);
      if (xpCount > 0) {
        console.log(`  [INFO] Found ${xpCount} XP/progress bars`);
      }
    } else {
      console.log('  [WARN] Heroes tab not found');
    }
  });

  // Test 4: Dispatch/探索 Panel
  await runTest('4. Dispatch/探索 Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['探索', 'dispatch', 'Dispatch']);
    await page.waitForTimeout(500);
    await screenshot(page, '04-dispatch-panel');

    if (found) {
      console.log('  [OK] Clicked 探索 (Dispatch) tab');

      // Check for expedition slots or team selection
      const slots = page.locator('[class*="slot"], [class*="expedition"]');
      const count = await slots.count().catch(() => 0);
      if (count > 0) {
        console.log(`  [INFO] Found ${count} expedition/slot elements`);
      }

      // Check for explore/send button
      const exploreBtn = page.getByRole('button', { name: /探索|派遣|explore|send/i });
      if (await exploreBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Explore/Send button visible');
      }
    } else {
      console.log('  [WARN] Dispatch tab not found');
    }
  });

  // Test 5: Team Panel (隊伍)
  await runTest('5. Team Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['隊伍', 'team', 'Team']);
    await page.waitForTimeout(500);
    await screenshot(page, '05-team-panel');

    if (found) {
      console.log('  [OK] Clicked 隊伍 (Team) tab');

      // Check for team slots
      const slots = page.locator('[class*="slot"], [class*="team-slot"]');
      const count = await slots.count().catch(() => 0);
      if (count > 0) {
        console.log(`  [INFO] Found ${count} team slots`);
      }
    } else {
      console.log('  [WARN] Team tab not found');
    }
  });

  // Test 6: Buildings Panel (建築)
  await runTest('6. Buildings Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['建築', 'building', 'Building']);
    await page.waitForTimeout(500);
    await screenshot(page, '06-buildings-panel');

    if (found) {
      console.log('  [OK] Clicked 建築 (Buildings) tab');

      // Check for upgrade buttons
      const upgradeBtn = page.getByRole('button', { name: /升級|升等|upgrade/i });
      if (await upgradeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Upgrade button visible');
      }

      // Check for build new button
      const buildBtn = page.getByRole('button', { name: /建造|新建|build|new/i });
      if (await buildBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Build new button visible');
      }

      // Check for building list
      const buildings = page.locator('[class*="building"]');
      const count = await buildings.count().catch(() => 0);
      if (count > 0) {
        console.log(`  [INFO] Found ${count} building elements`);
      }
    } else {
      console.log('  [WARN] Buildings tab not found');
    }
  });

  // Test 7: Army Panel (軍隊)
  await runTest('7. Army Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['軍隊', 'army', 'Army']);
    await page.waitForTimeout(500);
    await screenshot(page, '07-army-panel');

    if (found) {
      console.log('  [OK] Clicked 軍隊 (Army) tab');

      // Check for unit training buttons
      const trainBtn = page.getByRole('button', { name: /訓練|招募|train|recruit/i });
      if (await trainBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Train/Recruit button visible');
      }

      // Check for armory
      const armory = page.getByText(/兵營|軍械|armory/i);
      if (await armory.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Armory/Barracks visible');
      }
    } else {
      console.log('  [WARN] Army tab not found');
    }
  });

  // Test 8: World Boss Panel (世界王)
  await runTest('8. World Boss Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['世界王', 'world boss', 'Boss']);
    await page.waitForTimeout(500);
    await screenshot(page, '08-world-boss-panel');

    if (found) {
      console.log('  [OK] Clicked 世界王 (World Boss) tab');

      // Check for boss HP/health bar
      const hpBar = page.locator('[class*="hp"], [class*="health"], [class*="boss"]');
      const count = await hpBar.count().catch(() => 0);
      if (count > 0) {
        console.log(`  [INFO] Found ${count} boss HP elements`);
      }

      // Check for damage preview
      const damagePreview = page.getByText(/傷害|damage|preview/i);
      if (await damagePreview.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Damage preview visible');
      }

      // Check for attack button
      const attackBtn = page.getByRole('button', { name: /攻擊|攻擊|attack|attack/i });
      if (await attackBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Attack button visible');
      }
    } else {
      console.log('  [WARN] World Boss tab not found');
    }
  });

  // Test 9: Crafting Panel (製作)
  await runTest('9. Crafting Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['製作', 'craft', 'Craft']);
    await page.waitForTimeout(500);
    await screenshot(page, '09-crafting-panel');

    if (found) {
      console.log('  [OK] Clicked 製作 (Crafting) tab');

      // Check for categories
      const categories = page.locator('[class*="category"], [role="tab"]');
      const catCount = await categories.count().catch(() => 0);
      if (catCount > 0) {
        console.log(`  [INFO] Found ${catCount} categories`);
      }

      // Check for craft buttons
      const craftBtn = page.getByRole('button', { name: /製作|craft|create/i });
      if (await craftBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Craft button visible');
      }

      // Check for item list
      const items = page.locator('[class*="item"], [class*="recipe"]');
      const itemCount = await items.count().catch(() => 0);
      if (itemCount > 0) {
        console.log(`  [INFO] Found ${itemCount} item/recipe elements`);
      }
    } else {
      console.log('  [WARN] Crafting tab not found');
    }
  });

  // Test 10: Guild Panel (公會)
  await runTest('10. Guild Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['公會', 'guild', 'Guild']);
    await page.waitForTimeout(500);
    await screenshot(page, '10-guild-panel');

    if (found) {
      console.log('  [OK] Clicked 公會 (Guild) tab');

      // Check for tasks
      const tasks = page.getByText(/任務|task|quest/i);
      if (await tasks.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Tasks visible');
      }

      // Check for claim reward button
      const claimBtn = page.getByRole('button', { name: /領取|領獎|claim|reward/i });
      if (await claimBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Claim reward button visible');
      }
    } else {
      console.log('  [WARN] Guild tab not found');
    }
  });

  // Test 11: Inventory Panel (背包)
  await runTest('11. Inventory Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['背包', 'inventory', 'Inventory']);
    await page.waitForTimeout(500);
    await screenshot(page, '11-inventory-panel');

    if (found) {
      console.log('  [OK] Clicked 背包 (Inventory) tab');

      // Check for item grid
      const items = page.locator('[class*="item"], [class*="inventory-item"]');
      const count = await items.count().catch(() => 0);
      if (count > 0) {
        console.log(`  [INFO] Found ${count} inventory items`);
      }

      // Check for equip/unequip buttons
      const equipBtn = page.getByRole('button', { name: /裝備|卸下|equip|unequip|use/i });
      if (await equipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Equip/Unequip button visible');
      }
    } else {
      console.log('  [WARN] Inventory tab not found');
    }
  });

  // Test 12: Rewards Panel (獎勵)
  await runTest('12. Rewards Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['獎勵', 'reward', 'Reward']);
    await page.waitForTimeout(500);
    await screenshot(page, '12-rewards-panel');

    if (found) {
      console.log('  [OK] Clicked 獎勵 (Rewards) tab');

      // Check for rewards list
      const rewards = page.locator('[class*="reward"], [class*="claim"]');
      const count = await rewards.count().catch(() => 0);
      if (count > 0) {
        console.log(`  [INFO] Found ${count} reward elements`);
      }
    } else {
      console.log('  [WARN] Rewards tab not found');
    }
  });

  // Test 13: Statistics Panel (統計)
  await runTest('13. Statistics Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['統計', 'stats', 'Statistics']);
    await page.waitForTimeout(500);
    await screenshot(page, '13-statistics-panel');

    if (found) {
      console.log('  [OK] Clicked 統計 (Statistics) tab');

      // Check for stat categories
      const stats = page.locator('[class*="stat"], [class*="metric"]');
      const count = await stats.count().catch(() => 0);
      if (count > 0) {
        console.log(`  [INFO] Found ${count} stat elements`);
      }
    } else {
      console.log('  [WARN] Statistics tab not found');
    }
  });

  // Test 14: Logs Panel (戰報)
  await runTest('14. Logs Panel', async () => {
    await goTo(`${BASE_URL}/game`);

    const found = await clickTabByLabel(page, ['戰報', 'logs', 'Log', 'battle']);
    await page.waitForTimeout(500);
    await screenshot(page, '14-logs-panel');

    if (found) {
      console.log('  [OK] Clicked 戰報 (Logs) tab');

      // Check for log entries
      const logEntries = page.locator('[class*="log"], [class*="entry"], [class*="battle"]');
      const count = await logEntries.count().catch(() => 0);
      if (count > 0) {
        console.log(`  [INFO] Found ${count} log entries`);
      }
    } else {
      console.log('  [WARN] Logs tab not found');
    }
  });

  // Test 15: Notification Bell
  await runTest('15. Notification Bell', async () => {
    await goTo(`${BASE_URL}/game`);

    // Try to find notification bell
    const bellSelectors = [
      '[class*="bell"]',
      '[class*="notification"]',
      '[aria-label*="notification" i]',
      '[data-testid*="bell"]'
    ];

    let bellFound = false;
    for (const sel of bellSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.click();
        bellFound = true;
        break;
      }
    }

    await page.waitForTimeout(500);
    await screenshot(page, '15-notification-dropdown');

    if (bellFound) {
      console.log('  [OK] Clicked Notification bell');

      // Check for dropdown
      const dropdown = page.locator('[class*="dropdown"], [class*="menu"], [role="menu"], [class*="notification"]');
      if (await dropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  [OK] Notification dropdown opened');
      }
    } else {
      console.log('  [WARN] Notification bell not found');
    }
  });

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  await browser.close();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});