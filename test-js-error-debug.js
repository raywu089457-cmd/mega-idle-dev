const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:3000';

function generateUniqueEmail() {
  const ts = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `test-${ts}-${random}@example.com`;
}

async function main() {
  console.log('Checking for JavaScript errors\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console messages
  const consoleLog = [];
  page.on('console', msg => {
    consoleLog.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    consoleLog.push(`[PAGE ERROR] ${error.message}`);
  });

  const testEmail = generateUniqueEmail();
  const testPassword = 'testpassword123';

  // Register and sign in
  await page.request.post(`${BASE_URL}/api/auth/register`, {
    data: { email: testEmail, password: testPassword, username: 'testuser' },
    headers: { 'Content-Type': 'application/json' }
  });

  const csrfResponse = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();

  const signInResponse = await page.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
    form: {
      email: testEmail,
      password: testPassword,
      csrfToken: csrfData.csrfToken,
      callbackUrl: `${BASE_URL}/game`,
      json: true
    },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  // Extract and set session cookie
  const setCookieHeader = signInResponse.headers()['set-cookie'];
  if (setCookieHeader) {
    const cookieMatch = setCookieHeader.match(/next-auth\.session-token=([^;]+)/);
    if (cookieMatch) {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: cookieMatch[1],
        domain: '127.0.0.1',
        path: '/'
      }]);
    }
  }

  console.log('Navigating to /game...\n');
  await page.goto(`${BASE_URL}/game`, { waitUntil: 'load' });

  // Wait for potential async operations
  await page.waitForTimeout(10000);

  console.log('Console log:');
  consoleLog.forEach(log => console.log(`  ${log}`));

  console.log('\nFinal URL:', page.url());
  console.log('Page text:', (await page.locator('body').innerText().catch(() => 'N/A')).slice(0, 200));

  await browser.close();
}

main().catch(console.error);