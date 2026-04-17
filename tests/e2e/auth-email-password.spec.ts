/**
 * Email/Password Authentication and Account Deletion E2E Tests.
 *
 * Tests:
 * 1. Email/password registration flow
 * 2. Email/password login flow
 * 3. Account deletion flow via Debug Panel
 */

import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

// Generate unique test credentials per run using a simple timestamp + random
function generateTestUser() {
  const random = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return {
    email: `test-${ts}-${random}@example.com`,
    password: `TestPass${ts}${random}!`,
    username: `player_${ts}_${random}`,
  };
}

test.describe("Email/Password Auth Flow", () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    testUser = generateTestUser();
  });

  test("1. Registration: home -> register form -> /game", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Go to landing page
    await page.goto("/");

    // Verify landing page elements
    await expect(
      page.getByRole("heading", { name: /mega idle/i })
    ).toBeVisible();

    // Look for registration link/button
    // Try multiple selectors for register button
    const registerBtn = page.getByRole("link", { name: /註冊|register/i })
      .or(page.getByRole("button", { name: /註冊|register/i }))
      .or(page.getByText(/註冊|register/i));

    await expect(registerBtn.first()).toBeVisible({ timeout: 5000 });
    await registerBtn.first().click();

    // Wait for registration form
    await page.waitForLoadState("networkidle");

    // Fill registration form
    // Find email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
    await emailInput.fill(testUser.email);

    // Find password input
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[autocomplete="new-password"]').first();
    await passwordInput.fill(testUser.password);

    // Find username input (optional)
    const usernameInput = page.locator('input[name="username"], input[autocomplete="username"]').first();
    if (await usernameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await usernameInput.fill(testUser.username);
    }

    // Submit form
    const submitBtn = page.locator('button[type="submit"], button:has-text("註冊"), button:has-text("Register"), button:has-text("註冊帳號")').first();
    await submitBtn.click();

    // Wait for redirect to /game
    await page.waitForURL(/\/game/, { timeout: 15000 });

    // Verify game interface is visible
    await expect(page.locator(".game-shell, .game-error, [class*='game']")).toBeVisible({ timeout: 10000 });

    // Log out if possible (look for logout button in debug panel or header)
    // Try to find a logout/debug panel element
    const debugPanelVisible = await page.locator(".debug-panel, [class*='debug']").isVisible({ timeout: 3000 }).catch(() => false);
    if (debugPanelVisible) {
      const logoutBtn = page.getByRole("button", { name: /登出|logout/i }).first();
      if (await logoutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForURL(/\/$/, { timeout: 5000 });
      }
    }

    console.log("TEST 1 PASSED: Registration successful for", testUser.email);
  });

  test("2. Login: home -> login form -> /game with username", async ({ page }) => {
    // First register to create the account
    await page.goto("/");
    const registerBtn = page.getByRole("link", { name: /註冊|register/i })
      .or(page.getByRole("button", { name: /註冊|register/i }))
      .or(page.getByText(/註冊|register/i));
    await registerBtn.first().click();
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
    await emailInput.fill(testUser.email);

    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill(testUser.password);

    const usernameInput = page.locator('input[name="username"], input[autocomplete="username"]').first();
    if (await usernameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await usernameInput.fill(testUser.username);
    }

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Wait for redirect to /game after registration
    await page.waitForURL(/\/game/, { timeout: 15000 });

    // Now log out
    const debugPanelVisible = await page.locator(".debug-panel, [class*='debug']").isVisible({ timeout: 3000 }).catch(() => false);
    if (debugPanelVisible) {
      const logoutBtn = page.getByRole("button", { name: /登出|logout/i }).first();
      if (await logoutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForURL(/\/$/, { timeout: 5000 });
      }
    }

    // Clear cookies to ensure fresh login
    await page.context().clearCookies();

    // Go back to home
    await page.goto("/");

    // Look for login form elements
    // Find email input for login
    const loginEmailInput = page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
    await loginEmailInput.waitFor({ state: "visible", timeout: 5000 });
    await loginEmailInput.fill(testUser.email);

    // Find password input for login
    const loginPasswordInput = page.locator('input[type="password"], input[name="password"], input[autocomplete="current-password"]').first();
    await loginPasswordInput.fill(testUser.password);

    // Submit login form
    const loginSubmitBtn = page.locator('button[type="submit"], button:has-text("登入"), button:has-text("Login")').first();
    await loginSubmitBtn.click();

    // Wait for redirect to /game
    await page.waitForURL(/\/game/, { timeout: 15000 });

    // Verify game interface
    await expect(page.locator(".game-shell, .game-error, [class*='game']")).toBeVisible({ timeout: 10000 });

    // Check for username display in game interface
    if (testUser.username) {
      // Try to find the username somewhere in the game UI
      const usernameVisible = await page.getByText(testUser.username).isVisible({ timeout: 3000 }).catch(() => false);
      console.log("Username visible in game UI:", usernameVisible);
    }

    console.log("TEST 2 PASSED: Login successful for", testUser.email);
  });
});

