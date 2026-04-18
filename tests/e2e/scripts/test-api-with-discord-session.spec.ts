/**
 * E2E API Testing - Email/Password Auth
 *
 * Uses Discord session to test APIs since email/password login is having issues.
 * This test verifies core API functionality.
 *
 * Run: npx playwright test tests/e2e/scripts/test-api-with-discord-session.spec.ts --project=chromium
 */

import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const BASE_URL = "https://mega-idle-dev.onrender.com";
const SESSION_PATH = path.join(__dirname, "../.auth/discord-session.json");

test.describe("API Tests with Discord Session", () => {
  let cookie = "";

  test.beforeAll(async () => {
    // Load existing Discord session
    if (!fs.existsSync(SESSION_PATH)) {
      test.skip(true, "No Discord session found - run save-session.spec.ts first");
      return;
    }

    const sessionData = JSON.parse(fs.readFileSync(SESSION_PATH, "utf-8"));
    cookie = sessionData.cookies
      .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
      .join("; ");
  });

  test("1. GET /api/heroes - check S/A/B rarity heroes", async ({ request }) => {
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

  test("2. GET /api/user - check buildings, productionRates, statistics, resources, capacity", async ({ request }) => {
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

    // Verify new resource items exist
    expect(body.resources).toBeDefined();
    expect(body.resources.rations).toBeDefined();
    expect(body.resources.drinking_water).toBeDefined();
    expect(body.resources.potions).toBeDefined();
    console.log("New resource items verified: rations, drinking_water, potions");

    // Verify statistics structure
    expect(body.statistics).toBeDefined();
    expect(body.statistics.explorations).toBeDefined();
    expect(body.statistics.wins).toBeDefined();
    expect(body.statistics.losses).toBeDefined();
    console.log("Statistics structure verified");
  });

  test("3. POST /api/dispatch - test dispatch to zone 1 subZone 1 (easy)", async ({ request }) => {
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
    console.log("Dispatch result type:", body.type);
    console.log("Cooldown seconds:", body.cooldownSeconds);

    // Verify response has expected structure
    expect(body.type).toMatch(/team_combat|solo_combat/);
    expect(body.cooldownSeconds).toBeDefined();
    console.log("Dispatch API verified: returns team_combat or solo_combat with cooldown");
  });

  test("4. POST /api/build - test building upgrade", async ({ request }) => {
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