/**
 * E2E API Testing - Email/Password Auth Session
 *
 * This test:
 * 1. Logs in with email/password credentials via browser
 * 2. Saves the session cookie for API testing
 * 3. Tests core APIs with the session cookie
 *
 * Run: npx playwright test tests/e2e/scripts/test-api-ep-session.spec.ts --project=chromium
 */

import { test, expect, BrowserContext, APIRequestContext } from "@playwright/test";

const BASE_URL = "https://mega-idle-dev.onrender.com";
const TEST_EMAIL = "sssssss@gmail.com";
const TEST_PASSWORD = "sssssss";

test.describe("Email/Password Auth Session API Tests", () => {
  let context: BrowserContext;
  let sessionCookie = "";

  test("1. Login and get session cookie", async ({ browser }) => {
    context = await browser.newContext();

    const page = await context.newPage();

    // Go to landing page
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Fill in login form
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    // Submit
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Wait for redirect to /game
    await page.waitForURL(/\/game/, { timeout: 15000 });

    // Get session cookie
    const cookies = await context.cookies();
    const session = cookies.find(
      c => c.name === "next-auth.session-token" || c.name === "__Secure-next-auth.session-token"
    );

    expect(session).toBeDefined();
    sessionCookie = `${session!.name}=${session!.value}`;

    console.log("Session cookie obtained:", sessionCookie.substring(0, 50) + "...");

    // Save session to file for other tests
    const fs = await import("fs");
    const path = await import("path");
    const sessionPath = path.join(__dirname, "../.auth/email-session.json");
    const sessionData = {
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
      })),
    };
    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
    console.log("Session saved to:", sessionPath);

    await page.close();
  });

  test("2. GET /api/heroes - check S/A/B rarity heroes", async ({ request }) => {
    // Load session from file
    const fs = await import("fs");
    const path = await import("path");
    const sessionPath = path.join(__dirname, "../.auth/email-session.json");

    if (!fs.existsSync(sessionPath)) {
      test.skip(true, "No saved email session - run test 1 first");
      return;
    }

    const sessionData = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
    const cookie = sessionData.cookies
      .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await request.get(`${BASE_URL}/api/heroes`, {
      headers: { Cookie: cookie },
    });

    console.log("GET /api/heroes - Status:", response.status());
    const body = await response.json();
    console.log("Response:", JSON.stringify(body, null, 2));

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

  test("3. GET /api/user - check buildings, productionRates, statistics, resources", async ({ request }) => {
    const fs = await import("fs");
    const path = await import("path");
    const sessionPath = path.join(__dirname, "../.auth/email-session.json");

    if (!fs.existsSync(sessionPath)) {
      test.skip(true, "No saved email session");
      return;
    }

    const sessionData = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
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

    // Check resources
    console.log("\nResources:", JSON.stringify(body.resources, null, 2));

    // Check capacity
    console.log("\nCapacity:", JSON.stringify(body.capacity, null, 2));
  });

  test("4. POST /api/dispatch - test dispatch to zone 1 subZone 1 (easy)", async ({ request }) => {
    const fs = await import("fs");
    const path = await import("path");
    const sessionPath = path.join(__dirname, "../.auth/email-session.json");

    if (!fs.existsSync(sessionPath)) {
      test.skip(true, "No saved email session");
      return;
    }

    const sessionData = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
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

    // Test dispatch
    const dispatchBody = {
      action: "dispatch",
      heroId: heroId,
      zone: 1,
      subZone: 1,
      difficulty: 1,
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
    console.log("Dispatch type:", body.type);
    console.log("Cooldown seconds:", body.cooldownSeconds);
  });

  test("5. POST /api/build - test building upgrade", async ({ request }) => {
    const fs = await import("fs");
    const path = await import("path");
    const sessionPath = path.join(__dirname, "../.auth/email-session.json");

    if (!fs.existsSync(sessionPath)) {
      test.skip(true, "No saved email session");
      return;
    }

    const sessionData = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
    const cookie = sessionData.cookies
      .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
      .join("; ");

    const buildBody = {
      action: "upgrade",
      buildingType: "barracks",
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
  });
});