"use client";

import { useState } from "react";
import { GameData, Hero, useGameData } from "../hooks/useGameData";

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
}

const RARITY_COLOR: Record<string, string> = { S: "#ff6b6b", A: "#ffa500", B: "#ffd700", C: "#4ade80", D: "#60a5fa", E: "#a78bfa", F: "#9ca3af" };

export default function HeroesPanel({ data, api }: Props) {
  const [tab, setTab] = useState<"territory" | "wandering">("territory");
  const [recruiting, setRecruiting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const heroes = data.heroes.roster.filter((h: Hero) => h.type === tab);
  const cap = tab === "territory" ? data.heroes.territoryHeroCap : data.heroes.wanderingHeroCap;
  const used = heroes.length;

  async function recruit() {
    if (used >= cap) { setMsg("已達上限"); return; }
    setRecruiting(true);
    setMsg(null);
    try {
      const res = await api("/api/heroes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "recruit", heroType: tab }) });
      setMsg(`招募成功: ${res.data?.hero?.name || "新英雄"}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "招募失敗");
    } finally {
      setRecruiting(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>🧙 英雄管理</h2>
        <div className="tab-bar">
          <button className={`tab ${tab === "territory" ? "active" : ""}`} onClick={() => setTab("territory")}>
            領地 ({data.heroes.roster.filter((h: Hero) => h.type === "territory").length}/{data.heroes.territoryHeroCap})
          </button>
          <button className={`tab ${tab === "wandering" ? "active" : ""}`} onClick={() => setTab("wandering")}>
            流浪 ({data.heroes.roster.filter((h: Hero) => h.type === "wandering").length}/{data.heroes.wanderingHeroCap})
          </button>
        </div>
      </div>

      <div className="hero-list">
        {heroes.map((h: Hero) => (
          <div key={h.id} className={`hero-row ${h.isExploring ? "exploring" : ""}`}>
            <div className="hero-info">
              <span className="hero-name" style={{ color: RARITY_COLOR[h.rarity || "D"] || "#fff" }}>
                {h.name}
              </span>
              <span className="hero-lv">Lv.{h.level}</span>
              {h.isExploring && <span className="badge">⚔️ 探索中</span>}
            </div>
            <div className="hero-stats">
              ⚔️{h.atk} 🛡️{h.def} HP:{h.currentHp}/{h.maxHp}
            </div>
            <div className="hero-status">
              🍖{Math.round(h.hunger)} 💧{Math.round(h.thirst)}
            </div>
          </div>
        ))}
        {heroes.length === 0 && <p className="empty">還沒有{getLabel(tab)}英雄</p>}
      </div>

      <div className="panel-footer">
        <button className="btn-primary" onClick={recruit} disabled={recruiting || used >= cap}>
          {recruiting ? "招募中..." : `招募${getLabel(tab)}英雄`}
        </button>
        {msg && <span className="msg">{msg}</span>}
      </div>
    </div>
  );
}

function getLabel(type: string) { return type === "territory" ? "領地" : "流浪"; }
