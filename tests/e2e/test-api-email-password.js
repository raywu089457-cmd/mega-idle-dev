/**
 * E2E API Testing Script
 * Tests core game APIs using email/password auth session.
 * Uses Playwright to perform browser-based login and extract session cookies.
 *
 * Run: node tests/e2e/test-api-email-password.js
 */

const { chromium } = require('playwright');

const BASE_URL = 'https://mega-idle-dev.onrender.com';
const TEST_EMAIL = 'sssssss@gmail.com';
const TEST_PASSWORD = 'sssssss';

async function fetchWithError(url, options = {}) {
  const response = await fetch(url, options);
  let body;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }
  return { status: response.status, headers: response.headers, body };
}

async function loginViaBrowser() {
  console.log('\n=== LOGIN TEST (Browser-based) ===');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    // Go to landing page
    console.log('Navigating to landing page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    console.log('Current URL:', page.url());

    // Wait a bit for any JS to load
    await page.waitForTimeout(2000);

    // Look for email/password form on landing page
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    const emailVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
    const passwordVisible = await passwordInput.isVisible({ timeout: 5000 }).catch(() => false);

    console.log('Email input visible:', emailVisible);
    console.log('Password input visible:', passwordVisible);

    if (!emailVisible) {
      // Try to find a button that leads to email login
      const emailBtn = page.locator('button:has-text("Email"), button:has-text("Sign in"), button:has-text("登入")').first();
      const emailBtnVisible = await emailBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (emailBtnVisible) {
        console.log('Clicking email/signin button...');
        await emailBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Now try to find the inputs again
    const emailInput2 = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput2 = page.locator('input[type="password"], input[name="password"]').first();

    const emailVisible2 = await emailInput2.isVisible({ timeout: 5000 }).catch(() => false);
    const passwordVisible2 = await passwordInput2.isVisible({ timeout: 5000 }).catch(() => false);

    console.log('Email input visible (attempt 2):', emailVisible2);
    console.log('Password input visible (attempt 2):', passwordVisible2);

    if (emailVisible2 && passwordVisible2) {
      console.log('\nFilling in login form...');
      await emailInput2.fill(TEST_EMAIL);
      await passwordInput2.fill(TEST_PASSWORD);

      // Find and click submit button
      const submitBtn = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Sign in"), button:has-text("登入")').first();
      console.log('Clicking submit button...');
      await submitBtn.click();

      // Wait a bit for any response
      await page.waitForTimeout(3000);

      console.log('Current URL after login:', page.url());

      // Check for any error messages
      const errorMessage = page.locator('.error, .alert-error, [class*="error"], text=/error/i').first();
      const errorVisible = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
      if (errorVisible) {
        const errorText = await errorMessage.textContent();
        console.log('Error message found:', errorText);
      }

      // Print console messages
      if (consoleMessages.length > 0) {
        console.log('\nConsole messages:');
        consoleMessages.forEach(msg => console.log('  ', msg));
      }

      // Get session cookies
      const cookies = await context.cookies();
      console.log('\nCookies obtained:', cookies.length);

      const sessionCookie = cookies.find(
        c => c.name === 'next-auth.session-token' || c.name === '__Secure-next-auth.session-token'
      );

      if (sessionCookie) {
        console.log('Session cookie found:', sessionCookie.name);
        console.log('Session cookie value (first 50 chars):', sessionCookie.value.substring(0, 50));

        // Return cookie in proper format
        await browser.close();
        return `${sessionCookie.name}=${sessionCookie.value}`;
      } else {
        console.log('Session cookie NOT found in cookies');
        console.log('All cookies:', JSON.stringify(cookies, null, 2));
      }
    } else {
      console.log('Could not find email/password form');
      const content = await page.content();
      console.log('Page content (first 1000 chars):', content.substring(0, 1000));
    }

    await browser.close();
    return '';
  } catch (error) {
    console.error('Browser login error:', error);
    await browser.close();
    return '';
  }
}

async function testHeroes(cookie) {
  console.log('\n=== HEROES API TEST ===');
  const response = await fetchWithError(`${BASE_URL}/api/heroes`, {
    headers: { Cookie: cookie },
  });

  console.log('GET /api/heroes - Status:', response.status);
  console.log('Response:', JSON.stringify(response.body, null, 2));

  if (response.status === 200 && response.body && typeof response.body === 'object') {
    const b = response.body;
    const data = b.data || b;

    // Check for S/A/B rarity heroes
    const territoryHeroes = data.territoryHeroes || [];
    const wanderingHeroes = data.wanderingHeroes || [];
    const allHeroes = [...territoryHeroes, ...wanderingHeroes];

    console.log('\nTotal heroes found:', allHeroes.length);
    console.log('Territory heroes:', territoryHeroes.length);
    console.log('Wandering heroes:', wanderingHeroes.length);

    if (allHeroes.length > 0) {
      const types = new Set(allHeroes.map(h => h.type));
      console.log('Hero types/rarities found:', [...types]);

      const byType = {};
      allHeroes.forEach(h => {
        const type = h.type;
        byType[type] = (byType[type] || 0) + 1;
      });
      console.log('Heroes by type:', byType);
    }
  }

  return response.status === 200;
}

async function testUser(cookie) {
  console.log('\n=== USER API TEST ===');
  const response = await fetchWithError(`${BASE_URL}/api/user`, {
    headers: { Cookie: cookie },
  });

  console.log('GET /api/user - Status:', response.status);

  if (response.status === 200 && response.body && typeof response.body === 'object') {
    const b = response.body;

    // Check building data
    const buildings = b.buildings;
    console.log('\nBuildings:', JSON.stringify(buildings, null, 2));

    // Check productionRates
    const productionRates = b.productionRates;
    console.log('\nProductionRates:', JSON.stringify(productionRates, null, 2));

    // Check statistics
    const statistics = b.statistics;
    console.log('\nStatistics:', JSON.stringify(statistics, null, 2));

    // Check resources
    const resources = b.resources;
    console.log('\nResources:', JSON.stringify(resources, null, 2));

    // Check capacity
    const capacity = b.capacity;
    console.log('\nCapacity:', JSON.stringify(capacity, null, 2));

    // Check full user object keys
    console.log('\nUser object keys:', Object.keys(b));
  } else {
    console.log('Response:', JSON.stringify(response.body, null, 2));
  }

  return response.status === 200;
}

async function testDispatch(cookie) {
  console.log('\n=== DISPATCH API TEST ===');

  // First get heroes to find a valid hero ID
  const heroesResp = await fetchWithError(`${BASE_URL}/api/heroes`, {
    headers: { Cookie: cookie },
  });

  let heroId = 'test_hero';
  if (heroesResp.status === 200 && heroesResp.body && typeof heroesResp.body === 'object') {
    const b = heroesResp.body;
    const data = b.data || b;
    const territoryHeroes = data.territoryHeroes || [];
    if (territoryHeroes.length > 0) {
      heroId = territoryHeroes[0].id;
      console.log('Using hero ID:', heroId);
    }
  }

  // Test dispatch to zone 1, subZone 1 (easy)
  const dispatchBody = {
    action: 'dispatch',
    heroId: heroId,
    zone: 1,
    subZone: 1,
    difficulty: 1,
  };

  console.log('Dispatch request:', JSON.stringify(dispatchBody));
  const response = await fetchWithError(`${BASE_URL}/api/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(dispatchBody),
  });

  console.log('POST /api/dispatch - Status:', response.status);
  console.log('Response:', JSON.stringify(response.body, null, 2));

  if (response.status === 200 && response.body && typeof response.body === 'object') {
    const b = response.body;
    console.log('Dispatch result type:', b.type);
    console.log('Has cooldownSeconds:', b.cooldownSeconds !== undefined);
    console.log('Cooldown seconds:', b.cooldownSeconds);
  }

  return response.status === 200;
}

async function testBuild(cookie) {
  console.log('\n=== BUILD API TEST ===');

  // Get current user state first
  const userResp = await fetchWithError(`${BASE_URL}/api/user`, {
    headers: { Cookie: cookie },
  });

  if (userResp.status !== 200) {
    console.log('Cannot test build - failed to get user data');
    return false;
  }

  const buildings = userResp.body.buildings;
  console.log('Current buildings:', JSON.stringify(buildings, null, 2));

  // Try to build/upgrade a building
  const buildBody = {
    action: 'upgrade',
    buildingType: 'barracks',
  };

  console.log('Build request:', JSON.stringify(buildBody));
  const response = await fetchWithError(`${BASE_URL}/api/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(buildBody),
  });

  console.log('POST /api/build - Status:', response.status);
  console.log('Response:', JSON.stringify(response.body, null, 2));

  return response.status === 200;
}

async function runTests() {
  console.log('===========================================');
  console.log('E2E API Testing - Email/Password Auth');
  console.log('===========================================');

  try {
    // Step 1: Login via browser and get session cookie
    const sessionCookie = await loginViaBrowser();

    if (!sessionCookie) {
      console.log('\n[FAIL] Could not obtain session cookie via browser');
      console.log('Cannot proceed with API tests.');
      return;
    } else {
      console.log('\n[OK] Session cookie obtained via browser');
    }

    // Step 2: Test Heroes API
    const heroesOk = await testHeroes(sessionCookie);

    // Step 3: Test User API
    const userOk = await testUser(sessionCookie);

    // Step 4: Test Dispatch API
    const dispatchOk = await testDispatch(sessionCookie);

    // Step 5: Test Build API
    const buildOk = await testBuild(sessionCookie);

    // Summary
    console.log('\n===========================================');
    console.log('TEST SUMMARY');
    console.log('===========================================');
    console.log('Heroes API:  ', heroesOk ? 'PASS' : 'FAIL');
    console.log('User API:    ', userOk ? 'PASS' : 'FAIL');
    console.log('Dispatch API:', dispatchOk ? 'PASS' : 'FAIL');
    console.log('Build API:   ', buildOk ? 'PASS' : 'FAIL');

  } catch (error) {
    console.error('\n[ERROR] Test execution failed:', error);
  }
}

runTests();