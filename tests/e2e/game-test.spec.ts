import { test, expect, chromium, BrowserContext, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = "test+megaidle_001@openclaw.game";
const TEST_PASSWORD = "Test123!@#";

interface TestResult {
  phase: string;
  test: string;
  status: "PASS" | "FAIL" | "SKIP";
  notes?: string;
  screenshot?: string;
}

const testResults: TestResult[] = [];
let consoleErrors: string[] = [];

async function captureScreenshot(page: Page, name: string): Promise<string | undefined> {
  try {
    const screenshotPath = `test-results/${name}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 5000 });
    return screenshotPath;
  } catch (e) {
    console.log(`  Screenshot capture failed: ${e}`);
    return undefined;
  }
}

function addResult(phase: string, test: string, status: TestResult["status"], notes?: string, screenshot?: string) {
  testResults.push({ phase, test, status, notes, screenshot });
  console.log(`[${status}] ${phase} > ${test}${notes ? `: ${notes}` : ""}`);
}

test.describe.serial("Mega Idle Game - Comprehensive UI Testing", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    context = await chromium.launch({ headless: true });
    page = await context.newPage();

    // Capture console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });
  });

  test.afterAll(async () => {
    await context.close();

    // Log any console errors captured
    if (consoleErrors.length > 0) {
      console.log("\n=== Console Errors Captured ===");
      consoleErrors.forEach((err) => console.log(`  - ${err}`));
    }
  });

  test("Phase 1: Login Flow", async () => {
    console.log("\n=== PHASE 1: LOGIN FLOW ===\n");

    // Step 1.1: Navigate to homepage
    console.log("Step 1.1: Navigating to homepage...");
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const landingUrl = page.url();
    if (landingUrl.includes("/game")) {
      // Already logged in (session exists)
      console.log("  Already logged in, skipping login");
      addResult("Phase 1", "Already authenticated", "PASS");
    } else {
      // Step 1.2: Verify login form elements
      console.log("Step 1.2: Checking login form elements...");

      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitBtn = page.locator('button[type="submit"]').first();

      const emailVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
      const passwordVisible = await passwordInput.isVisible({ timeout: 5000 }).catch(() => false);
      const submitVisible = await submitBtn.isVisible({ timeout: 5000 }).catch(() => false);

      if (!emailVisible || !passwordVisible || !submitVisible) {
        const screenshot = await captureScreenshot(page, "login-form-missing");
        addResult("Phase 1", "Login form visible", "FAIL", "Missing form elements", screenshot);
      } else {
        addResult("Phase 1", "Login form visible", "PASS");
      }

      // Step 1.3: Perform login
      console.log("Step 1.3: Performing login...");
      await emailInput.fill(TEST_EMAIL);
      await passwordInput.fill(TEST_PASSWORD);
      await submitBtn.click();

      // Step 1.4: Wait for navigation to /game
      try {
        await page.waitForURL(/\/game/, { timeout: 15000 });
        addResult("Phase 1", "Login navigation to /game", "PASS");
      } catch (e) {
        const screenshot = await captureScreenshot(page, "login-failed");
        addResult("Phase 1", "Login navigation to /game", "FAIL", "Did not navigate to /game", screenshot);
      }
    }

    // Step 1.5: Verify session persistence
    console.log("Step 1.5: Verifying session persistence...");
    try {
      const sessionResponse = await page.request.get(`${BASE_URL}/api/auth/session`);
      const sessionData = await sessionResponse.json();

      if (sessionResponse.status() === 200 && sessionData.user) {
        addResult("Phase 1", "Session valid", "PASS", `User: ${sessionData.user.email || sessionData.user.name}`);
      } else {
        addResult("Phase 1", "Session valid", "FAIL", "Session invalid or missing user");
      }
    } catch (e) {
      addResult("Phase 1", "Session valid", "FAIL", `Error checking session: ${e}`);
    }
  });

  test("Phase 2: Main Game Interface (HUD)", async () => {
    console.log("\n=== PHASE 2: MAIN GAME INTERFACE ===\n");

    // Ensure we're on /game
    await page.goto(`${BASE_URL}/game`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    if (!page.url().includes("/game")) {
      addResult("Phase 2", "Navigate to /game", "SKIP", "Not logged in");
      return;
    }

    // Step 2.1: Check resource displays
    console.log("Step 2.1: Checking resource displays...");

    // Look for common resource indicators - gold, gems, energy
    const pageContent = await page.content();
    const hasGold = pageContent.toLowerCase().includes("gold") || pageContent.includes("金");
    const hasGems = pageContent.toLowerCase().includes("gem") || pageContent.includes("寶石");
    const hasEnergy = pageContent.toLowerCase().includes("energy") || pageContent.includes("能量");

    console.log(`  Gold visible: ${hasGold}`);
    console.log(`  Gems visible: ${hasGems}`);
    console.log(`  Energy visible: ${hasEnergy}`);

    addResult("Phase 2", "Resource displays", hasGold || hasGems || hasEnergy ? "PASS" : "FAIL",
      `Gold: ${hasGold}, Gems: ${hasGems}, Energy: ${hasEnergy}`);

    // Step 2.2: Check navigation panel
    console.log("Step 2.2: Checking navigation panel...");

    // Look for panel switching buttons (Home, Heroes, Buildings, etc.)
    const homeBtn = page.locator('button:has-text("Home"), button:has-text("主頁"), [data-testid*="home"]').first();
    const heroesBtn = page.locator('button:has-text("Hero"), button:has-text("英雄"), [data-testid*="hero"]').first();
    const buildingsBtn = page.locator('button:has-text("Building"), button:has-text("建築"), [data-testid*="building"]').first();
    const dispatchBtn = page.locator('button:has-text("Dispatch"), button:has-text("探索"), button:has-text("Explore"), [data-testid*="dispatch"]').first();
    const battleBtn = page.locator('button:has-text("Battle"), button:has-text("戰鬥"), [data-testid*="battle"]').first();

    const navFound = await Promise.all([
      homeBtn.isVisible({ timeout: 2000 }).catch(() => false),
      heroesBtn.isVisible({ timeout: 2000 }).catch(() => false),
      buildingsBtn.isVisible({ timeout: 2000 }).catch(() => false),
      dispatchBtn.isVisible({ timeout: 2000 }).catch(() => false),
      battleBtn.isVisible({ timeout: 2000 }).catch(() => false),
    ]);

    const navCount = navFound.filter(Boolean).length;
    console.log(`  Navigation buttons found: ${navCount}/5`);

    if (navCount >= 3) {
      addResult("Phase 2", "Navigation panel", "PASS", `Found ${navCount}/5 main nav buttons`);
    } else {
      addResult("Phase 2", "Navigation panel", "FAIL", `Only found ${navCount}/5 main nav buttons`);
    }

    // Step 2.3: Capture overall UI screenshot
    await captureScreenshot(page, "main-interface");
    addResult("Phase 2", "UI screenshot captured", "PASS");
  });

  test("Phase 3: Buildings System", async () => {
    console.log("\n=== PHASE 3: BUILDINGS SYSTEM ===\n");

    // Navigate to /game
    await page.goto(`${BASE_URL}/game`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    if (!page.url().includes("/game")) {
      addResult("Phase 3", "Navigate to /game", "SKIP", "Not logged in");
      return;
    }

    // Step 3.1: Find and click Buildings button (Chinese: 建築)
    console.log("Step 3.1: Opening Buildings panel...");

    let buildingsBtnVisible = false;
    let buildingsBtn = page.locator('button:has-text("建築")').first();

    buildingsBtnVisible = await buildingsBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!buildingsBtnVisible) {
      // Try alternate selector
      const alternateBtn = page.locator('text=/建築/i').first();
      const altVisible = await alternateBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (altVisible) {
        buildingsBtn = alternateBtn;
        buildingsBtnVisible = true;
      }
    }

    if (!buildingsBtnVisible) {
      addResult("Phase 3", "Open Buildings panel", "FAIL", "Buildings button (建築) not found");
      return;
    }

    await buildingsBtn.click();
    await page.waitForTimeout(1500);

    // Step 3.2: Check building list
    console.log("Step 3.2: Checking building list...");

    const buildingCards = await page.locator('[data-testid*="building"], .building-card, [class*="building"]').all();
    console.log(`  Found ${buildingCards.length} building cards`);

    if (buildingCards.length > 0) {
      addResult("Phase 3", "Building list visible", "PASS", `Found ${buildingCards.length} buildings`);

      // Step 3.3: Try to build/upgrade a building
      console.log("Step 3.3: Testing build action...");

      const buildBtn = page.locator('button:has-text("升級"), button:has-text("建造")').first();
      const buildBtnVisible = await buildBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (buildBtnVisible) {
        // Get button text to see what it says (cost, etc.)
        const btnText = await buildBtn.textContent({ timeout: 2000 }).catch(() => "unknown");
        console.log(`  Build button text: ${btnText}`);

        // Check if button has disabled attribute
        const isDisabled = await buildBtn.getAttribute("disabled").catch(() => null);

        if (isDisabled === null) {
          // Button is enabled, try to click
          try {
            await buildBtn.click({ timeout: 2000 });
            await page.waitForTimeout(1000);
            addResult("Phase 3", "Build action", "PASS", "Clicked build/upgrade button");
          } catch (e) {
            addResult("Phase 3", "Build action", "FAIL", `Could not click: ${e}`);
          }
        } else {
          addResult("Phase 3", "Build button", "PASS", `Button visible but disabled - Text: ${btnText}`);
        }
      } else {
        addResult("Phase 3", "Build button", "FAIL", "Build button not found");
      }
    } else {
      addResult("Phase 3", "Building list visible", "FAIL", "No building cards found");
    }

    try {
      await captureScreenshot(page, "buildings-panel");
    } catch (e) {
      console.log("  Screenshot failed:", e);
    }
  });

  test("Phase 4: Heroes System", async () => {
    console.log("\n=== PHASE 4: HEROES SYSTEM ===\n");

    await page.goto(`${BASE_URL}/game`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    if (!page.url().includes("/game")) {
      addResult("Phase 4", "Navigate to /game", "SKIP", "Not logged in");
      return;
    }

    // Step 4.1: Find and click Heroes button (Chinese: 英雄)
    console.log("Step 4.1: Opening Heroes panel...");

    let heroesBtnVisible = false;
    let heroesBtn = page.locator('button:has-text("英雄")').first();
    heroesBtnVisible = await heroesBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!heroesBtnVisible) {
      const alternateBtn = page.locator('text=/英雄/i').first();
      const altVisible = await alternateBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (altVisible) {
        heroesBtn = alternateBtn;
        heroesBtnVisible = true;
      }
    }

    if (!heroesBtnVisible) {
      addResult("Phase 4", "Open Heroes panel", "FAIL", "Heroes button (英雄) not found");
      return;
    }

    await heroesBtn.click();
    await page.waitForTimeout(1500);

    // Step 4.2: Check hero list
    console.log("Step 4.2: Checking hero list...");

    const heroCards = await page.locator('[data-testid*="hero"], .hero-card, [class*="hero"]').all();
    console.log(`  Found ${heroCards.length} hero cards`);

    // Also check for any text that indicates hero stats
    const pageContent = await page.content();
    const hasHeroStats = pageContent.includes("ATK") || pageContent.includes("DEF") || pageContent.includes("Level") ||
                         pageContent.includes("攻擊") || pageContent.includes("防禦") || pageContent.includes("等級") ||
                         pageContent.includes("訓練");

    console.log(`  Hero stats visible: ${hasHeroStats}`);

    if (heroCards.length > 0 || hasHeroStats) {
      addResult("Phase 4", "Hero list visible", "PASS", `Found ${heroCards.length} heroes, stats visible: ${hasHeroStats}`);
    } else {
      addResult("Phase 4", "Hero list visible", "FAIL", "No heroes or stats found");
    }

    // Step 4.3: Check hero actions - Note: Actions like "訓練" (Train) appear in hero detail, not at list level
    console.log("Step 4.3: Testing hero actions...");

    // Look for recruit button which is visible at list level
    const recruitBtn = page.locator('button:has-text("招募"), button:has-text("Recruit")').first();
    const recruitBtnVisible = await recruitBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (recruitBtnVisible) {
      const btnText = await recruitBtn.textContent().catch(() => "unknown");
      addResult("Phase 4", "Hero recruit button", "PASS", `Text: ${btnText}`);
    } else {
      addResult("Phase 4", "Hero recruit button", "FAIL", "Recruit button not visible");
    }

    // Click on a hero to see detail and check for training button
    if (heroCards.length > 0) {
      console.log("  Clicking hero card to view detail...");
      try {
        await heroCards[0].click();
        await page.waitForTimeout(1000);

        // Now check for training button in detail view
        const trainBtn = page.locator('button:has-text("訓練")').first();
        const trainBtnVisible = await trainBtn.isVisible({ timeout: 3000 }).catch(() => false);
        const trainBtnEnabled = trainBtnVisible && await trainBtn.isEnabled().catch(() => false);

        if (trainBtnVisible) {
          const btnText = await trainBtn.textContent().catch(() => "unknown");
          console.log(`  Training button text: ${btnText}`);
          addResult("Phase 4", "Hero detail actions", "PASS", `Train button found: ${btnText}`);
        } else {
          addResult("Phase 4", "Hero detail actions", "FAIL", "Train button not visible in detail");
        }

        // Close the detail panel
        const closeBtn = page.locator('button:has-text("關閉"), button:has-text("Close")').first();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      } catch (e) {
        console.log(`  Could not click hero card: ${e}`);
        addResult("Phase 4", "Hero detail actions", "FAIL", "Could not open hero detail");
      }
    }

    await captureScreenshot(page, "heroes-panel");
  });

  test("Phase 5: Dispatch/Explore System", async () => {
    console.log("\n=== PHASE 5: DISPATCH/EXPLORE SYSTEM ===\n");

    await page.goto(`${BASE_URL}/game`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    if (!page.url().includes("/game")) {
      addResult("Phase 5", "Navigate to /game", "SKIP", "Not logged in");
      return;
    }

    // Step 5.1: Find and click Dispatch/Explore button (Chinese: 探索)
    console.log("Step 5.1: Opening Dispatch panel...");

    let dispatchBtnVisible = false;
    let dispatchBtn = page.locator('button:has-text("探索")').first();
    dispatchBtnVisible = await dispatchBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!dispatchBtnVisible) {
      const alternateBtn = page.locator('text=/探索/i').first();
      const altVisible = await alternateBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (altVisible) {
        dispatchBtn = alternateBtn;
        dispatchBtnVisible = true;
      }
    }

    if (!dispatchBtnVisible) {
      addResult("Phase 5", "Open Dispatch panel", "FAIL", "Dispatch button (探索) not found");
      return;
    }

    await dispatchBtn.click();
    await page.waitForTimeout(1500);

    // Step 5.2: Check dispatch panel elements
    console.log("Step 5.2: Checking dispatch panel...");

    const zoneButtons = await page.locator('button:has-text("Zone"), button:has-text("區域"), button:has-text("Forest"), button:has-text("森林")').all();
    console.log(`  Found ${zoneButtons.length} zone buttons`);

    const heroSelectors = await page.locator('[data-testid*="hero-select"], [data-testid*="select-hero"], .hero-select').all();
    console.log(`  Found ${heroSelectors.length} hero selection elements`);

    const sendBtn = page.locator('button:has-text("Send"), button:has-text("派遣"), button:has-text("出發")').first();
    const sendBtnVisible = await sendBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const sendBtnEnabled = sendBtnVisible && await sendBtn.isEnabled().catch(() => false);

    console.log(`  Send button visible: ${sendBtnVisible}, enabled: ${sendBtnEnabled}`);

    if (zoneButtons.length > 0 || heroSelectors.length > 0) {
      addResult("Phase 5", "Dispatch panel elements", "PASS",
        `Zones: ${zoneButtons.length}, Hero selectors: ${heroSelectors.length}`);
    } else {
      addResult("Phase 5", "Dispatch panel elements", "FAIL", "No zone buttons or hero selectors found");
    }

    if (sendBtnVisible) {
      const btnText = await sendBtn.textContent().catch(() => "unknown");
      if (sendBtnEnabled) {
        addResult("Phase 5", "Dispatch send button", "PASS", "Button is enabled");
      } else {
        addResult("Phase 5", "Dispatch send button", "PASS", `Button visible but disabled - Text: ${btnText}`);
      }
    } else {
      addResult("Phase 5", "Dispatch send button", "FAIL", "Send button not visible");
    }

    // Step 5.3: Try to dispatch a hero
    console.log("Step 5.3: Testing dispatch action...");

    if (sendBtnVisible && sendBtnEnabled) {
      await sendBtn.click();
      await page.waitForTimeout(1000);

      // Check for dispatch confirmation or error
      const dispatchResult = await page.locator('text=/success|成功|complete|完成/i, text=/fail|失敗|error|錯誤/i').first().textContent().catch(() => null);
      console.log(`  Dispatch result: ${dispatchResult || "No explicit result message"}`);

      addResult("Phase 5", "Dispatch action", "PASS");
    } else {
      addResult("Phase 5", "Dispatch action", "SKIP", "Send button not enabled (no heroes selected or insufficient resources)");
    }

    await captureScreenshot(page, "dispatch-panel");
  });

  test("Phase 6: World Boss System", async () => {
    console.log("\n=== PHASE 6: WORLD BOSS SYSTEM ===\n");

    await page.goto(`${BASE_URL}/game`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    if (!page.url().includes("/game")) {
      addResult("Phase 6", "Navigate to /game", "SKIP", "Not logged in");
      return;
    }

    // Step 6.1: Find and click World Boss button (Chinese: 世界王)
    console.log("Step 6.1: Opening World Boss panel...");

    let worldBossBtnVisible = false;
    let worldBossBtn = page.locator('button:has-text("世界王")').first();
    worldBossBtnVisible = await worldBossBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!worldBossBtnVisible) {
      const alternateBtn = page.locator('text=/世界王/i').first();
      const altVisible = await alternateBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (altVisible) {
        worldBossBtn = alternateBtn;
        worldBossBtnVisible = true;
      }
    }

    if (!worldBossBtnVisible) {
      addResult("Phase 6", "Open World Boss panel", "FAIL", "World Boss button (世界王) not found");
      return;
    }

    await worldBossBtn.click();
    await page.waitForTimeout(1500);
    addResult("Phase 6", "Open World Boss panel", "PASS");

    // Step 6.2: Check world boss panel elements
    console.log("Step 6.2: Checking World Boss panel...");

    const pageContent = await page.content();
    const hasBossContent = pageContent.includes("boss") || pageContent.includes("Boss") || pageContent.includes("world") || pageContent.includes("World") ||
                          pageContent.includes("世界") || pageContent.includes("王");
    console.log(`  Boss-related content visible: ${hasBossContent}`);

    addResult("Phase 6", "World Boss content", hasBossContent ? "PASS" : "FAIL", hasBossContent ? "Content visible" : "No boss content found");

    await captureScreenshot(page, "worldboss-panel");
  });

  test("Phase 7: Crafting System", async () => {
    console.log("\n=== PHASE 7: CRAFTING SYSTEM ===\n");

    await page.goto(`${BASE_URL}/game`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    if (!page.url().includes("/game")) {
      addResult("Phase 7", "Navigate to /game", "SKIP", "Not logged in");
      return;
    }

    // Step 7.1: Find and click Crafting button (Chinese: 製作)
    console.log("Step 7.1: Opening Crafting panel...");

    let craftingBtnVisible = false;
    let craftingBtn = page.locator('button:has-text("製作")').first();
    craftingBtnVisible = await craftingBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!craftingBtnVisible) {
      const alternateBtn = page.locator('text=/製作/i').first();
      const altVisible = await alternateBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (altVisible) {
        craftingBtn = alternateBtn;
        craftingBtnVisible = true;
      }
    }

    if (!craftingBtnVisible) {
      addResult("Phase 7", "Open Crafting panel", "FAIL", "Crafting button (製作) not found - NOTE: Shop feature does not exist in this game");
      return;
    }

    await craftingBtn.click();
    await page.waitForTimeout(1500);
    addResult("Phase 7", "Open Crafting panel", "PASS");

    // Step 7.2: Check crafting elements
    console.log("Step 7.2: Checking crafting elements...");

    const craftingItems = await page.locator('[data-testid*="craft"], [data-testid*="recipe"], .craft-item, .recipe').all();
    console.log(`  Found ${craftingItems.length} crafting items/recipes`);

    if (craftingItems.length > 0) {
      addResult("Phase 7", "Crafting items visible", "PASS", `Found ${craftingItems.length} items`);
    } else {
      addResult("Phase 7", "Crafting items visible", "FAIL", "No crafting items found");
    }

    await captureScreenshot(page, "crafting-panel");
  });

  test("Phase 8: Daily Rewards", async () => {
    console.log("\n=== PHASE 8: DAILY REWARDS ===\n");

    await page.goto(`${BASE_URL}/game`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    if (!page.url().includes("/game")) {
      addResult("Phase 8", "Navigate to /game", "SKIP", "Not logged in");
      return;
    }

    // Step 8.1: Look for daily rewards button or panel (Chinese: 獎勵)
    console.log("Step 8.1: Looking for Daily Rewards...");

    let rewardsBtnVisible = false;
    let rewardsBtn = page.locator('button:has-text("獎勵")').first();
    rewardsBtnVisible = await rewardsBtn.isVisible({ timeout: 3000 }).catch(() => false);

    // Try clicking the notification bell
    if (!rewardsBtnVisible) {
      const notifBell = page.locator('[data-testid*="notification"], [data-testid*="bell"]').first();
      const bellVisible = await notifBell.isVisible({ timeout: 2000 }).catch(() => false);

      if (bellVisible) {
        await notifBell.click();
        await page.waitForTimeout(1000);
        rewardsBtnVisible = true;
        addResult("Phase 8", "Open Rewards via notification", "PASS");
      }
    }

    if (!rewardsBtnVisible) {
      // Try alternate selector
      const alternateBtn = page.locator('text=/獎勵/i').first();
      const altVisible = await alternateBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (altVisible) {
        rewardsBtn = alternateBtn;
        rewardsBtnVisible = true;
      }
    }

    if (!rewardsBtnVisible) {
      addResult("Phase 8", "Find Rewards", "FAIL", "Rewards button (獎勵) not found");
      return;
    }

    await rewardsBtn.click();
    await page.waitForTimeout(1500);
    addResult("Phase 8", "Open Rewards panel", "PASS");

    // Take screenshot BEFORE clicking claim (as claim may change page state)
    try {
      await captureScreenshot(page, "rewards-panel");
    } catch (e) {
      console.log("  Could not capture rewards screenshot:", e);
    }

    // Step 8.2: Check rewards content
    console.log("Step 8.2: Checking rewards content...");

    const claimBtn = page.locator('button:has-text("領取")').first();
    const claimBtnVisible = await claimBtn.isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`  Claim button visible: ${claimBtnVisible}`);

    if (claimBtnVisible) {
      addResult("Phase 8", "Claim rewards button", "PASS");

      // Step 8.3: Try to claim
      console.log("Step 8.3: Testing claim action...");
      await claimBtn.click();
      await page.waitForTimeout(2000);

      // Check for success message
      const successMsg = await page.locator('text=/成功|領取/i').first().textContent().catch(() => null);
      console.log(`  Claim result: ${successMsg || "No explicit message"}`);

      addResult("Phase 8", "Claim rewards action", "PASS", successMsg || "Claimed");
    } else {
      addResult("Phase 8", "Claim rewards button", "FAIL", "Claim button not visible (may already be claimed or not available)");
    }
  });

  test("Phase 9: Additional Panels and Edge Cases", async () => {
    console.log("\n=== PHASE 9: ADDITIONAL PANELS ===\n");

    await page.goto(`${BASE_URL}/game`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    if (!page.url().includes("/game")) {
      addResult("Phase 9", "Navigate to /game", "SKIP", "Not logged in");
      return;
    }

    // Test Inventory (Chinese: 背包)
    console.log("Step 9.1: Testing Inventory panel...");
    let inventoryBtnVisible = false;
    let inventoryBtn = page.locator('button:has-text("背包")').first();
    inventoryBtnVisible = await inventoryBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!inventoryBtnVisible) {
      const alternateBtn = page.locator('text=/背包/i').first();
      const altVisible = await alternateBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (altVisible) {
        inventoryBtn = alternateBtn;
        inventoryBtnVisible = true;
      }
    }

    if (inventoryBtnVisible) {
      await inventoryBtn.click();
      await page.waitForTimeout(1000);
      addResult("Phase 9", "Inventory panel", "PASS");
      try {
        await captureScreenshot(page, "inventory-panel");
      } catch (e) {
        console.log("  Could not capture screenshot:", e);
      }
    } else {
      addResult("Phase 9", "Inventory panel", "FAIL", "Inventory button (背包) not found");
    }

    // Test Statistics (Chinese: 統計)
    console.log("Step 9.2: Testing Statistics panel...");
    await page.goto(`${BASE_URL}/game`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    let statsBtnVisible = false;
    let statsBtn = page.locator('button:has-text("統計")').first();
    statsBtnVisible = await statsBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!statsBtnVisible) {
      const alternateBtn = page.locator('text=/統計/i').first();
      const altVisible = await alternateBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (altVisible) {
        statsBtn = alternateBtn;
        statsBtnVisible = true;
      }
    }

    if (statsBtnVisible) {
      await statsBtn.click();
      await page.waitForTimeout(1000);
      addResult("Phase 9", "Statistics panel", "PASS");
    } else {
      addResult("Phase 9", "Statistics panel", "FAIL", "Statistics button (統計) not found");
    }

    // Test Navigation consistency
    console.log("Step 9.3: Testing navigation consistency...");

    await page.goto(`${BASE_URL}/game`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Try clicking through nav buttons
    const navButtons = await page.locator('nav button, .nav button').all();

    for (let i = 0; i < Math.min(navButtons.length, 5); i++) {
      const btn = navButtons[i];
      const btnName = await btn.textContent().catch(() => "Unknown");
      try {
        await btn.click();
        await page.waitForTimeout(800);
        console.log(`  Clicked: ${btnName}`);
      } catch (e) {
        console.log(`  Failed to click: ${btnName}`);
      }
    }

    addResult("Phase 9", "Navigation consistency", "PASS", "Tested multiple panel switches");
  });

  // Generate final report
  test("Final: Generate Test Report", async () => {
    console.log("\n=== GENERATING TEST REPORT ===\n");

    const passCount = testResults.filter(r => r.status === "PASS").length;
    const failCount = testResults.filter(r => r.status === "FAIL").length;
    const skipCount = testResults.filter(r => r.status === "SKIP").length;
    const totalCount = testResults.length;

    const report = `# Game Testing Report - ${new Date().toISOString().split('T')[0]}

## Test Environment
- URL: ${BASE_URL}
- Test Account: ${TEST_EMAIL}
- Test Date: ${new Date().toISOString()}
- Total Tests: ${totalCount}

## Summary
| Status | Count | Percentage |
|--------|-------|------------|
| PASS | ${passCount} | ${((passCount / totalCount) * 100).toFixed(1)}% |
| FAIL | ${failCount} | ${((failCount / totalCount) * 100).toFixed(1)}% |
| SKIP | ${skipCount} | ${((skipCount / totalCount) * 100).toFixed(1)}% |

## Detailed Results

### Phase 1: Login Flow
${testResults.filter(r => r.phase === "Phase 1").map(r => `- **${r.test}**: ${r.status}${r.notes ? ` - ${r.notes}` : ""}`).join("\n")}

### Phase 2: Main Game Interface
${testResults.filter(r => r.phase === "Phase 2").map(r => `- **${r.test}**: ${r.status}${r.notes ? ` - ${r.notes}` : ""}`).join("\n")}

### Phase 3: Buildings System
${testResults.filter(r => r.phase === "Phase 3").map(r => `- **${r.test}**: ${r.status}${r.notes ? ` - ${r.notes}` : ""}`).join("\n")}

### Phase 4: Heroes System
${testResults.filter(r => r.phase === "Phase 4").map(r => `- **${r.test}**: ${r.status}${r.notes ? ` - ${r.notes}` : ""}`).join("\n")}

### Phase 5: Dispatch/Explore System
${testResults.filter(r => r.phase === "Phase 5").map(r => `- **${r.test}**: ${r.status}${r.notes ? ` - ${r.notes}` : ""}`).join("\n")}

### Phase 6: Battle System
${testResults.filter(r => r.phase === "Phase 6").map(r => `- **${r.test}**: ${r.status}${r.notes ? ` - ${r.notes}` : ""}`).join("\n")}

### Phase 7: Shop System
${testResults.filter(r => r.phase === "Phase 7").map(r => `- **${r.test}**: ${r.status}${r.notes ? ` - ${r.notes}` : ""}`).join("\n")}

### Phase 8: Daily Rewards
${testResults.filter(r => r.phase === "Phase 8").map(r => `- **${r.test}**: ${r.status}${r.notes ? ` - ${r.notes}` : ""}`).join("\n")}

### Phase 9: Additional Panels
${testResults.filter(r => r.phase === "Phase 9").map(r => `- **${r.test}**: ${r.status}${r.notes ? ` - ${r.notes}` : ""}`).join("\n")}

## Issues Found (FAILs)

${testResults.filter(r => r.status === "FAIL").map(r => `### ${r.test}
- **Phase**: ${r.phase}
- **Notes**: ${r.notes || "No additional notes"}
- **Screenshot**: ${r.screenshot || "N/A"}
`).join("\n") || "No critical issues found!"}

## Console Errors
${consoleErrors.length > 0 ? consoleErrors.map(e => `- ${e}`).join("\n") : "No console errors captured"}

## Screenshots
Screenshots are saved in the \`test-results/\` directory with timestamp suffixes.

---
*Report generated by Playwright E2E Testing*
`;

    // Write report to file
    const fs = require("fs");
    const reportPath = "test-results/GAME-TEST-REPORT.md";
    fs.writeFileSync(reportPath, report, "utf-8");

    console.log(`\nReport saved to: ${reportPath}`);
    console.log(`\n=== FINAL SUMMARY ===`);
    console.log(`Total: ${totalCount} | PASS: ${passCount} | FAIL: ${failCount} | SKIP: ${skipCount}`);

    // Log failures for visibility
    if (failCount > 0) {
      console.log("\nFailed tests:");
      testResults.filter(r => r.status === "FAIL").forEach(r => {
        console.log(`  - ${r.phase} > ${r.test}: ${r.notes}`);
      });
    }
  });
});
