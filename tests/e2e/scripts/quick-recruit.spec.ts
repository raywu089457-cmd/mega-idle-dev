import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://mega-idle-dev.onrender.com";
const SESSION_FILE = path.join(__dirname, "../../session.json");

async function loadSession(): Promise<{ cookie: string; localStorage: Record<string, string> }> {
  if (fs.existsSync(SESSION_FILE)) {
    return JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
  }
  throw new Error("No session file found. Run login-and-save-session.ts first.");
}

test("Quick recruit verification", async ({ page }) => {
  // Load saved session
  const session = await loadSession();

  // Set cookie
  await page.context().addCookies([
    {
      name: "next-auth.session-url" in session.cookie ? "next-auth.session-url" : "session",
      value: session.cookie,
      domain: "mega-idle-dev.onrender.com",
      path: "/",
    },
  ]);

  // Set localStorage
  for (const [key, value] of Object.entries(session.localStorage || {})) {
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
  }

  console.log("Navigating to game...");
  await page.goto(`${BASE_URL}/game`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Go to Heroes panel
  console.log("Clicking Heroes tab...");
  await page.locator(".game-nav").getByText(/英雄/).click();
  await page.waitForTimeout(1000);

  // Check territory tab
  const territoryTab = page.locator(".tab-bar .tab").filter({ hasText: /領地/ });
  await territoryTab.click();
  await page.waitForTimeout(500);

  const initialTerritoryCount = await page.locator(".hero-row").count();
  console.log(`Initial territory heroes: ${initialTerritoryCount}`);

  // Try to recruit
  console.log("Clicking recruit button...");
  const recruitBtn = page.locator(".btn-primary").filter({ hasText: /招募/ }).first();
  const isDisabled = await recruitBtn.isDisabled();
  console.log(`Recruit button disabled: ${isDisabled}`);

  if (!isDisabled) {
    await recruitBtn.click();
    await page.waitForTimeout(2000);

    const afterCount = await page.locator(".hero-row").count();
    console.log(`After recruit: ${afterCount} territory heroes`);
    console.log(`Recruitment ${afterCount > initialTerritoryCount ? "WORKS!" : "may have failed"}`);
  }

  // Get page content for debugging
  const msg = await page.locator(".msg").textContent().catch(() => "no msg");
  console.log(`Message: ${msg}`);
});
