const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:3000';

function generateUniqueEmail() {
  const ts = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `test-${ts}-${random}@example.com`;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest1() {
  console.log('='.repeat(60));
  console.log('TEST 1: Email/Password Registration and Session Verification');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = generateUniqueEmail();
  const testPassword = 'testpassword123';

  console.log(`\n[Step 1] Registering user via API: ${testEmail}`);

  // Register via API
  const regResponse = await page.request.post(`${BASE_URL}/api/auth/register`, {
    data: {
      email: testEmail,
      password: testPassword,
      username: 'testuser'
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const regData = await regResponse.json();
  console.log(`[Step 1] Registration response (${regResponse.status()}):`, JSON.stringify(regData, null, 2));

  if (!regData.success) {
    console.log('[Step 1] FAILED: Registration did not succeed');
    await browser.close();
    return { passed: false, error: 'Registration failed' };
  }

  const userId = regData.data?.userId;
  console.log(`[Step 1] User ID: ${userId}`);

  console.log('\n[Step 2] Attempting to sign in...');

  // Now try to sign in using the NextAuth credentials flow
  // We need to get the CSRF token first
  const csrfResponse = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  console.log('[Step 2] CSRF token:', csrfData.csrfToken);

  // Sign in using NextAuth
  const signInResponse = await page.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
    form: {
      email: testEmail,
      password: testPassword,
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${BASE_URL}/game`,
      json: true
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  console.log('[Step 2] Sign in response status:', signInResponse.status());
  console.log('[Step 2] Sign in response headers:', signInResponse.headers());
  const signInHeaders = signInResponse.headers();
  console.log('[Step 2] Cookies set:', signInHeaders['set-cookie'] ? 'Yes' : 'No');

  // Follow redirects to get the session
  const redirectedUrl = signInResponse.url();
  console.log('[Step 2] Final URL after sign in:', redirectedUrl);

  // Get session to verify
  console.log('\n[Step 3] Checking session...');
  const sessionResponse = await page.request.get(`${BASE_URL}/api/auth/session`);
  const sessionData = await sessionResponse.json();
  console.log(`[Step 3] Session response:`, JSON.stringify(sessionData, null, 2));

  const hasUserId = sessionData.user && sessionData.user.id;
  console.log(`[Step 3] Has user id: ${hasUserId ? 'YES - ' + sessionData.user.id : 'NO'}`);

  // Try to access /game
  console.log('\n[Step 4] Navigating to /game...');
  await page.goto(`${BASE_URL}/game`, { waitUntil: 'networkidle' });
  console.log('[Step 4] Current URL:', page.url());

  const onGame = page.url().includes('/game');

  await browser.close();

  const passed = hasUserId && onGame;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST 1 RESULT: ${passed ? 'PASSED' : 'FAILED'}`);
  console.log(`${'='.repeat(60)}`);

  return { passed, sessionData, userId };
}

async function runTest2() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Account Deletion');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = generateUniqueEmail();
  const testPassword = 'testpassword123';

  // First register a user
  console.log(`\n[Step 1] Registering user via API: ${testEmail}`);
  const regResponse = await page.request.post(`${BASE_URL}/api/auth/register`, {
    data: {
      email: testEmail,
      password: testPassword,
      username: 'testuser'
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const regData = await regResponse.json();
  console.log('[Step 1] Registration response:', JSON.stringify(regData, null, 2));

  if (!regData.success) {
    await browser.close();
    return { passed: false, error: 'Registration failed' };
  }

  // Sign in
  console.log('\n[Step 2] Signing in...');
  const csrfResponse = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();

  await page.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
    form: {
      email: testEmail,
      password: testPassword,
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${BASE_URL}/game`,
      json: true
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  // Now navigate to /game
  console.log('\n[Step 3] Navigating to /game...');
  await page.goto(`${BASE_URL}/game`, { waitUntil: 'networkidle' });
  await sleep(3000);
  console.log('[Step 3] Current URL:', page.url());

  // Check if we actually got to /game
  const onGame = page.url().includes('/game');
  if (!onGame) {
    console.log('[Step 3] FAILED: Could not navigate to /game');
    const pageText = await page.locator('body').innerText().catch(() => 'N/A');
    console.log('[Step 3] Page text:', pageText.slice(0, 300));
    await browser.close();
    return { passed: false, error: 'Could not navigate to /game' };
  }

  // Look for delete button
  console.log('\n[Step 4] Looking for delete account button...');
  let deleteBtn = null;
  for (const text of ['刪除帳號', '删除账号', 'Delete Account', 'delete account', '帳號', '账号']) {
    const btn = page.locator(`button:has-text("${text}")`).first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      deleteBtn = btn;
      console.log(`[Step 4] Found delete button: ${text}`);
      break;
    }
  }

  if (!deleteBtn) {
    // List all visible buttons
    const buttons = await page.locator('button').all();
    console.log(`[Step 4] Total buttons: ${buttons.length}`);
    for (const btn of buttons.slice(0, 20)) {
      const text = await btn.textContent().catch(() => 'N/A');
      const visible = await btn.isVisible().catch(() => false);
      if (visible) {
        console.log(`[Step 4] Visible Button: "${text.trim()}"`);
      }
    }
    await browser.close();
    return { passed: false, error: 'Delete button not found' };
  }

  // Set up dialog handler
  page.on('dialog', async dialog => {
    console.log(`[Dialog] Type: ${dialog.type()}, Message: ${dialog.message().slice(0, 100)}`);
    if (dialog.type() === 'confirm') {
      await dialog.accept();
    }
  });

  await deleteBtn.click();
  console.log('[Step 4] Delete button clicked');
  await sleep(1500);

  // Try confirm buttons
  for (const text of ['確認', '确认', 'Confirm']) {
    const btn = page.locator(`button:has-text("${text}")`).first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log(`[Step 5] Clicking confirm: ${text}`);
      await btn.click();
      await sleep(500);
    }
  }

  console.log('\n[Step 6] Waiting for redirect after deletion...');
  try {
    await page.waitForURL(/\/$/, { timeout: 15000 });
    console.log('[Step 6] Redirected to:', page.url());
  } catch (e) {
    console.log('[Step 6] Did not redirect, current URL:', page.url());
  }

  console.log('\n[Step 7] Refreshing page...');
  await page.reload();
  await page.waitForLoadState('networkidle');
  await sleep(1000);
  console.log('[Step 7] After refresh, URL:', page.url());

  console.log('\n[Step 8] Navigating to /game directly...');
  await page.goto(`${BASE_URL}/game`);
  await page.waitForLoadState('networkidle');
  await sleep(1000);
  console.log('[Step 8] After navigating to /game, URL:', page.url());

  const finalUrl = page.url();
  const stayedOnRoot = finalUrl === `${BASE_URL}/` || finalUrl.endsWith('/') || finalUrl.includes('/?');

  await browser.close();

  const passed = stayedOnRoot;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST 2 RESULT: ${passed ? 'PASSED' : 'FAILED'}`);
  console.log(`Final URL: ${finalUrl}`);
  console.log(`${'='.repeat(60)}`);

  return { passed, finalUrl };
}

async function main() {
  console.log('Starting E2E Tests for Mega Idle at http://127.0.0.1:3000\n');

  try {
    const test1Result = await runTest1();
    const test2Result = await runTest2();

    console.log('\n' + '='.repeat(60));
    console.log('FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Test 1 (Registration & Session): ${test1Result.passed ? 'PASSED' : 'FAILED'}`);
    if (!test1Result.passed) {
      console.log(`  Error: ${test1Result.error}`);
    }
    console.log(`Test 2 (Account Deletion): ${test2Result.passed ? 'PASSED' : 'FAILED'}`);
    if (!test2Result.passed) {
      console.log(`  Error: ${test2Result.error}`);
    }
    console.log('='.repeat(60));

    process.exit(test1Result.passed && test2Result.passed ? 0 : 1);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

main();