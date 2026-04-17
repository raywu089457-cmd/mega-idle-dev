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
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const consoleMessages = [];
  const consoleErrors = [];
  const networkErrors = [];
  const failedRequests = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', request => {
    failedRequests.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  const testEmail = generateUniqueEmail();
  const testPassword = 'testpassword123';
  console.log(`\n[Step 1] Navigate to ${BASE_URL}`);
  await page.goto(BASE_URL, { waitUntil: 'load' });

  // Wait for React/Next.js to hydrate
  console.log('[Step 1] Waiting for app to fully load...');
  await sleep(10000); // 10 second wait

  console.log(`[Step 1] Current URL: ${page.url()}`);

  // Get full page text for debugging
  const pageText = await page.locator('body').innerText().catch(() => 'N/A');
  console.log(`[Step 1] Page text preview: ${pageText.slice(0, 500)}`);

  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-screenshot-landing.png' }).catch(() => {});
  console.log('[Step 1] Screenshot saved as test-screenshot-landing.png');

  if (failedRequests.length > 0) {
    console.log('\n[Failed Network Requests]:');
    failedRequests.forEach(r => console.log(`  ${r}`));
  }

  if (networkErrors.length > 0) {
    console.log('\n[Network Errors (4xx/5xx)]:');
    networkErrors.forEach(r => console.log(`  ${r}`));
  }

  if (consoleErrors.length > 0) {
    console.log('\n[Console Errors]:');
    consoleErrors.forEach(e => console.log(`  ${e}`));
  }

  console.log('\n[Step 2] Looking for register button...');

  // Try different selectors for the register button
  const registerBtn = page.locator('text=/註冊|Register|注册/').first();
  try {
    await registerBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('[Step 2] Register button found and visible');
    await registerBtn.click();
  } catch (e) {
    console.log('[Step 2] Register button not visible within timeout');

    // List all links and buttons
    const links = await page.locator('a').all();
    console.log(`[Step 2] Total links found: ${links.length}`);
    for (const link of links.slice(0, 10)) {
      const text = await link.textContent().catch(() => 'N/A');
      const href = await link.getAttribute('href').catch(() => 'N/A');
      console.log(`[Step 2] Link: "${text.trim()}" -> ${href}`);
    }

    const buttons = await page.locator('button').all();
    console.log(`[Step 2] Total buttons found: ${buttons.length}`);
    for (const btn of buttons.slice(0, 10)) {
      const text = await btn.textContent().catch(() => 'N/A');
      console.log(`[Step 2] Button: "${text.trim()}"`);
    }

    await browser.close();
    return { passed: false, error: 'Register button not found or not visible' };
  }

  await page.waitForLoadState('networkidle');
  await sleep(2000);
  console.log(`[Step 2] After click, URL: ${page.url()}`);

  console.log('\n[Step 3] Filling registration form...');
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(testEmail);
  console.log(`[Step 3] Email filled: ${testEmail}`);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(testPassword);
  console.log('[Step 3] Password filled: testpassword123');

  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();
  console.log('[Step 3] Submit button clicked');

  console.log('\n[Step 4] Waiting for navigation to /game...');
  try {
    await page.waitForURL(/\/game/, { timeout: 30000 });
    console.log(`[Step 4] Current URL: ${page.url()}`);
  } catch (e) {
    console.log(`[Step 4] ERROR: ${e.message}`);
    console.log(`[Step 4] Current URL: ${page.url()}`);
    await page.screenshot({ path: 'test-screenshot-game.png' }).catch(() => {});
    await browser.close();
    return { passed: false, error: 'Navigation to /game failed' };
  }

  console.log('\n[Step 5] Verifying game interface...');
  await page.waitForLoadState('networkidle');
  await sleep(3000);
  console.log(`[Step 5] Current URL: ${page.url()}`);

  await page.screenshot({ path: 'test-screenshot-game.png' }).catch(() => {});
  console.log('[Step 5] Screenshot saved as test-screenshot-game.png');

  console.log('\n[Step 6] Checking /api/auth/session...');
  const sessionResponse = await page.request.get(`${BASE_URL}/api/auth/session`);
  const sessionData = await sessionResponse.json();
  console.log(`[Step 6] Session response status: ${sessionResponse.status()}`);
  console.log(`[Step 6] Session data: ${JSON.stringify(sessionData, null, 2)}`);

  const hasUserId = sessionData.user && sessionData.user.id;
  console.log(`[Step 6] Has user id: ${hasUserId ? 'YES - ' + sessionData.user.id : 'NO'}`);

  await browser.close();

  const passed = hasUserId;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST 1 RESULT: ${passed ? 'PASSED' : 'FAILED'}`);
  console.log(`${'='.repeat(60)}`);

  return { passed, sessionData };
}

async function runTest2() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Account Deletion');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', request => {
    failedRequests.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
  });

  const testEmail = generateUniqueEmail();
  const testPassword = 'testpassword123';

  // First register
  console.log(`\n[Step 1] Navigate to ${BASE_URL}`);
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await sleep(10000);

  console.log('\n[Step 2] Looking for register button...');
  const registerBtn = page.locator('text=/註冊|Register|注册/').first();
  try {
    await registerBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('[Step 2] Register button found');
    await registerBtn.click();
  } catch (e) {
    console.log('[Step 2] Register button not found');
    const pageText = await page.locator('body').innerText().catch(() => 'N/A');
    console.log('[Step 2] Page text:', pageText.slice(0, 300));
    await browser.close();
    return { passed: false, error: 'Register button not found' };
  }

  await page.waitForLoadState('networkidle');
  await sleep(2000);
  console.log(`[Step 2] After click, URL: ${page.url()}`);

  console.log('\n[Step 3] Filling registration form...');
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(testEmail);
  console.log(`[Step 3] Email: ${testEmail}`);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(testPassword);

  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();

  console.log('\n[Step 4] Waiting for navigation to /game...');
  await page.waitForURL(/\/game/, { timeout: 30000 });
  await sleep(3000);
  console.log(`[Step 4] Current URL: ${page.url()}`);

  await page.screenshot({ path: 'test-screenshot-game-del.png' }).catch(() => {});

  // Set up dialog handler
  page.on('dialog', async dialog => {
    console.log(`[Dialog] Type: ${dialog.type()}, Message: ${dialog.message().slice(0, 100)}`);
    if (dialog.type() === 'confirm') {
      await dialog.accept();
    }
  });

  // Wait for debug panel
  console.log('\n[Step 5] Waiting for DebugPanel to load...');
  await sleep(3000);

  // Try to find delete button
  console.log('\n[Step 6] Looking for delete account button...');
  let deleteBtn = null;
  for (const text of ['刪除帳號', '删除账号', 'Delete Account', 'delete account']) {
    const btn = page.locator(`button:has-text("${text}")`).first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      deleteBtn = btn;
      console.log(`[Step 6] Found delete button: ${text}`);
      break;
    }
  }

  if (!deleteBtn) {
    console.log('[Step 6] Delete button not found');

    // List all visible buttons for debugging
    const buttons = await page.locator('button').all();
    console.log(`[Step 6] Total buttons on page: ${buttons.length}`);
    for (const btn of buttons.slice(0, 20)) {
      const text = await btn.textContent().catch(() => 'N/A');
      const visible = await btn.isVisible().catch(() => false);
      if (visible) {
        console.log(`[Step 6] Visible Button: "${text.trim()}"`);
      }
    }
    await browser.close();
    return { passed: false, error: 'Delete button not found' };
  }

  await deleteBtn.click();
  console.log('[Step 6] Delete button clicked');
  await sleep(1500);

  // Try to click confirm buttons if they appear
  for (const text of ['確認', '确认', 'Confirm']) {
    const btn = page.locator(`button:has-text("${text}")`).first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log(`[Step 7] Clicking confirm: ${text}`);
      await btn.click();
      await sleep(500);
    }
  }

  console.log('\n[Step 8] Waiting for redirect after deletion...');
  try {
    await page.waitForURL(/\/$/, { timeout: 15000 });
    console.log(`[Step 8] Redirected to: ${page.url()}`);
  } catch (e) {
    console.log(`[Step 8] Did not redirect to /, current URL: ${page.url()}`);
  }

  console.log('\n[Step 9] Refreshing page to verify...');
  await page.reload();
  await page.waitForLoadState('networkidle');
  await sleep(1000);
  console.log(`[Step 9] After reload, URL: ${page.url()}`);

  console.log('\n[Step 10] Navigating directly to /game...');
  await page.goto(`${BASE_URL}/game`);
  await page.waitForLoadState('networkidle');
  await sleep(1000);
  console.log(`[Step 10] After navigating to /game, URL: ${page.url()}`);

  const finalUrl = page.url();
  const stayedOnRoot = finalUrl === `${BASE_URL}/` || finalUrl.endsWith('/') || finalUrl.includes('/?');

  if (consoleErrors.length > 0) {
    console.log('\n[Console Errors]:', consoleErrors);
  }

  if (failedRequests.length > 0) {
    console.log('\n[Failed Requests]:', failedRequests);
  }

  await browser.close();

  const passed = stayedOnRoot || finalUrl === BASE_URL + '/';
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
    console.log(`Test 2 (Account Deletion): ${test2Result.passed ? 'PASSED' : 'FAILED'}`);
    console.log('='.repeat(60));

    process.exit(test1Result.passed && test2Result.passed ? 0 : 1);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

main();