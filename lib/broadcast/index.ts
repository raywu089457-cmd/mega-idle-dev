/**
 * Broadcast Service
 *
 * In-memory broadcast for single-instance deployments.
 * For multi-instance deployments (Redis available), use RedisBroadcast.
 */

type Listener = (data: string) => void;
type ListenerMap = Map<string, Listener[]>;

const listeners: ListenerMap = new Map();

function getListeners(key: string): Listener[] {
  return listeners.get(key) || [];
}

function setListeners(key: string, newListeners: Listener[]): void {
  if (newListeners.length === 0) {
    listeners.delete(key);
  } else {
    listeners.set(key, newListeners);
  }
}

/**
 * Subscribe to broadcast events for a specific user.
 */
export function subscribeUser(userId: string, eventType: string, listener: Listener): () => void {
  const key = `${eventType}:${userId}`;
  const existing = getListeners(key);
  setListeners(key, [...existing, listener]);

  return () => {
    setListeners(key, getListeners(key).filter((l) => l !== listener));
  };
}

/**
 * Subscribe to broadcast events (all events, no user filter).
 */
export function subscribe(eventType: string, listener: Listener): () => void {
  const key = `all:${eventType}`;
  const existing = getListeners(key);
  setListeners(key, [...existing, listener]);

  return () => {
    setListeners(key, getListeners(key).filter((l) => l !== listener));
  };
}

/**
 * Broadcast an event to all subscribers.
 *
 * NOTE: This is in-memory only. For multi-instance deployments,
 * configure REDIS_URL and use lib/broadcast/RedisBroadcast.ts instead.
 */
export function broadcast(eventType: string, data: object): void {
  const payload = JSON.stringify(data);

  // Broadcast to user-specific subscribers
  const userKey = `${eventType}:${(data as { userId?: string }).userId}`;
  for (const listener of getListeners(userKey)) {
    try {
      listener(payload);
    } catch {
      // Listener may have been removed during iteration
    }
  }

  // Broadcast to global subscribers
  const allKey = `all:${eventType}`;
  for (const listener of getListeners(allKey)) {
    try {
      listener(payload);
    } catch {
      // Listener may have been removed during iteration
    }
  }
}