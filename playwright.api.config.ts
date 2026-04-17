import { defineConfig } from '@playwright/test';

/**
 * Playwright config for API-only integration tests.
 * No browser launched — uses APIRequestContext only.
 * Auth is injected via PLAYWRIGHT_SESSION_COOKIE env var.
 */
export default defineConfig({
  testDir: './tests/api',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: 4, // parallel API calls are fine
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/api-results.json' }],
  ],

  use: {
    baseURL: process.env.API_BASE_URL ?? 'https://mega-idle-dev.onrender.com',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
});
