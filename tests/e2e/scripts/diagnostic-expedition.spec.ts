import { test, Page } from "@playwright/test";
import { getAuthenticatedPage } from "../helpers/auth-session";

const BASE_URL = "https://mega-idle-dev.onrender.com";

async function getUserData(page: Page) {
  return page.evaluate(async () => {
    const r = await fetch("/api/user");
    return r.json();
  });
}

test("Exploration Diagnostic - Check dispatch and worker state at each tick", async ({ browser }) => {
  test.setTimeout(300000); // 5 min

  const page = await getAuthenticatedPage(browser, BASE_URL);

  // Step 1: Check initial state
  console.log("\n=== Step 1: Initial state ===");
  let data = await getUserData(page);
  console.log("Response keys:", Object.keys(data));
  console.log("userId:", data.userId);
  console.log("gold:", data.gold);
  const initialRoster = data.heroes?.roster || [];
  const initialExploring = initialRoster.filter((h: any) => h.isExploring);
  console.log(`Total heroes: ${initialRoster.length}, exploring: ${initialExploring.length}`);
  console.log(`Battle logs: ${data.battleLogs?.length || 0}`);

  // Step 2: Dispatch a hero via UI
  console.log("\n=== Step 2: Dispatch hero ===");
  await page.locator(".game-nav").getByText(/探索/).click();
  await page.waitForTimeout(1000);

  const heroBtns = page.locator(".hero-chip-btn");
  const heroBtnCount = await heroBtns.count();
  console.log(`Hero buttons found: ${heroBtnCount}`);

  if (heroBtnCount > 0) {
    await heroBtns.first().click();
    await page.waitForTimeout(300);

    // Zone 1 Easy (Goblin: 25 HP)
    await page.locator("select").first().selectOption("1");
    await page.waitForTimeout(200);
    await page.locator("select").nth(1).selectOption("1");
    await page.waitForTimeout(200);

    const dispatchBtn = page.locator("button").filter({ hasText: /派遣/i }).first();
    const btnCount = await dispatchBtn.count();
    const isDisabled = btnCount > 0 ? await dispatchBtn.isDisabled() : true;
    console.log(`Dispatch btn: count=${btnCount} disabled=${isDisabled}`);

    if (btnCount > 0 && !isDisabled) {
      await dispatchBtn.click();
      await page.waitForTimeout(2000);
      console.log("Dispatch clicked!");

      // Get UI feedback text
      const bodyText = await page.locator("body").textContent();
      if (bodyText.includes("成功派遣")) {
        console.log("UI confirms: 派遣成功");
      }
    }
  } else {
    console.log("No hero buttons - need to recruit first");
  }

  // Step 3: Reload page and check DB state
  console.log("\n=== Step 3: After dispatch (reloaded) ===");
  await page.goto(`${BASE_URL}/game`);
  await page.waitForTimeout(3000);

  data = await getUserData(page);
  const afterRoster = data.heroes?.roster || [];
  const afterExploring = afterRoster.filter((h: any) => h.isExploring);
  console.log(`Total heroes: ${afterRoster.length}, exploring: ${afterExploring.length}`);
  afterRoster.forEach((h: any) => {
    if (h.isExploring) {
      console.log(`  EXPLORING: ${h.name} zone=${h.currentZone} subZone=${h.currentSubZone}`);
    }
  });
  console.log(`cooldowns.dispatch: ${data.cooldowns?.dispatch}`);
  console.log(`gold: ${data.gold}`);

  // Step 4: Monitor every 15s
  console.log("\n=== Step 4: Monitor every 15s ===");
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(15000);

    data = await getUserData(page);
    const roster = data.heroes?.roster || [];
    const exploring = roster.filter((h: any) => h.isExploring);
    const logs = data.battleLogs || [];

    console.log(`[${(i+1)*15}s] exploring=${exploring.length} battleLogs=${logs.length} gold=${data.gold}`);

    if (exploring.length === 0 && logs.length > 0) {
      console.log("*** COMBAT FINISHED ***");
      const lastLog = logs[0];
      console.log(`  Category: ${lastLog.category}`);
      console.log(`  Heroes: ${lastLog.heroNames?.join(",")}`);
      console.log(`  Victory: ${lastLog.victory}`);
      console.log(`  Gold reward: ${lastLog.goldReward}`);
      console.log(`  XP gained: ${lastLog.xpGained}`);
      console.log(`  Log messages (first 5):`);
      lastLog.logMessages?.slice(0, 5).forEach((m: string) => console.log(`    ${m}`));
      break;
    }

    if (exploring.length === 0 && logs.length === 0 && i > 3) {
      console.log("*** NO EXPLORING AND NO LOGS - SOMETHING WRONG ***");
      break;
    }
  }

  await page.close();
  console.log("\n=== Done ===");
});