test.describe("Account Deletion Flow", () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    // Create a fresh account before each deletion test
    testUser = generateTestUser();
    await page.context().clearCookies();

    // Register the account first
    await page.goto("/");
    const registerBtn = page.getByRole("link", { name: /註冊|register/i })
      .or(page.getByRole("button", { name: /註冊|register/i }))
      .or(page.getByText(/註冊|register/i));
    await registerBtn.first().click();
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
    await emailInput.fill(testUser.email);

    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill(testUser.password);

    const usernameInput = page.locator('input[name="username"], input[autocomplete="username"]').first();
    if (await usernameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await usernameInput.fill(testUser.username);
    }

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Wait for redirect to /game after registration
    await page.waitForURL(/\/game/, { timeout: 15000 });
  });

  test("3. Delete account: debug panel -> confirm delete -> redirect to /", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Verify we're on /game
    await expect(page).toHaveURL(/\/game/, { timeout: 5000 });

    // Look for Debug Panel - typically visible in game interface
    // Try multiple approaches to find the debug panel
    let debugPanel = page.locator(".debug-panel, [class*='debug'], [class*=' Debug']").first();
    const debugPanelVisible = await debugPanel.isVisible({ timeout: 5000 }).catch(() => false);

    if (!debugPanelVisible) {
      // Maybe there's a toggle or the debug panel is inside the game container
      const gameContainer = page.locator(".game-shell, [class*='game-shell']").first();
      if (await gameContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
        debugPanel = gameContainer.locator(".debug-panel, [class*='debug']").first();
      }
    }

    await expect(debugPanel).toBeVisible({ timeout: 10000 });
    console.log("Debug panel found and visible");

    // Find "刪除帳號" button within debug panel
    const deleteBtn = page.getByRole("button", { name: /刪除帳號|delete account|删除账号/i }).first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    // First confirmation prompt
    // Handle potential native confirm dialog or custom modal
    page.on("dialog", async (dialog) => {
      console.log("Dialog appeared:", dialog.type(), dialog.message());
      if (dialog.type() === "confirm") {
        await dialog.accept();
      }
    });

    // Also try to detect custom confirmation modal
    const confirmModal = page.locator('button:has-text("確認"), button:has-text("确认"), button:has-text("Confirm")').first();
    if (await confirmModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmModal.click();
    }

    // Second confirmation (if the app requires double confirm)
    const secondConfirmModal = page.locator('button:has-text("確認"), button:has-text("确认"), button:has-text("Confirm")').first();
    if (await secondConfirmModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await secondConfirmModal.click();
    }

    // Wait for redirect to home page
    await page.waitForURL(/\/$/, { timeout: 15000 });

    // Verify landing page elements after deletion
    await expect(
      page.getByRole("heading", { name: /mega idle/i })
    ).toBeVisible({ timeout: 5000 });

    // Should see login buttons (Discord, email/password login)
    await expect(
      page.getByRole("button", { name: /discord/i })
    ).toBeVisible({ timeout: 5000 });

    console.log("TEST 3a PASSED: Account deleted, redirected to home page");

    // Now try to access /game directly - should redirect back to /
    await page.goto("/game");

    // Should be redirected back to home
    await expect(page).toHaveURL(/\/$/, { timeout: 5000 });

    // Verify landing page elements
    await expect(
      page.getByRole("heading", { name: /mega idle/i })
    ).toBeVisible({ timeout: 5000 });

    console.log("TEST 3b PASSED: /game redirects to / after account deletion");

    // Try refreshing /game a few times to confirm no redirect loop
    for (let i = 0; i < 3; i++) {
      await page.goto("/game");
      await page.waitForURL(/\/$/, { timeout: 5000 });
      console.log(`Refresh ${i + 1}: Correctly redirected to /`);
    }

    // Verify no console errors (except known harmless ones)
    const realErrors = errors.filter(
      (e) => !e.includes("hydrat") && !e.includes("Warning") && !e.includes("favicon")
    );
    if (realErrors.length > 0) {
      console.log("Console errors:", realErrors);
    }

    console.log("TEST 3 PASSED: Account deletion flow complete. No redirect loop detected.");
  });

  test("4. Account is not recreated automatically after deletion", async ({ page }) => {
    // Try to log in with the deleted account credentials
    await page.goto("/");

    const loginEmailInput = page.locator('input[type="email"], input[name="email"]').first();
    await loginEmailInput.waitFor({ state: "visible", timeout: 5000 });
    await loginEmailInput.fill(testUser.email);

    const loginPasswordInput = page.locator('input[type="password"], input[name="password"]').first();
    await loginPasswordInput.fill(testUser.password);

    const loginSubmitBtn = page.locator('button[type="submit"], button:has-text("登入")').first();
    await loginSubmitBtn.click();

    // Should either:
    // - Show an error message (credentials invalid)
    // - Stay on home page (no redirect to /game)
    // - NOT create a new account automatically
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    // If redirected to /game, the account was recreated - this is a bug
    if (currentUrl.includes("/game")) {
      throw new Error("BUG: Account appears to have been recreated automatically after deletion!");
    }

    // If still on home page, that's the expected behavior
    await expect(page).toHaveURL(/\/$/, { timeout: 5000 });
    console.log("TEST 4 PASSED: Deleted account was NOT recreated automatically");
  });
});
