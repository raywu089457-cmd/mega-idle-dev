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

async function main() {
  console.log('Testing NextAuth session with browser cookie jar\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = generateUniqueEmail();
  const testPassword = 'testpassword123';

  // Register via API
  console.log('[1] Registering user...');
  const regResponse = await page.request.post(`${BASE_URL}/api/auth/register`, {
    data: { email: testEmail, password: testPassword, username: 'testuser' },
    headers: { 'Content-Type': 'application/json' }
  });
  const regData = await regResponse.json();
  console.log('[1] Registration:', JSON.stringify(regData, null, 2));

  // Sign in via NextAuth
  console.log('\n[2] Signing in via NextAuth...');
  const csrfResponse = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  console.log('[2] CSRF token obtained');

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
  console.log('[2] Sign in response status:', signInResponse.status());

  // Extract session cookie from the sign-in response
  const setCookieHeader = signInResponse.headers()['set-cookie'];
  console.log('[2] Set-Cookie header present:', !!setCookieHeader);

  // Parse the session token from the cookie
  if (setCookieHeader) {
    const cookieMatch = setCookieHeader.match(/next-auth\.session-token=([^;]+)/);
    if (cookieMatch) {
      const sessionToken = cookieMatch[1];
      console.log('[2] Session token extracted (first 50 chars):', sessionToken.slice(0, 50) + '...');

      // Add the session cookie to the browser context
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: sessionToken,
        domain: '127.0.0.1',
        path: '/'
      }]);
      console.log('[2] Session cookie added to browser context');
    }
  }

  // Check session via API
  console.log('\n[3] Checking session via API...');
  const sessionResponse = await page.request.get(`${BASE_URL}/api/auth/session`);
  const sessionData = await sessionResponse.json();
  console.log('[3] Session:', JSON.stringify(sessionData, null, 2));

  // Get all cookies in context
  console.log('\n[4] Cookies in browser context:');
  const cookies = await context.cookies();
  cookies.forEach(c => console.log(`  ${c.name}: ${c.value.slice(0, 30)}...`));

  // Navigate to /game
  console.log('\n[5] Navigating to /game...');
  await page.goto(`${BASE_URL}/game`, { waitUntil: 'networkidle' });
  await sleep(5000);
  console.log('[5] URL after navigation:', page.url());

  // Get page content
  const pageText = await page.locator('body').innerText().catch(() => 'N/A');
  console.log('[5] Page text preview:', pageText.slice(0, 300));

  // Take screenshot
  await page.screenshot({ path: 'test-gamepage.png' }).catch(() => {});
  console.log('[5] Screenshot saved');

  await browser.close();
  console.log('\nDone');
}

main().catch(console.error);