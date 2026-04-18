"use client";

import { useState } from "react";

type Tab = "home" | "heroes" | "dispatch" | "team" | "build" | "worldboss" | "guild" | "rewards" | "logs" | "army" | "crafting" | "inventory" | "stats" | "debug";

const PRIMARY_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "首頁", icon: "🏠" },
  { id: "heroes", label: "英雄", icon: "🧙" },
  { id: "dispatch", label: "探索", icon: "⚔️" },
  { id: "team", label: "隊伍", icon: "👥" },
  { id: "build", label: "建築", icon: "🏗️" },
];

const SECONDARY_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "worldboss", label: "世界王", icon: "🐉" },
  { id: "army", label: "軍隊", icon: "⚔️" },
  { id: "crafting", label: "製作", icon: "🔨" },
  { id: "guild", label: "公會", icon: "🏰" },
  { id: "inventory", label: "背包", icon: "🎒" },
];

const OTHER_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "rewards", label: "獎勵", icon: "🎁" },
  { id: "stats", label: "統計", icon: "📊" },
  { id: "logs", label: "戰報", icon: "📜" },
  { id: "debug", label: "除錯", icon: "🔧" },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function Navigation({ active, onChange }: Props) {
  const [showMore, setShowMore] = useState(false);

  function renderTab(tab: { id: Tab; label: string; icon: string }) {
    return (
      <button
        key={tab.id}
        className={`nav-btn ${active === tab.id ? "active" : ""}`}
        onClick={() => onChange(tab.id)}
      >
        <span className="nav-icon">{tab.icon}</span>
        <span className="nav-label">{tab.label}</span>
      </button>
    );
  }

  return (
    <nav className="game-nav">
      <div className="nav-primary">
        {PRIMARY_TABS.map(renderTab)}
      </div>
      <div className="nav-secondary">
        {SECONDARY_TABS.map(renderTab)}
        <button
          className={`nav-btn more-btn ${showMore ? "active" : ""}`}
          onClick={() => setShowMore(!showMore)}
        >
          <span className="nav-icon">⋯</span>
          <span className="nav-label">更多</span>
        </button>
      </div>
      {showMore && (
        <div className="nav-more">
          {OTHER_TABS.map(renderTab)}
        </div>
      )}
    </nav>
  );
}
