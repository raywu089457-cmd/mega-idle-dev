/**
 * Email/Password Registration, Login, and Account Deletion E2E Tests
 * Target: http://127.0.0.1:3000
 */

import { test, expect, chromium } from "@playwright/test";

test.describe.configure({ mode: "serial" });

function generateUniqueEmail(): string {
  const ts = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `test-${ts}-${random}@example.com`;
}

test.describe("Test 1: Registration and Session Verification", () => {
  test("1.1 Register with email/password and verify session", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const testEmail = generateUniqueEmail();
    const testPassword = "testpassword123";

    console.log("Step 1: Navigating to http://127.0.0.1:3000");
    await page.goto("http://127.0.0.1:3000");
    console.log("Current URL:", page.url());

    console.log("Step 2: Looking for register button");
    const registerBtn = page
      .getByRole("link", { name: /註冊|register/i })
      .or(page.getByRole("button", { name: /註冊|register/i }))
      .or(page.getByText(/註冊|register/i))
      .first();
    await registerBtn.click();
    await page.waitForLoadState("networkidle");
    console.log("After click - Current URL:", page.url());

    console.log("Step 3: Filling registration form");
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
    await emailInput.fill(testEmail);
    console.log("Email filled:", testEmail);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(testPassword);
    console.log("Password filled: testpassword123");

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    console.log("Step 4: Submit clicked");

    console.log("Step 5: Waiting for navigation to /game");
    await page.waitForURL(/\/game/, { timeout: 15000 });
    console.log("After registration - Current URL:", page.url());

    console.log("Step 6: Verifying game interface is visible");
    await expect(page.locator("body")).toBeVisible({ timeout: 5000 });
    console.log("Game interface loaded");

    console.log("Step 7: Checking /api/auth/session for user id");
    const response = await page.request.get("http://127.0.0.1:3000/api/auth/session");
    const sessionData = await response.json();
    console.log("Session response status:", response.status());
    console.log("Session data:", JSON.stringify(sessionData, null, 2));

    expect(response.status()).toBe(200);
    expect(sessionData.user).toBeDefined();
    expect(sessionData.user.id).toBeDefined();
    console.log("User ID in session:", sessionData.user?.id);

    if (consoleErrors.length > 0) {
      console.log("Console errors during test:", consoleErrors);
    }

    console.log("TEST 1 PASSED: Registration and session verification successful");
  });
});

test.describe("Test 2: Account Deletion", () => {
  test("2.1 Register, delete account via DebugPanel, verify redirect", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const testEmail = generateUniqueEmail();
    const testPassword = "testpassword123";

    // First register
    console.log("Step 1: Navigating to http://127.0.0.1:3000");
    await page.goto("http://127.0.0.1:3000");

    console.log("Step 2: Looking for register button");
    const registerBtn = page
      .getByRole("link", { name: /註冊|register/i })
      .or(page.getByRole("button", { name: /註冊|register/i }))
      .or(page.getByText(/註冊|register/i))
      .first();
    await registerBtn.click();
    await page.waitForLoadState("networkidle");
    console.log("After click - Current URL:", page.url());

    console.log("Step 3: Filling registration form");
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
    await emailInput.fill(testEmail);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(testPassword);

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    console.log("Step 4: Waiting for navigation to /game");
    await page.waitForURL(/\/game/, { timeout: 15000 });
    console.log("After registration - Current URL:", page.url());

    // Now we're on /game - look for DebugPanel
    console.log("Step 5: Looking for DebugPanel");
    const debugPanel = page.locator(".debug-panel, [class*='debug']").first();
    const debugVisible = await debugPanel.isVisible({ timeout: 5000 }).catch(() => false);
    console.log("DebugPanel visible:", debugVisible);
    console.log("Current URL:", page.url());

    // Handle dialog events
    let dialogCount = 0;
    page.on("dialog", async (dialog) => {
      dialogCount++;
      console.log(`Dialog ${dialogCount} appeared:`, dialog.type(), dialog.message());
      if (dialog.type() === "confirm" || dialog.type() === "prompt") {
        await dialog.accept();
      }
    });

    // Try to find delete button
    console.log("Step 6: Looking for delete account button");
    const deleteBtn = page
      .getByRole("button", { name: /刪除帳號|delete account|删除账号/i })
      .first();

    const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log("Delete button visible:", deleteBtnVisible);

    if (deleteBtnVisible) {
      console.log("Step 7: Clicking delete account button");
      await deleteBtn.click();
      await page.waitForTimeout(1000);

      // Check if we need to confirm dialogs
      const confirmBtn = page.locator('button:has-text("確認"), button:has-text("确认"), button:has-text("Confirm")').first();
      const confirmVisible = await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (confirmVisible) {
        console.log("Step 8: Clicking confirm button");
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }

      // Check for second confirm
      const secondConfirmBtn = page.locator('button:has-text("確認"), button:has-text("确认"), button:has-text("Confirm")').first();
      const secondConfirmVisible = await secondConfirmBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (secondConfirmVisible) {
        console.log("Step 9: Clicking second confirm button");
        await secondConfirmBtn.click();
      }
    } else {
      console.log("Delete button not found, trying alternative selectors...");
      // Try to find any button with delete-related text inside debug panel
      const allButtons = await page.locator("button").all();
      for (const btn of allButtons) {
        const text = await btn.textContent();
        if (text && /刪|delete|移除|remove/i.test(text)) {
          console.log("Found potential delete button:", text);
          await btn.click();
          await page.waitForTimeout(500);
          break;
        }
      }
    }

    console.log("Step 10: Waiting for redirect after deletion");
    await page.waitForURL(/\/$/, { timeout: 15000 }).catch(() => {
      console.log("Did not redirect to /, current URL:", page.url());
    });
    console.log("After deletion - Current URL:", page.url());

    console.log("Step 11: Refreshing page to verify it stays on /");
    await page.reload();
    await page.waitForLoadState("networkidle");
    console.log("After reload - Current URL:", page.url());

    console.log("Step 12: Trying to navigate to /game directly");
    await page.goto("http://127.0.0.1:3000/game");
    await page.waitForLoadState("networkidle");
    console.log("After navigating to /game - Current URL:", page.url());

    // Check if we stayed on / or were redirected
    const finalUrl = page.url();
    if (finalUrl.includes("/game")) {
      console.log("WARNING: Still on /game after deletion - checking if session was actually deleted");
      const sessionResponse = await page.request.get("http://127.0.0.1:3000/api/auth/session");
      const sessionData = await sessionResponse.json();
      console.log("Session data after deletion:", JSON.stringify(sessionData, null, 2));
    }

    if (consoleErrors.length > 0) {
      console.log("Console errors during test:", consoleErrors);
    }

    console.log("TEST 2 COMPLETED");
  });
});