"use client";

import { useState } from "react";

type Tab = "home" | "heroes" | "dispatch" | "team" | "build" | "worldboss" | "guild" | "rewards" | "logs" | "army" | "crafting" | "inventory" | "stats" | "debug";

const ALL_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "首頁", icon: "🏠" },
  { id: "heroes", label: "英雄", icon: "🧙" },
  { id: "dispatch", label: "探索", icon: "⚔️" },
  { id: "team", label: "隊伍", icon: "👥" },
  { id: "build", label: "建築", icon: "🏗️" },
  { id: "worldboss", label: "世界王", icon: "🐉" },
  { id: "army", label: "軍隊", icon: "⚔️" },
  { id: "crafting", label: "製作", icon: "🔨" },
  { id: "guild", label: "公會", icon: "🏰" },
  { id: "inventory", label: "背包", icon: "🎒" },
  { id: "rewards", label: "獎勵", icon: "🎁" },
  { id: "stats", label: "統計", icon: "📊" },
  { id: "logs", label: "戰報", icon: "📜" },
  { id: "debug", label: "除錯", icon: "🔧" },
];

const PRIMARY_TABS: Tab[] = ["home", "heroes", "dispatch", "team", "build"];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function Navigation({ active, onChange }: Props) {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* Desktop: top header with all tabs */}
      <header className="game-header">
        <h1>⚔️ 統一之戰</h1>
        <div className="header-info desktop-only">
          {ALL_TABS.map(tab => (
            <button
              key={tab.id}
              className={`header-nav-btn ${active === tab.id ? "active" : ""}`}
              onClick={() => onChange(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Mobile: bottom tab bar with 5 primary tabs + more button */}
      <nav className="mobile-nav">
        {PRIMARY_TABS.map(tab => (
          <button
            key={tab.id}
            className={`mobile-nav-btn ${active === tab.id ? "active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            <span className="mobile-nav-icon">{tab.icon}</span>
            <span className="mobile-nav-label">{tab.label}</span>
          </button>
        ))}
        <button
          className={`mobile-nav-btn more-btn ${showMore ? "active" : ""}`}
          onClick={() => setShowMore(!showMore)}
        >
          <span className="mobile-nav-icon">⋯</span>
          <span className="mobile-nav-label">更多</span>
        </button>
      </nav>

      {/* More panel overlay */}
      {showMore && (
        <div className="more-overlay" onClick={() => setShowMore(false)}>
          <div className="more-panel" onClick={e => e.stopPropagation()}>
            <div className="more-header">
              <h3>所有頁面</h3>
              <button className="more-close" onClick={() => setShowMore(false)}>✕</button>
            </div>
            <div className="more-grid">
              {ALL_TABS.filter(t => !PRIMARY_TABS.includes(t.id)).map(tab => (
                <button
                  key={tab.id}
                  className={`more-tab-btn ${active === tab.id ? "active" : ""}`}
                  onClick={() => { onChange(tab.id); setShowMore(false); }}
                >
                  <span className="more-tab-icon">{tab.icon}</span>
                  <span className="more-tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}