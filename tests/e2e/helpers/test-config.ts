/**
 * Test Discord credentials for E2E testing.
 *
 * SETUP: Create a test Discord account (not your main account):
 * 1. Go to https://discord.com/developers/applications
 * 2. Create a new application (or use existing test app)
 * 3. Add a redirect URI: http://localhost:3000/api/auth/callback/discord
 * 4. Copy Client ID and Client Secret
 * 5. Set these environment variables before running tests:
 *
 *   DISCORD_TEST_EMAIL=your-test-email@example.com
 *   DISCORD_TEST_PASSWORD=your-test-password
 *   DISCORD_TEST_USER_ID=the-discord-snowflake-id-of-test-account
 *
 * Alternatively, edit this file directly (not recommended for committed code).
 */

export interface TestCredentials {
  email: string;
  password: string;
  /** Discord user ID (snowflake) - used to validate SSE updates are for correct user */
  userId: string;
}

export const testCredentials: TestCredentials | null = (() => {
  const email = process.env.DISCORD_TEST_EMAIL;
  const password = process.env.DISCORD_TEST_PASSWORD;
  const userId = process.env.DISCORD_TEST_USER_ID;

  if (email && password && userId) {
    return { email, password, userId };
  }

  // Fallback: return null - tests requiring auth will be skipped
  return null;
})();
