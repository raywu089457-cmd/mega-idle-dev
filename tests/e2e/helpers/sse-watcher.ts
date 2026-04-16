import type { Page } from "@playwright/test";

/**
 * SSE (Server-Sent Events) watcher for E2E tests.
 *
 * Captures SSE events emitted by /api/events to verify
 * real-time updates (gold, materials refresh) are working.
 */

export interface UserUpdateEvent {
  userId: string;
  gold: number;
  goldCapacity: number;
  magicStones: number;
  materials: Record<string, number>;
  materialCapacity: number;
  username: string;
  [key: string]: unknown;
}

export interface SSEWatcherOptions {
  /** Maximum time to wait for events (ms). Default: 10000 */
  timeout?: number;
  /** Expected user ID to filter events (optional but recommended) */
  expectedUserId?: string;
}

const DEFAULT_TIMEOUT = 10_000;

/**
 * Watch SSE events on a page and capture user-update events.
 */
export async function watchSSEEvents(
  page: Page,
  options: SSEWatcherOptions = {}
): Promise<{
  events: UserUpdateEvent[];
  stop: () => void;
}> {
  const { timeout = DEFAULT_TIMEOUT, expectedUserId } = options;
  const events: UserUpdateEvent[] = [];

  // Inject a listener into the page that captures SSE events
  await page.evaluate(() => {
    (window as any).__sseEvents = [];
    const existingEs = (window as any).__eventSource;
    if (existingEs) {
      existingEs.addEventListener("user-update", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          (window as any).__sseEvents.push(data);
        } catch {
          // ignore parse errors
        }
      });
    }
  });

  // Poll for events until timeout
  const stopPolling = () => {};

  const poll = async (): Promise<UserUpdateEvent[]> => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const captured = await page.evaluate(() => {
        return (window as any).__sseEvents || [];
      });

      if (captured.length > 0) {
        // Filter by userId if expectedUserId is provided
        const filtered = expectedUserId
          ? captured.filter((e: UserUpdateEvent) => e.userId === expectedUserId)
          : captured;

        if (filtered.length > 0) {
          return filtered;
        }
      }

      // Wait a bit before polling again
      await new Promise((r) => setTimeout(r, 500));
    }

    return [];
  };

  const captured = await poll();

  return {
    events: captured,
    stop: stopPolling,
  };
}

/**
 * Wait for a specific resource value to change on the page.
 * Useful for verifying SSE-triggered UI updates.
 */
export async function waitForResourceChange(
  page: Page,
  selector: string,
  options: { expectedValue?: string | number; timeout?: number } = {}
): Promise<string | null> {
  const { timeout = 15_000 } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const current = await page.locator(selector).textContent();

    if (current !== null && current !== "") {
      return current;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return null;
}

/**
 * Capture the gold value before SSE refresh and verify it updates.
 * Returns { goldBefore, goldAfter, updated }.
 */
export async function captureAndVerifyGoldRefresh(
  page: Page,
  goldSelector = ".gold",
  timeout = 15_000
): Promise<{
  goldBefore: string | null;
  goldAfter: string | null;
  updated: boolean;
}> {
  const goldBefore = await page.locator(goldSelector).first().textContent();

  // Wait up to `timeout` for the SSE update to refresh the display
  const start = Date.now();
  let goldAfter: string | null = null;
  let updated = false;

  while (Date.now() - start < timeout) {
    await new Promise((r) => setTimeout(r, 1000));

    goldAfter = await page.locator(goldSelector).first().textContent();

    if (goldAfter !== null && goldAfter !== goldBefore) {
      updated = true;
      break;
    }
  }

  return {
    goldBefore,
    goldAfter,
    updated,
  };
}
