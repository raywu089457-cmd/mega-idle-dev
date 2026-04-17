# E2E Testing Setup

## Overview

Playwright E2E tests for Discord OAuth login and game functionality.

## Test Files

| File | Purpose |
|------|---------|
| `landing.spec.ts` | Landing page, unauthenticated redirects |
| `auth.spec.ts` | Discord OAuth login flow |
| `game-journey.spec.ts` | Game page functionality, tabs, SSE |
| `scripts/explore-game.spec.ts` | Human-like game exploration |
| `scripts/test-recruit.spec.ts` | Hero recruitment flow |
| `scripts/save-session.spec.ts` | Session persistence |
| `helpers/test-config.ts` | Discord test credentials |
| `helpers/auth-session.ts` | Session management utilities |
| `helpers/sse-watcher.ts` | SSE event verification |

## Setup

### 1. Install Playwright Browsers

```bash
cd next-app
npx playwright install chromium
```

### 2. Configure Test Credentials

Create `next-app/.test-env` (DO NOT COMMIT - contains secrets):

```bash
DISCORD_TEST_EMAIL=your-test-email@gmail.com
DISCORD_TEST_PASSWORD=your-test-password
DISCORD_TEST_USER_ID=your-discord-snowflake-id
```

> ⚠️ **IMPORTANT**: The `.test-env` file is tracked in git with embedded credentials.
> Future agents should use environment variables or a separate untracked file.
> Never commit actual credentials!

To find your Discord snowflake ID: Enable Developer Mode → Right-click user → Copy ID

### 3. Configure Deployment URL

Edit `next-app/playwright.config.ts`:

```typescript
use: {
  baseURL: "https://your-deployed-app.com",  // Change this
}
```

## Running Tests

### All Tests

```bash
cd next-app
export $(cat .test-env | xargs) && npx playwright test
```

### Specific Test File

```bash
cd next-app
export $(cat .test-env | xargs) && npx playwright test auth.spec.ts
```

### With headed browser (visible browser)

```bash
cd next-app
export $(cat .test-env | xargs) && npx playwright test --project=chromium --headed
```

### Debug mode (see what Playwright is doing)

```bash
cd next-app
export $(cat .test-env | xargs) && DEBUG=pw:browser npx playwright test
```

## Test Environment Variables

| Variable | Description |
|----------|-------------|
| `DISCORD_TEST_EMAIL` | Test account email |
| `DISCORD_TEST_PASSWORD` | Test account password |
| `DISCORD_TEST_USER_ID` | Discord snowflake ID for the test user |

## Session Caching

Tests use Playwright's `storageState` to cache OAuth sessions:

- Session file: `tests/e2e/.auth/discord-session.json`
- Delete this file to force fresh OAuth login
- Session expires when Discord token expires

## CI Configuration

```bash
# Run in CI mode (serial, retries, full reporters)
CI=true npx playwright test
```

## Troubleshooting

### Discord shows "App Launched" page
The test handles this automatically with the "Continue to Discord" button click.

### Tests timeout on OAuth
Discord may require additional verification for the test account. Try:
1. Manually log into Discord on the test machine first
2. Check if the test account has 2FA enabled (sometimes causes issues)

### MongoDB connection errors
If testing against local dev server, ensure MongoDB is running:
```bash
# Check MongoDB connection
mongosh "mongodb://localhost:27017/mega_idle_dev"
```

### Session not persisting across tests
The `getAuthenticatedPage()` helper in `game-journey.spec.ts` handles this. If having issues, delete `tests/e2e/.auth/discord-session.json`.

## Architecture Notes

- Tests use `serial` mode for authenticated tests to share session
- `game-journey.spec.ts` uses `getAuthenticatedPage()` helper for consistent auth
- SSE tests inject `__sseEvents` into window for verification
- Discord OAuth callback URL: `/api/auth/callback/discord`
