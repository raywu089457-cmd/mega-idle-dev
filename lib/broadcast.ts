type Listener = (data: string) => void;

type ListenerMap = Map<string, Listener[]>;

const listeners: ListenerMap = new Map();

/**
 * Subscribe to broadcast events.
 * @param eventType - Event type to subscribe to (e.g., "user-update")
 * @param listener - Callback function invoked when event is broadcast
 * @returns Unsubscribe function to remove the listener
 */
export function subscribe(eventType: string, listener: Listener): () => void {
  const existing = listeners.get(eventType);
  if (existing) {
    existing.push(listener);
  } else {
    listeners.set(eventType, [listener]);
  }

  return () => {
    const current = listeners.get(eventType);
    if (current) {
      const filtered = current.filter((l) => l !== listener);
      if (filtered.length === 0) {
        listeners.delete(eventType);
      } else {
        listeners.set(eventType, filtered);
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
  const eventListeners = listeners.get(eventType);
  if (!eventListeners || eventListeners.length === 0) {
    return;
  }

  const payload = JSON.stringify(data);
  for (const listener of eventListeners) {
    try {
      listener(payload);
    } catch {
      // Listener may have been removed during iteration
    }
  }
}