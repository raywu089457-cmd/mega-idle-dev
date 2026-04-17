import { test, expect } from '@playwright/test';
import { getJson, postJson, authHeaders, hasSession } from './helpers';

test.describe('Heroes API', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!hasSession()) testInfo.skip(true, 'No saved session — run login flow first');
  });

  test('GET /api/heroes returns heroes envelope', async ({ request }) => {
    const { status, body } = await getJson(request, '/api/heroes', authHeaders());
    expect(status).toBe(200);
    const b = body as Record<string, unknown>;
    // Response: { success: true, data: { territoryHeroes, wanderingHeroes, ... } }
    expect(b.success).toBe(true);
    expect(b).toHaveProperty('data');
  });

  test('GET /api/heroes data contains hero arrays', async ({ request }) => {
    const { status, body } = await getJson(request, '/api/heroes', authHeaders());
    expect(status).toBe(200);
    const data = ((body as Record<string, unknown>).data ?? {}) as Record<string, unknown>;
    const territoryHeroes = (data.territoryHeroes ?? []) as unknown[];
    const wanderingHeroes = (data.wanderingHeroes ?? []) as unknown[];
    expect(Array.isArray(territoryHeroes) || Array.isArray(wanderingHeroes)).toBe(true);

    const allHeroes = [...territoryHeroes, ...wanderingHeroes];
    if (allHeroes.length > 0) {
      const hero = allHeroes[0] as Record<string, unknown>;
      expect(hero).toHaveProperty('id');
      expect(hero).toHaveProperty('name');
      expect(hero).toHaveProperty('level');
      expect(hero).toHaveProperty('type');
    }
  });

  test('POST /api/heroes with unknown action returns 400', async ({ request }) => {
    const { status } = await postJson(
      request,
      '/api/heroes',
      { action: '__invalid_action__' },
      authHeaders()
    );
    expect([400, 422]).toContain(status);
  });

  test('POST /api/heroes/train with missing heroId returns 400', async ({ request }) => {
    const resp = await request.post('/api/heroes/train', {
      data: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    expect([400, 422, 404]).toContain(resp.status());
  });

  test('POST /api/heroes/feed with missing heroId returns error', async ({ request }) => {
    const resp = await request.post('/api/heroes/feed', {
      data: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    expect([400, 422, 404]).toContain(resp.status());
  });
});
