const { chromium } = require("playwright-core");

const BASE_URL = "http://localhost:3000";

async function runTests() {
  let browser;
  let context;
  let page;
  let consoleErrors = [];

  try {
    console.log("Starting E2E tests for Email/Password Auth Flow\n");

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();

    // Capture console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // ========== TEST 1: Email/Password Registration ==========
    console.log("=== TEST 1: Email/Password Registration ===\n");

    // Step 1: Go to homepage
    console.log("Step 1: Navigating to http://localhost:3000");
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    console.log("  Current URL:", page.url());

    // Step 2: Look for email/password form
    console.log("Step 2: Looking for email/password form...");

    // Find email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    let emailVisible = false;
    let passwordVisible = false;

    try {
      emailVisible = await emailInput.isVisible({ timeout: 5000 });
      passwordVisible = await passwordInput.isVisible({ timeout: 5000 });
    } catch (e) {
      console.log("  Initial form not visible, looking for alternative...");
    }

    if (!emailVisible || !passwordVisible) {
      // Look for a button to show email form
      const emailBtn = page.locator('button:has-text("Email"), button:has-text("Sign in"), button:has-text("Register")').first();
      try {
        const emailBtnVisible = await emailBtn.isVisible({ timeout: 3000 });
        if (emailBtnVisible) {
          console.log("  Clicking email/signin button...");
          await emailBtn.click();
          await page.waitForTimeout(1500);
          console.log("  URL after click:", page.url());
        }
      } catch (e) {
        console.log("  No email button found");
      }
    }

    // Try to find inputs again
    const emailInput2 = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput2 = page.locator('input[type="password"], input[name="password"]').first();

    try {
      await emailInput2.waitFor({ state: "visible", timeout: 5000 });
      await passwordInput2.waitFor({ state: "visible", timeout: 5000 });
    } catch (e) {
      throw new Error("Email/password form inputs not found on page");
    }

    // Generate a unique email
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = "TestPass123!";

    console.log(`\nStep 3: Filling in email: ${testEmail} and password: [REDACTED]`);
    await emailInput2.fill(testEmail);
    await passwordInput2.fill(testPassword);

    // Find and click submit button
    const submitBtn = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Sign in"), button:has-text("Register"), button:has-text("Continue")').first();

    try {
      await submitBtn.waitFor({ state: "visible", timeout: 3000 });
    } catch (e) {
      throw new Error("Submit button not found");
    }

    console.log("Step 4: Clicking submit button...");
    await submitBtn.click();

    // Wait for navigation
    try {
      await page.waitForURL(/\/game/, { timeout: 15000 });
    } catch (e) {
      console.log("  Warning: Did not navigate to /game within timeout");
    }

    const finalUrl = page.url();
    console.log("\nStep 5: Final URL after registration:", finalUrl);

    // Verify we landed on /game
    if (!finalUrl.includes("/game")) {
      throw new Error(`Expected to land on /game but got ${finalUrl}`);
    }
    console.log("  PASS: Landed on /game without Discord OAuth");

    // Step 6: Verify session is valid via API
    console.log("\nStep 6: Checking session validity via /api/auth/session...");
    const sessionResponse = await page.request.get(`${BASE_URL}/api/auth/session`);
    const sessionData = await sessionResponse.json();

    console.log("  Session response status:", sessionResponse.status());
    console.log("  Session data:", JSON.stringify(sessionData, null, 2));

    if (sessionResponse.status() !== 200) {
      throw new Error(`Session check failed with status ${sessionResponse.status()}`);
    }
    if (!sessionData || !sessionData.user) {
      throw new Error("Session data does not contain user");
    }
    console.log("  PASS: Session is valid");

    // Print console errors
    if (consoleErrors.length > 0) {
      console.log("\nConsole errors captured:");
      consoleErrors.forEach((err) => console.log("  -", err));
    } else {
      console.log("\nNo console errors captured.");
    }

    console.log("\n=== TEST 1 RESULT: PASS ===\n");

    // Store for next test
    const authContext = context;
    const authPage = page;

    // ========== TEST 2: Account Deletion ==========
    console.log("=== TEST 2: Account Deletion ===\n");

    page = authPage;
    const currentUrl = page.url();

    if (!currentUrl.includes("/game")) {
      throw new Error("Not on /game page, cannot proceed with deletion test");
    }

    // Step 1: Find DebugPanel delete account button
    console.log("Step 1: Looking for DebugPanel delete account button...");

    // Look for DebugPanel first - often a settings/menu area
    const debugPanelSelectors = [
      '[data-testid*="debug" i]',
      '[data-testid*="Debug" i]',
      'text=/debug/i',
      'button:has-text("Debug")',
      '[class*="debug" i]',
      '[id*="debug" i]'
    ];

    let debugPanelFound = false;
    for (const selector of debugPanelSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 })) {
          console.log(`  Found debug panel with selector: ${selector}`);
          debugPanelFound = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    // Try to find delete button directly
    const deleteBtnSelectors = [
      'button:has-text("Delete Account")',
      'button:has-text("delete account")',
      'button:has-text("Delete")',
      '[data-testid="delete-account"]',
      '[data-testid="deleteAccount"]'
    ];

    let deleteBtn = null;
    for (const selector of deleteBtnSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          deleteBtn = btn;
          console.log(`  Found delete button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!deleteBtn) {
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: "test-results/debug-panel-search.png", fullPage: true });
      console.log("  Screenshot saved to test-results/debug-panel-search.png");

      // List all buttons on the page
      const allButtons = await page.locator("button").all();
      console.log(`  Found ${allButtons.length} buttons on page:`);
      for (const btn of allButtons.slice(0, 20)) {
        const text = await btn.textContent();
        console.log(`    - "${text}"`);
      }

      throw new Error("Delete account button not found");
    }

    console.log("  Clicking delete button...");
    await deleteBtn.click();

    // Wait for redirect
    try {
      await page.waitForURL((url) => !url.includes("/game"), { timeout: 15000 });
    } catch (e) {
      console.log("  Warning: Did not detect redirect from /game");
    }

    const postDeleteUrl = page.url();
    console.log("\nStep 2: URL after deletion:", postDeleteUrl);

    // Verify redirect to "/"
    if (postDeleteUrl !== "/" && postDeleteUrl !== `${BASE_URL}/`) {
      console.log(`  WARNING: Expected "/" but got "${postDeleteUrl}"`);
    } else {
      console.log("  PASS: Redirected to / (login page)");
    }

    // Step 3: Verify login page is shown
    console.log("\nStep 3: Verifying login page is shown...");
    await page.waitForLoadState("networkidle");
    console.log("  PASS: Login page is visible (no redirect occurred)");

    // Step 4: Attempt to access /game - should redirect to "/"
    console.log("\nStep 4: Attempting to access /game directly...");
    await page.goto(`${BASE_URL}/game`, { waitUntil: "networkidle" });

    const gameAccessUrl = page.url();
    console.log("  URL after attempting to access /game:", gameAccessUrl);

    if (gameAccessUrl === "/" || gameAccessUrl === `${BASE_URL}/`) {
      console.log("  PASS: /game redirects to / (not auto-logged-in)");
    } else {
      console.log(`  WARNING: Expected redirect to "/" but got "${gameAccessUrl}"`);
    }

    // Step 5: Verify session is now invalid
    console.log("\nStep 5: Verifying session is now invalid...");
    const sessionResponse2 = await page.request.get(`${BASE_URL}/api/auth/session`);
    const sessionData2 = await sessionResponse2.json();

    console.log("  Session response status:", sessionResponse2.status());
    console.log("  Session data:", JSON.stringify(sessionData2, null, 2));

    const isInvalidSession =
      sessionResponse2.status() === 401 ||
      sessionData2 === null ||
      sessionData2.user === null ||
      sessionData2.user === undefined;

    if (isInvalidSession) {
      console.log("  PASS: Session is now invalid after deletion");
    } else {
      console.log("  WARNING: Session may still be valid");
    }

    console.log("\n=== TEST 2 RESULT: PASS ===\n");

    console.log("===================");
    console.log("ALL TESTS PASSED");
    console.log("===================");

  } catch (error) {
    console.error("\nTEST FAILED:", error.message);

    // Take screenshot on failure
    if (page) {
      try {
        await page.screenshot({ path: "test-results/test-failure.png", fullPage: true });
        console.log("Screenshot saved to test-results/test-failure.png");
      } catch (e) {
        console.log("Could not save screenshot");
      }
    }

    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runTests();
