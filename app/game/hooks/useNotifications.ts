"use client";

import { useState, useEffect, useCallback } from "react";

export interface Notification {
  id: string;
  type: "level_up" | "resource_full" | "hero_hungry" | "task_complete" | "boss_respawn";
  message: string;
  timestamp: number;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const es = new EventSource("/api/events");
    es.addEventListener("notification", (event) => {
      try {
        const notification = JSON.parse(event.data) as Notification;
        setNotifications((prev) => [notification, ...prev.slice(0, 49)]);
        if (!notification.read) {
          setUnreadCount((c) => c + 1);
        }
      } catch {
        // Invalid JSON
      }
    });

    es.onerror = () => {
      // EventSource will auto-reconnect
    };
    return () => {
      es.close();
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
