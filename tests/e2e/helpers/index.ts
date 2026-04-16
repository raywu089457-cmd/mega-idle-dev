export { testCredentials, type TestCredentials } from "./test-config";
export {
  ensureAuthDir,
  hasCachedSession,
  getStorageStatePath,
  performDiscordLogin,
  type AuthenticatedPage,
} from "./auth-session";
export {
  watchSSEEvents,
  captureAndVerifyGoldRefresh,
  waitForResourceChange,
  type UserUpdateEvent,
  type SSEWatcherOptions,
} from "./sse-watcher";
