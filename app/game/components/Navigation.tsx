"use client";

type Tab = "home" | "heroes" | "dispatch" | "team" | "build" | "worldboss" | "guild" | "rewards" | "logs";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "首頁", icon: "🏠" },
  { id: "heroes", label: "英雄", icon: "🧙" },
  { id: "dispatch", label: "探索", icon: "⚔️" },
  { id: "team", label: "隊伍", icon: "👥" },
  { id: "build", label: "建築", icon: "🏗️" },
  { id: "worldboss", label: "世界王", icon: "🐉" },
  { id: "guild", label: "公會", icon: "🏰" },
  { id: "rewards", label: "獎勵", icon: "🎁" },
  { id: "logs", label: "戰報", icon: "📜" },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function Navigation({ active, onChange }: Props) {
  return (
    <nav className="game-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`nav-btn ${active === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
