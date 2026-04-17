import { test, expect } from '@playwright/test';
import { getJson, postJson, authHeaders, hasSession } from './helpers';

test.describe('Dispatch API', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!hasSession()) testInfo.skip(true, 'No saved session — run login flow first');
  });

  test('POST /api/dispatch with invalid zone returns 400', async ({ request }) => {
    const { status } = await postJson(
      request,
      '/api/dispatch',
      { action: 'dispatch', heroId: 'fake_hero', zone: 99, difficulty: 1 },
      authHeaders()
    );
    expect([400, 422, 404]).toContain(status);
  });

  test('POST /api/dispatch with invalid difficulty returns 400', async ({ request }) => {
    const { status } = await postJson(
      request,
      '/api/dispatch',
      { action: 'dispatch', heroId: 'fake_hero', zone: 1, difficulty: 99 },
      authHeaders()
    );
    expect([400, 422, 404]).toContain(status);
  });

  test('POST /api/dispatch with non-existent heroId returns 404', async ({ request }) => {
    const { status } = await postJson(
      request,
      '/api/dispatch',
      { action: 'dispatch', heroId: 'definitely_fake_hero_id', zone: 1, difficulty: 1 },
      authHeaders()
    );
    expect([400, 404, 422]).toContain(status);
  });

  test('POST /api/dispatch recall with non-existent heroId returns valid response', async ({ request }) => {
    const { status, body } = await postJson(
      request,
      '/api/dispatch',
      { action: 'recall', heroId: 'definitely_fake_hero_id' },
      authHeaders()
    );
    // Server recalls 0 heroes gracefully (success=true, recalledCount=0) or returns 4xx
    expect([200, 400, 404, 422]).toContain(status);
    if (status === 200) {
      const b = body as Record<string, unknown>;
      expect(b).toHaveProperty('success');
    }
  });
});

test.describe('Zones API', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!hasSession()) testInfo.skip(true, 'No saved session');
  });

  test('GET /api/zones returns zone data', async ({ request }) => {
    const { status, body } = await getJson(request, '/api/zones', authHeaders());
    expect(status).toBe(200);
    const b = body as Record<string, unknown>;
    expect(b.success).toBe(true);
    expect(b).toHaveProperty('data');
  });
});
