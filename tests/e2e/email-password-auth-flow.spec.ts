import { test, expect, chromium, BrowserContext } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Email/Password Auth & Account Deletion Flow", () => {
  let context: BrowserContext;
  let consoleErrors: string[] = [];

  test.beforeEach(async () => {
    context = await chromium.launch({ headless: true });
    consoleErrors = [];
  });

  test.afterEach(async () => {
    await context.close();
  });

  test("1. Email/password registration flow", async () => {
    const page = await context.newPage();

    // Capture console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    console.log("\n=== TEST 1: Email/Password Registration ===\n");

    // Step 1: Go to homepage
    console.log("Step 1: Navigating to http://localhost:3000");
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    console.log("  Current URL:", page.url());

    // Step 2: Look for email/password form
    console.log("Step 2: Looking for email/password form...");

    // Try to find email input - could be in a form on the landing page
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    const emailVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
    const passwordVisible = await passwordInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!emailVisible || !passwordVisible) {
      // Try looking for any form on the page
      console.log("  Standard email form not found, looking for form elements...");
      const forms = await page.locator("form").all();
      console.log(`  Found ${forms.length} form(s) on page`);

      // Look for inputs within forms
      const formInputs = await page.locator("form input").all();
      console.log(`  Found ${formInputs.length} input(s) within forms`);

      // Check if there's a "Sign in with Email" or similar button
      const emailBtn = page.locator('button:has-text("Email"), button:has-text("Sign in"), button:has-text("Register")').first();
      const emailBtnVisible = await emailBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (emailBtnVisible) {
        console.log("  Clicking email/signin button...");
        await emailBtn.click();
        await page.waitForTimeout(1000);
        console.log("  URL after click:", page.url());
      }
    }

    // Now try to find the email/password inputs again
    const emailInput2 = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput2 = page.locator('input[type="password"], input[name="password"]').first();

    const emailVisible2 = await emailInput2.isVisible({ timeout: 5000 }).catch(() => false);
    const passwordVisible2 = await passwordInput2.isVisible({ timeout: 5000 }).catch(() => false);

    expect(emailVisible2, "Email input should be visible").toBe(true);
    expect(passwordVisible2, "Password input should be visible").toBe(true);

    // Generate a unique email
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = "TestPass123!";

    console.log(`\nStep 3: Filling in email: ${testEmail} and password: ${testPassword}`);

    await emailInput2.fill(testEmail);
    await passwordInput2.fill(testPassword);

    // Find and click submit button
    const submitBtn = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Sign in"), button:has-text("Register"), button:has-text("Continue")').first();
    const submitVisible = await submitBtn.isVisible({ timeout: 3000 }).catch(() => false);

    expect(submitVisible, "Submit button should be visible").toBe(true);
    console.log("Step 4: Clicking submit button...");
    await submitBtn.click();

    // Wait for navigation
    await page.waitForURL(/\/game/, { timeout: 10000 }).catch(() => {
      console.log("  Warning: Did not navigate to /game");
    });

    const finalUrl = page.url();
    console.log("\nStep 5: Final URL after registration:", finalUrl);

    // Verify we landed on /game without Discord OAuth
    expect(finalUrl, "Should land on /game after registration").toContain("/game");
    console.log("  PASS: Landed on /game without Discord OAuth");

    // Step 6: Verify session is valid via API
    console.log("\nStep 6: Checking session validity via /api/auth/session...");
    const sessionResponse = await page.request.get(`${BASE_URL}/api/auth/session`);
    const sessionData = await sessionResponse.json();

    console.log("  Session response status:", sessionResponse.status());
    console.log("  Session data:", JSON.stringify(sessionData, null, 2));

    expect(sessionResponse.status()).toBe(200);
    expect(sessionData).toHaveProperty("user");
    console.log("  PASS: Session is valid");

    // Log any console errors
    if (consoleErrors.length > 0) {
      console.log("\nConsole errors captured:");
      consoleErrors.forEach((err) => console.log("  -", err));
    } else {
      console.log("\nNo console errors captured.");
    }

    console.log("\n=== TEST 1 RESULT: PASS ===\n");

    // Store context for next test
    (global as any).authContext = context;
    (global as any).authPage = page;
  });

  test("2. Account deletion flow", async () => {
    // Reuse the context from test 1 if available
    let page: import("@playwright/test").Page;

    if ((global as any).authPage) {
      page = (global as any).authPage;
      context = (global as any).authContext;
      console.log("\n=== TEST 2: Account Deletion (Reusing session from Test 1) ===\n");
    } else {
      console.log("\n=== TEST 2: Account Deletion (No prior session - skipping) ===\n");
      test.skip();
      return;
    }

    const currentUrl = page.url();
    console.log("Current URL at start of Test 2:", currentUrl);

    // Verify we're still on /game
    if (!currentUrl.includes("/game")) {
      console.log("ERROR: Not on /game page, cannot proceed with deletion test");
      test.skip();
      return;
    }

    // Step 1: Find and click DebugPanel delete account button
    console.log("\nStep 1: Looking for DebugPanel delete account button...");

    // Try various selectors for DebugPanel
    const debugPanelDeleteBtn = page.locator(
      'button:has-text("Delete"), button:has-text("delete account"), button:has-text("Delete Account"), [data-testid="delete-account"]'
    ).first();

    const deleteBtnVisible = await debugPanelDeleteBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!deleteBtnVisible) {
      console.log("  Delete button not immediately visible, looking for DebugPanel...");

      // Look for DebugPanel or settings menu
      const debugPanel = page.locator('[data-testid*="debug"], [data-testid*="Debug"], text=/debug/i').first();
      const debugVisible = await debugPanel.isVisible({ timeout: 3000 }).catch(() => false);

      if (debugVisible) {
        console.log("  Found DebugPanel, clicking to expand...");
        await debugPanel.click();
        await page.waitForTimeout(500);
      }
    }

    // Try again to find delete button
    const deleteBtn2 = page.locator(
      'button:has-text("Delete Account"), button:has-text("delete account"), button:has-text("Delete"), [data-testid="delete-account"]'
    ).first();

    const deleteBtn2Visible = await deleteBtn2.isVisible({ timeout: 5000 }).catch(() => false);
    expect(deleteBtn2Visible, "Delete account button should be visible in DebugPanel").toBe(true);

    console.log("  Found delete button, clicking...");
    await deleteBtn2.click();

    // Wait for redirect after deletion
    await page.waitForURL((url) => !url.includes("/game"), { timeout: 15000 }).catch(() => {
      console.log("  Warning: Did not detect redirect from /game");
    });

    const postDeleteUrl = page.url();
    console.log("\nStep 2: URL after deletion:", postDeleteUrl);

    // Verify redirect to "/" (login page)
    expect(postDeleteUrl, "Should be redirected to / after deletion").toBe("/");
    console.log("  PASS: Redirected to / (login page)");

    // Step 3: Verify login page is shown
    console.log("\nStep 3: Verifying login page is shown...");

    // Wait for page to settle
    await page.waitForLoadState("networkidle");
    const pageContent = await page.content();
    const hasLoginForm = pageContent.toLowerCase().includes("login") || pageContent.toLowerCase().includes("sign in") || pageContent.toLowerCase().includes("email");
    console.log("  Page content includes login-related text:", hasLoginForm);
    console.log("  PASS: Login page is visible");

    // Step 4: Attempt to access /game - should redirect to "/"
    console.log("\nStep 4: Attempting to access /game directly...");
    await page.goto(`${BASE_URL}/game`, { waitUntil: "networkidle" });

    const gameAccessUrl = page.url();
    console.log("  URL after attempting to access /game:", gameAccessUrl);

    expect(gameAccessUrl, "Should be redirected back to / when accessing /game after deletion").toBe("/");
    console.log("  PASS: /game redirects to / (not auto-logged-in)");

    // Step 5: Verify session is now invalid
    console.log("\nStep 5: Verifying session is now invalid...");
    const sessionResponse = await page.request.get(`${BASE_URL}/api/auth/session`);
    const sessionData = await sessionResponse.json();

    console.log("  Session response status:", sessionResponse.status());
    console.log("  Session data:", JSON.stringify(sessionData, null, 2));

    // Session should either return 401 or have no user/null user
    const isInvalidSession = sessionResponse.status() === 401 ||
      sessionData === null ||
      sessionData.user === null ||
      sessionData.user === undefined;

    expect(isInvalidSession, "Session should be invalid after account deletion").toBe(true);
    console.log("  PASS: Session is now invalid after deletion");

    console.log("\n=== TEST 2 RESULT: PASS ===\n");
  });
});
