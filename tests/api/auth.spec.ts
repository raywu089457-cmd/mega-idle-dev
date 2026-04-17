import { test, expect } from '@playwright/test';
import { getJson, authHeaders, hasSession } from './helpers';

/**
 * Auth contract tests — verify 401 vs 200 boundary.
 * These tests work even without a valid session (they verify the 401 path).
 */

test.describe('Authentication boundary', () => {
  test('GET /api/user returns 401 without session', async ({ request }) => {
    const { status } = await getJson(request, '/api/user');
    expect(status).toBe(401);
  });

  test('GET /api/heroes returns 401 without session', async ({ request }) => {
    const { status } = await getJson(request, '/api/heroes');
    expect(status).toBe(401);
  });

  test('GET /api/build without session returns non-2xx or 405', async ({ request }) => {
    const { status } = await getJson(request, '/api/build');
    // /api/build is POST-only (405) or may reject unauthenticated (401/302)
    expect([401, 302, 307, 405]).toContain(status);
  });

  test('GET /api/zones returns 401 without session', async ({ request }) => {
    const { status } = await getJson(request, '/api/zones');
    expect(status).toBe(401);
  });

  test('GET /api/logs returns 401 without session', async ({ request }) => {
    const { status } = await getJson(request, '/api/logs');
    expect(status).toBe(401);
  });

  test('POST /api/dispatch returns 401 without session', async ({ request }) => {
    const resp = await request.post('/api/dispatch', { data: '{}' });
    expect(resp.status()).toBe(401);
  });
});

test.describe('Session-based auth (skipped when no session available)', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!hasSession()) {
      testInfo.skip(true, 'No saved session — run login flow first');
    }
  });

  test('GET /api/user returns 200 with user data', async ({ request }) => {
    const { status, body } = await getJson(request, '/api/user', authHeaders());
    expect(status).toBe(200);
    // Response: flat object { userId, username, gold, ... }
    const b = body as Record<string, unknown>;
    expect(b).toHaveProperty('userId');
    expect(b).toHaveProperty('gold');
  });

  test('GET /api/heroes returns 200 with hero list', async ({ request }) => {
    const { status, body } = await getJson(request, '/api/heroes', authHeaders());
    expect(status).toBe(200);
    const b = body as Record<string, unknown>;
    expect(b.success).toBe(true);
    expect(b).toHaveProperty('data');
  });
});
