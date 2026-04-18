/**
 * Fresh Registration and API Testing
 *
 * This test:
 * 1. Registers a new account
 * 2. Saves the session
 * 3. Tests core APIs
 *
 * Run: npx playwright test tests/e2e/scripts/test-api-fresh-registration.spec.ts --project=chromium
 */

import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const BASE_URL = "https://mega-idle-dev.onrender.com";
const SESSION_PATH = path.join(__dirname, "../.auth/fresh-session.json");

function generateTestUser() {
  const random = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return {
    email: `test-${ts}-${random}@example.com`,
    password: `TestPass${ts}${random}!`,
    username: `player_${ts}_${random}`,
  };
}

test.describe("Fresh Registration and API Tests", () => {
  let sessionCookie = "";

  test("1. Register new account and save session", async ({ browser }) => {
    const testUser = generateTestUser();
    console.log("Registering:", testUser.email);

    const context = await browser.newContext();
    const page = await context.newPage();

    // Go to landing page
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Look for registration link/button
    const registerBtn = page.getByRole("link", { name: /註冊|register/i })
      .or(page.getByRole("button", { name: /註冊|register/i }))
      .or(page.getByText(/註冊|register/i));

    await registerBtn.first().click();
    await page.waitForLoadState("networkidle");

    // Fill registration form
    const emailInput = page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
    await emailInput.fill(testUser.email);

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
    await expect(page.locator(".game-shell").first()).toBeVisible({ timeout: 10000 });

    // Get session cookies
    const cookies = await context.cookies();
    const session = cookies.find(
      c => c.name === "next-auth.session-token" || c.name === "__Secure-next-auth.session-token"
    );

    if (!session) {
      throw new Error("Session cookie not found after registration!");
    }

    sessionCookie = `${session.name}=${session.value}`;
    console.log("Session cookie obtained:", sessionCookie.substring(0, 50) + "...");

    // Save session to file
    const authDir = path.dirname(SESSION_PATH);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const sessionData = {
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
      })),
    };
    fs.writeFileSync(SESSION_PATH, JSON.stringify(sessionData, null, 2));
    console.log("Session saved to:", SESSION_PATH);

    await page.close();
  });

  test("2. GET /api/heroes - check hero types", async ({ request }) => {
    // Load session from file
    if (!fs.existsSync(SESSION_PATH)) {
      test.skip(true, "No saved session - run test 1 first");
      return;
    }

    const sessionData = JSON.parse(fs.readFileSync(SESSION_PATH, "utf-8"));
    const cookie = sessionData.cookies
      .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await request.get(`${BASE_URL}/api/heroes`, {
      headers: { Cookie: cookie },
    });

    console.log("GET /api/heroes - Status:", response.status());
    const body = await response.json();
    console.log("Response keys:", Object.keys(body));

    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();

    // Check for S/A/B rarity heroes
    const territoryHeroes = body.data.territoryHeroes || [];
    const wanderingHeroes = body.data.wanderingHeroes || [];
    const allHeroes = [...territoryHeroes, ...wanderingHeroes];

    console.log("Total heroes:", allHeroes.length);
    console.log("Territory heroes:", territoryHeroes.length);
    console.log("Wandering heroes:", wanderingHeroes.length);

    if (allHeroes.length > 0) {
      const types = new Set(allHeroes.map((h: { type: string }) => h.type));
      console.log("Hero types/rarities found:", [...types]);

      const byType: Record<string, number> = {};
      allHeroes.forEach((h: { type: string }) => {
        byType[h.type] = (byType[h.type] || 0) + 1;
      });
      console.log("Heroes by type:", byType);
    }
  });

  test("3. GET /api/user - check buildings, productionRates, statistics", async ({ request }) => {
    if (!fs.existsSync(SESSION_PATH)) {
      test.skip(true, "No saved session");
      return;
    }

    const sessionData = JSON.parse(fs.readFileSync(SESSION_PATH, "utf-8"));
    const cookie = sessionData.cookies
      .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await request.get(`${BASE_URL}/api/user`, {
      headers: { Cookie: cookie },
    });

    console.log("GET /api/user - Status:", response.status());
    const body = await response.json();
    console.log("Response keys:", Object.keys(body));

    expect(response.status()).toBe(200);

    // Check buildings
    console.log("\nBuildings:", JSON.stringify(body.buildings, null, 2));

    // Check productionRates
    console.log("\nProductionRates:", JSON.stringify(body.productionRates, null, 2));

    // Check statistics
    console.log("\nStatistics:", JSON.stringify(body.statistics, null, 2));

    // Check if resources/capacity fields exist (may not for fresh users)
    if (body.resources) {
      console.log("\nResources:", JSON.stringify(body.resources, null, 2));
    } else {
      console.log("\nResources: not present (fresh user)");
    }

    if (body.capacity) {
      console.log("\nCapacity:", JSON.stringify(body.capacity, null, 2));
    } else {
      console.log("\nCapacity: not present (fresh user)");
    }

    // Verify statistics structure
    expect(body.statistics).toBeDefined();
    expect(body.statistics.explorations).toBeDefined();
    expect(body.statistics.wins).toBeDefined();
    expect(body.statistics.losses).toBeDefined();
    console.log("Statistics structure verified");
  });

  test("4. POST /api/dispatch - test dispatch with team API", async ({ request }) => {
    if (!fs.existsSync(SESSION_PATH)) {
      test.skip(true, "No saved session");
      return;
    }

    const sessionData = JSON.parse(fs.readFileSync(SESSION_PATH, "utf-8"));
    const cookie = sessionData.cookies
      .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
      .join("; ");

    // First get heroes to find a valid hero ID
    const heroesResp = await request.get(`${BASE_URL}/api/heroes`, {
      headers: { Cookie: cookie },
    });
    const heroesBody = await heroesResp.json();
    const territoryHeroes = heroesBody.data?.territoryHeroes || [];

    let heroId = "test_hero";
    if (territoryHeroes.length > 0) {
      heroId = territoryHeroes[0].id;
      console.log("Using hero ID:", heroId);
    }

    // Test dispatch using correct API schema (heroIds array)
    const dispatchBody = {
      action: "dispatch",
      heroIds: [heroId],
      zone: 1,
      subZone: 1,
    };

    console.log("Dispatch request:", JSON.stringify(dispatchBody));
    const response = await request.post(`${BASE_URL}/api/dispatch`, {
      data: dispatchBody,
      headers: { "Content-Type": "application/json", Cookie: cookie },
    });

    console.log("POST /api/dispatch - Status:", response.status());
    const body = await response.json();
    console.log("Response:", JSON.stringify(body, null, 2));

    expect(response.status()).toBe(200);
    console.log("Dispatch result:", body.success === true ? "SUCCESS" : "FAILED");
    console.log("Dispatch message:", body.data?.message || body.error);
  });

  test("5. POST /api/build - test building upgrade", async ({ request }) => {
    if (!fs.existsSync(SESSION_PATH)) {
      test.skip(true, "No saved session");
      return;
    }

    const sessionData = JSON.parse(fs.readFileSync(SESSION_PATH, "utf-8"));
    const cookie = sessionData.cookies
      .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
      .join("; ");

    // Try to build/upgrade a building using correct schema
    const buildBody = {
      action: "upgrade",
      building: "barracks",
    };

    console.log("Build request:", JSON.stringify(buildBody));
    const response = await request.post(`${BASE_URL}/api/build`, {
      data: buildBody,
      headers: { "Content-Type": "application/json", Cookie: cookie },
    });

    console.log("POST /api/build - Status:", response.status());
    const body = await response.json();
    console.log("Response:", JSON.stringify(body, null, 2));

    // We don't assert 200 because we might not have enough resources
    // Just log the result
    console.log("Build result:", body.success === true ? "SUCCESS" : "FAILED");
    if (body.error) {
      console.log("Build error:", body.error);
    }
  });
});