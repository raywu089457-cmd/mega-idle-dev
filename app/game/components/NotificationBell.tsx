"use client";

import { useState } from "react";
import { useNotifications, Notification } from "../hooks/useNotifications";

const NOTIF_ICONS: Record<string, string> = {
  level_up: "⬆️",
  resource_full: "📦",
  hero_hungry: "🍖",
  task_complete: "✅",
  boss_respawn: "🐉",
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="notification-bell-container">
      <button
        className={`notification-bell ${unreadCount > 0 ? "has-unread" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <span>通知</span>
            {notifications.length > 0 && (
              <button onClick={markAllAsRead} className="btn-mark-read">
                全部標記已讀
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 && (
              <p className="empty">沒有通知</p>
            )}
            {notifications.map((notif: Notification) => (
              <div
                key={notif.id}
                className={`notif-item ${notif.read ? "read" : "unread"}`}
                onClick={() => markAsRead(notif.id)}
              >
                <span className="notif-icon">{NOTIF_ICONS[notif.type] || "📢"}</span>
                <div className="notif-content">
                  <span className="notif-message">{notif.message}</span>
                  <span className="notif-time">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
