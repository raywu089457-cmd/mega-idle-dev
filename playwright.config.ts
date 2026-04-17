import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",

  // Run specs in parallel locally, but serial in CI to avoid OAuth conflicts
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  // - "list" for local dev (concise)
  // - "html" + "json" for CI (full reports)
  reporter: process.env.CI
    ? [
        ["list"],
        ["html", { open: "never" }],
        ["json", { outputFile: "test-results/results.json" }],
      ]
    : [["list"]],

  timeout: 600000,
  expect: { timeout: 30000 },

  use: {
    baseURL: "https://mega-idle-dev.onrender.com",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    // Accept self-signed certs for local dev (if applicable)
    ignoreHTTPSErrors: true,
  },

  // Browser projects
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        headless: true,
      },
    },
    // Uncomment for additional browser testing:
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"], headless: true },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"], headless: true },
    // },
  ],

  // Web server configuration for `playwright test`
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    stdout: "pipe",
    stderr: "pipe",
  },

  // Output directory for test artifacts (screenshots, traces, videos)
  outputDir: "test-results",

  // Global setup and teardown
  globalSetup: undefined,
  globalTeardown: undefined,
});
