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
  console.log('Debugging network requests to session endpoint\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor all requests and responses
  const networkLog = [];
  page.on('request', req => {
    if (req.url().includes('/api/auth') || req.url().includes('session')) {
      networkLog.push(`REQUEST: ${req.method()} ${req.url()}`);
    }
  });
  page.on('response', res => {
    if (res.url().includes('/api/auth') || res.url().includes('session')) {
      networkLog.push(`RESPONSE: ${res.status()} ${res.url()}`);
    }
  });
  page.on('requestfailed', req => {
    networkLog.push(`FAILED: ${req.method()} ${req.url()} - ${req.failure().errorText}`);
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

  // Now navigate to /game and capture network traffic
  console.log('Navigating to /game...\n');
  await page.goto(`${BASE_URL}/game`, { waitUntil: 'networkidle' });

  // Wait a bit more for any async requests
  await sleep(3000);

  console.log('Network log (auth-related):');
  networkLog.forEach(log => console.log(`  ${log}`));

  // Check what cookies are being sent with requests
  console.log('\nCookies when accessing /game:');
  const cookies = await context.cookies();
  cookies.forEach(c => console.log(`  ${c.name}: ${c.value.slice(0, 50)}...`));

  console.log('\nFinal URL:', page.url());
  console.log('Page text:', (await page.locator('body').innerText().catch(() => 'N/A')).slice(0, 200));

  await browser.close();
}

main().catch(console.error);