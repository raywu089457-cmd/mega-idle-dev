import { APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load saved Discord session cookies and inject them into the request context.
 * Session file is created by `tests/e2e/scripts/login-and-save-session.ts`.
 */
export function loadSessionCookies(): string {
  const sessionEnv = process.env.PLAYWRIGHT_SESSION_COOKIE;
  if (sessionEnv) return sessionEnv;

  const sessionFile = path.join(__dirname, '../e2e/.auth/discord-session.json');
  if (!fs.existsSync(sessionFile)) {
    throw new Error(
      'No session found. Run: npx playwright test tests/e2e/scripts/login-and-save-session.ts\n' +
        'Or set PLAYWRIGHT_SESSION_COOKIE env var with the next-auth.session-token value.'
    );
  }

  const session = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
  const cookies: { name: string; value: string }[] = session.cookies ?? [];
  const sessionCookie = cookies.find(
    (c) => c.name === 'next-auth.session-token' || c.name === '__Secure-next-auth.session-token'
  );

  if (!sessionCookie) {
    throw new Error('Session cookie not found in discord-session.json');
  }

  return `${sessionCookie.name}=${sessionCookie.value}`;
}

/**
 * Returns true when a Discord session is available locally.
 */
export function hasSession(): boolean {
  if (process.env.PLAYWRIGHT_SESSION_COOKIE) return true;
  const sessionFile = path.join(__dirname, '../e2e/.auth/discord-session.json');
  if (!fs.existsSync(sessionFile)) return false;
  try {
    const session = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    const cookies: { name: string; value: string }[] = session.cookies ?? [];
    return cookies.some(
      (c) => c.name === 'next-auth.session-token' || c.name === '__Secure-next-auth.session-token'
    );
  } catch {
    return false;
  }
}

/**
 * Make an authenticated request using a session cookie.
 * Returns empty object when no session is available (tests that need it should skip first).
 */
export function authHeaders(): Record<string, string> {
  try {
    const cookie = loadSessionCookies();
    return { Cookie: cookie };
  } catch {
    return {};
  }
}

export async function getJson(request: APIRequestContext, url: string, headers = {}): Promise<{ status: number; body: unknown }> {
  const response = await request.get(url, { headers });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }
  return { status: response.status(), body };
}

export async function postJson(
  request: APIRequestContext,
  url: string,
  data: unknown,
  headers = {}
): Promise<{ status: number; body: unknown }> {
  const response = await request.post(url, {
    data: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }
  return { status: response.status(), body };
}
