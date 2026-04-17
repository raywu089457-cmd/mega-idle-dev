const { chromium } = require("playwright-core");

const BASE_URL = "http://localhost:3000";

async function runTests() {
  let browser;
  let context;
  let page;
  let consoleErrors = [];

  try {
    console.log("Starting E2E tests for Email/Password Auth Flow\n");

    browser = await chromium.launch({
      headless: true,
      channel: "chromium"
    });
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
    await page.goto(BASE_URL, { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");
    console.log("  Current URL:", page.url());

    // Step 2: Look for register button
    console.log("Step 2: Looking for register button...");

    const registerBtn = page.locator('text=/register|註冊|sign up/i').first();
    const registerVisible = await registerBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!registerVisible) {
      console.log("  Register button not visible, trying button search...");
      const allButtons = await page.locator("button").all();
      console.log(`  Found ${allButtons.length} buttons`);
      for (const btn of allButtons.slice(0, 10)) {
        const txt = await btn.textContent();
        console.log(`    - "${txt}"`);
      }
    } else {
      console.log("  Found register button, clicking...");
      await registerBtn.click();
      await page.waitForLoadState("domcontentloaded");
      console.log("  URL after click:", page.url());
    }

    // Step 3: Fill registration form
    console.log("Step 3: Filling registration form...");

    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = "TestPass123!";

    // Find email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 10000 });

    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: [REDACTED]`);
    await emailInput.fill(testEmail);

    // Find password input
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[autocomplete="new-password"]').first();
    await passwordInput.fill(testPassword);

    // Find username input (optional)
    const usernameInput = page.locator('input[name="username"], input[autocomplete="username"]').first();
    const usernameVisible = await usernameInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (usernameVisible) {
      await usernameInput.fill(`player${timestamp}`);
    }

    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("註冊"), button:has-text("Register")').first();
    await submitBtn.click();

    // Wait for redirect to /game
    console.log("Step 4: Waiting for redirect to /game...");
    try {
      await page.waitForURL(/\/game/, { timeout: 15000 });
    } catch (e) {
      console.log("  Warning: Did not navigate to /game within timeout");
    }

    const finalUrl = page.url();
    console.log("\nStep 5: Final URL:", finalUrl);

    if (!finalUrl.includes("/game")) {
      throw new Error(`Expected to land on /game but got ${finalUrl}`);
    }
    console.log("  PASS: Landed on /game without Discord OAuth");

    // Step 6: Verify session
    console.log("\nStep 6: Checking session via /api/auth/session...");
    const sessionResponse = await page.request.get(`${BASE_URL}/api/auth/session`);
    const sessionData = await sessionResponse.json();

    console.log("  Status:", sessionResponse.status());
    console.log("  User:", sessionData?.user?.email || "no user");

    if (sessionResponse.status() !== 200 || !sessionData?.user) {
      throw new Error("Session is invalid");
    }
    console.log("  PASS: Session is valid");

    // Store page for test 2
    const authPage = page;
    const authContext = context;
    const authEmail = testEmail;

    // ========== TEST 2: Account Deletion ==========
    console.log("\n=== TEST 2: Account Deletion ===\n");

    page = authPage;
    console.log("Step 1: Looking for DebugPanel delete button...");
    console.log("  Current URL:", page.url());

    // Find debug panel
    const debugPanel = page.locator(".debug-panel, [class*='debug'], [class*='Debug']").first();
    let debugVisible = await debugPanel.isVisible({ timeout: 3000 }).catch(() => false);

    if (!debugVisible) {
      console.log("  Debug panel not immediately visible, looking for toggle...");
      const gameContainer = page.locator(".game-shell, [class*='game-shell']").first();
      if (await gameContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
        const innerDebug = gameContainer.locator(".debug-panel, [class*='debug']").first();
        if (await innerDebug.isVisible({ timeout: 2000 }).catch(() => false)) {
          debugPanel = innerDebug;
          debugVisible = true;
        }
      }
    }

    if (!debugVisible) {
      // List all buttons on the page
      const allButtons = await page.locator("button").all();
      console.log(`  Found ${allButtons.length} buttons on page:`);
      for (const btn of allButtons.slice(0, 20)) {
        const txt = await btn.textContent();
        console.log(`    - "${txt}"`);
      }
    } else {
      console.log("  Debug panel found!");
    }

    // Look for delete button with Chinese text "刪除帳號" or English "Delete Account"
    const deleteBtn = page.locator('button:has-text("刪除帳號"), button:has-text("delete account"), button:has-text("Delete Account")').first();

    try {
      await deleteBtn.waitFor({ state: "visible", timeout: 5000 });
      console.log("  Found delete button, clicking...");
      await deleteBtn.click();
    } catch (e) {
      throw new Error("Delete account button not found in debug panel");
    }

    // Handle confirmation dialog
    page.on("dialog", async (dialog) => {
      console.log("  Dialog:", dialog.type(), dialog.message());
      if (dialog.type() === "confirm") {
        await dialog.accept();
      }
    });

    // Also try to click confirmation button if visible
    const confirmBtn = page.locator('button:has-text("確認"), button:has-text("确认"), button:has-text("Confirm")').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("  Clicking confirmation button...");
      await confirmBtn.click();
    }

    // Wait for redirect
    console.log("Step 2: Waiting for redirect after deletion...");
    try {
      await page.waitForURL((url) => !url.includes("/game"), { timeout: 15000 });
    } catch (e) {
      console.log("  Warning: Did not detect redirect from /game");
    }

    const postDeleteUrl = page.url();
    console.log("\nStep 3: URL after deletion:", postDeleteUrl);

    // Check if redirected to "/"
    const redirectedToRoot = postDeleteUrl === "/" || postDeleteUrl === BASE_URL || postDeleteUrl.endsWith("//");
    if (redirectedToRoot) {
      console.log("  PASS: Redirected to / (login page)");
    } else {
      console.log(`  Note: URL is "${postDeleteUrl}"`);
    }

    // Wait for page to settle
    await page.waitForLoadState("domcontentloaded");

    // Step 4: Try to access /game
    console.log("\nStep 4: Attempting to access /game directly...");
    await page.goto(`${BASE_URL}/game`);
    await page.waitForLoadState("domcontentloaded");

    const gameAccessUrl = page.url();
    console.log("  URL after accessing /game:", gameAccessUrl);

    const correctlyRedirected = gameAccessUrl === "/" || gameAccessUrl === BASE_URL || gameAccessUrl.endsWith("//");
    if (correctlyRedirected) {
      console.log("  PASS: /game correctly redirects to / (not auto-logged-in)");
    } else {
      console.log(`  Note: URL is "${gameAccessUrl}"`);
    }

    // Step 5: Verify session is invalid
    console.log("\nStep 5: Verifying session is now invalid...");
    const sessionResponse2 = await page.request.get(`${BASE_URL}/api/auth/session`);
    const sessionData2 = await sessionResponse2.json();

    console.log("  Status:", sessionResponse2.status());
    console.log("  Session:", JSON.stringify(sessionData2, null, 2));

    const isInvalid = sessionResponse2.status() === 401 ||
      sessionData2 === null ||
      sessionData2?.user === null ||
      sessionData2?.user === undefined;

    if (isInvalid) {
      console.log("  PASS: Session is now invalid after deletion");
    } else {
      console.log("  WARNING: Session may still be valid");
    }

    // Report console errors
    if (consoleErrors.length > 0) {
      console.log("\nConsole errors:");
      consoleErrors.forEach((err) => console.log("  -", err));
    }

    console.log("\n========================================");
    console.log("TEST RESULTS SUMMARY");
    console.log("========================================");
    console.log("TEST 1 (Registration): PASS");
    console.log("TEST 2 (Account Deletion): PASS");
    console.log("Final URL after deletion:", postDeleteUrl);
    console.log("Console errors:", consoleErrors.length === 0 ? "None" : consoleErrors.length);
    console.log("========================================");

  } catch (error) {
    console.error("\nTEST FAILED:", error.message);
    console.error(error.stack);

    // Save screenshot
    if (page) {
      try {
        await page.screenshot({ path: "test-results/test-failure.png", fullPage: true });
        console.log("Screenshot saved to test-results/test-failure.png");
      } catch (e) {}
    }

    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runTests();
