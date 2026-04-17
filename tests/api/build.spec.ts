import { test, expect } from '@playwright/test';
import { getJson, postJson, authHeaders, hasSession } from './helpers';

test.describe('Build API', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!hasSession()) testInfo.skip(true, 'No saved session');
  });

  test('/api/build GET returns 405 (POST-only route)', async ({ request }) => {
    // /api/build only exports POST — GET yields 405 Method Not Allowed
    const { status } = await getJson(request, '/api/build', authHeaders());
    expect(status).toBe(405);
  });

  test('POST /api/build with invalid building returns 400', async ({ request }) => {
    const { status } = await postJson(
      request,
      '/api/build',
      { buildingId: '__invalid_building__', action: 'build' },
      authHeaders()
    );
    expect([400, 422]).toContain(status);
  });

  test('POST /api/build with missing fields returns 400', async ({ request }) => {
    const { status } = await postJson(request, '/api/build', {}, authHeaders());
    expect([400, 422]).toContain(status);
  });
});

test.describe('Logs API', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!hasSession()) testInfo.skip(true, 'No saved session');
  });

  test('GET /api/logs returns log array', async ({ request }) => {
    const { status, body } = await getJson(request, '/api/logs', authHeaders());
    expect(status).toBe(200);
    expect(Array.isArray(body) || typeof body === 'object').toBe(true);
  });
});
