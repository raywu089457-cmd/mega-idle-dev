"use client";

import { useState } from "react";

interface BattleLog {
  id: string;
  timestamp: number;
  category: string;
  heroNames: string[];
  victory: boolean;
  damageDealt: number;
  goldReward: number;
  xpGained: number;
  description?: string;
  logMessages?: string[];
}

interface Props {
  logs: BattleLog[];
}

export default function LogsPanel({ logs }: Props) {
  const [filter, setFilter] = useState<"all" | "worldboss" | "exploration">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = logs.filter((l: BattleLog) => {
    if (filter === "all") return true;
    if (filter === "worldboss") return l.category === "worldboss";
    return l.category === "solo_combat" || l.category === "team_combat";
  });

  function time(ts: number) {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id);
  }

  return (
    <div className="panel">
      <h2>📜 戰報</h2>
      <div className="tab-bar">
        <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>全部</button>
        <button className={`tab ${filter === "worldboss" ? "active" : ""}`} onClick={() => setFilter("worldboss")}>世界王</button>
        <button className={`tab ${filter === "exploration" ? "active" : ""}`} onClick={() => setFilter("exploration")}>探索</button>
      </div>

      <div className="logs-list">
        {filtered.slice(0, 30).map((l: BattleLog) => (
          <div key={l.id}>
            <div
              className={`log-row ${l.victory ? "victory" : "defeat"} ${l.logMessages?.length ? "expandable" : ""}`}
              onClick={() => l.logMessages?.length ? toggleExpand(l.id) : undefined}
              style={{ cursor: l.logMessages?.length ? "pointer" : "default" }}
              title={l.logMessages?.length ? "點擊展開戰報詳情" : undefined}
            >
              {l.logMessages?.length > 0 && (
                <span className="log-expand-icon">{expandedId === l.id ? "▼" : "▶"}</span>
              )}
              <div className="log-time">{time(l.timestamp)}</div>
              <div className="log-content">
                {l.description || `${l.heroNames.join(", ")} ${l.victory ? "⚔️勝利" : "❌敗北"}`}
              </div>
              {l.goldReward > 0 && <div className="log-reward">💰{l.goldReward}</div>}
            </div>
            {expandedId === l.id && l.logMessages?.map((msg, i) => (
              <div key={i} className="log-message">{msg}</div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && <p className="empty">沒有戰報</p>}
      </div>
    </div>
  );
}
