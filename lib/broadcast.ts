type Listener = (data: string) => void;

type ListenerMap = Map<string, Listener[]>;

const listeners: ListenerMap = new Map();

/**
 * Subscribe to broadcast events for a specific user.
 * @param userId - The user ID to scope the subscription to
 * @param eventType - Event type to subscribe to (e.g., "user-update")
 * @param listener - Callback function invoked when event is broadcast
 * @returns Unsubscribe function to remove the listener
 */
export function subscribeUser(userId: string, eventType: string, listener: Listener): () => void {
  const key = `${eventType}:${userId}`;
  const existing = listeners.get(key);
  if (existing) {
    existing.push(listener);
  } else {
    listeners.set(key, [listener]);
  }

  return () => {
    const current = listeners.get(key);
    if (current) {
      const filtered = current.filter((l) => l !== listener);
      if (filtered.length === 0) {
        listeners.delete(key);
      } else {
        listeners.set(key, filtered);
      }
    }
  };
}

/**
 * Subscribe to broadcast events (all events, no user filter).
 * @param eventType - Event type to subscribe to (e.g., "user-update")
 * @param listener - Callback function invoked when event is broadcast
 * @returns Unsubscribe function to remove the listener
 */
export function subscribe(eventType: string, listener: Listener): () => void {
  const key = `all:${eventType}`;
  const existing = listeners.get(key);
  if (existing) {
    existing.push(listener);
  } else {
    listeners.set(key, [listener]);
  }

  return () => {
    const current = listeners.get(key);
    if (current) {
      const filtered = current.filter((l) => l !== listener);
      if (filtered.length === 0) {
        listeners.delete(key);
      } else {
        listeners.set(key, filtered);
      }
    }
  };
}

/**
 * Broadcast an event to all subscribers of that event type.
 * @param eventType - Event type (e.g., "user-update")
 * @param data - Serializable data to send to subscribers
 */
export function broadcast(eventType: string, data: object): void {
  // Broadcast to user-specific subscribers
  const userKey = `${eventType}:${(data as any).userId}`;
  const userListeners = listeners.get(userKey);
  if (userListeners && userListeners.length > 0) {
    const payload = JSON.stringify(data);
    for (const listener of userListeners) {
      try {
        listener(payload);
      } catch {
        // Listener may have been removed during iteration
      }
    }
  }

  // Broadcast to global subscribers (for connected event, etc.)
  const allKey = `all:${eventType}`;
  const allListeners = listeners.get(allKey);
  if (allListeners && allListeners.length > 0) {
    const payload = JSON.stringify(data);
    for (const listener of allListeners) {
      try {
        listener(payload);
      } catch {
        // Listener may have been removed during iteration
      }
    }
  }
}