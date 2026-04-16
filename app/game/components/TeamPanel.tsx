"use client";

import { useState } from "react";
import { GameData, Hero, useGameData } from "../hooks/useGameData";

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
}

export default function TeamPanel({ data, api }: Props) {
  const [selectedHero, setSelectedHero] = useState<string | null>(null);
  const [targetTeam, setTargetTeam] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const idleHeroes = data.heroes.roster.filter((h: Hero) => !h.isExploring);

  async function assign() {
    if (!selectedHero || targetTeam === null) { setMsg("請選擇英雄和隊伍"); return; }
    setSaving(true);
    setMsg(null);
    try {
      await api("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroId: selectedHero, action: "add", teamIdx: targetTeam }),
      });
      setMsg("已分配");
      setSelectedHero(null);
      setTargetTeam(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "失敗");
    } finally {
      setSaving(false);
    }
  }

  async function removeFromTeam(heroId: string, teamIdx: number) {
    setSaving(true);
    setMsg(null);
    try {
      await api("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroId, action: "remove", teamIdx }),
      });
      setMsg("已移除");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "失敗");
    } finally {
      setSaving(false);
    }
  }

  function getTeamHeroes(teamIdx: number): Hero[] {
    const ids = data.teams[String(teamIdx)] || [];
    return ids.map((id: string) => data.heroes.roster.find((h: Hero) => h.id === id)).filter(Boolean) as Hero[];
  }

  return (
    <div className="panel">
      <h2>👥 隊伍管理</h2>

      <div className="teams-grid">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="team-box">
            <div className="team-title">隊伍 {i + 1}</div>
            <div className="team-members">
              {getTeamHeroes(i).map((h) => (
                <div key={h.id} className="team-member">
                  <span>{h.name}</span>
                  <button className="btn-remove" onClick={() => removeFromTeam(h.id, i)}>×</button>
                </div>
              ))}
              {getTeamHeroes(i).length === 0 && <span className="empty">空</span>}
            </div>
            <button
              className={`btn-add-team ${targetTeam === i ? "selected" : ""}`}
              onClick={() => setTargetTeam(targetTeam === i ? null : i)}
              disabled={!selectedHero}
            >
              + 加入
            </button>
          </div>
        ))}
      </div>

      <div className="idle-pool">
        <h3>待命英雄（點擊選擇）</h3>
        <div className="hero-pool">
          {idleHeroes.map((h: Hero) => (
            <button
              key={h.id}
              className={`hero-chip-btn ${selectedHero === h.id ? "selected" : ""}`}
              onClick={() => setSelectedHero(selectedHero === h.id ? null : h.id)}
            >
              {h.name} Lv.{h.level}
            </button>
          ))}
          {idleHeroes.length === 0 && <p className="empty">沒有待命英雄</p>}
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-primary" onClick={assign} disabled={saving || !selectedHero || targetTeam === null}>
          {saving ? "分配中..." : "確認分配"}
        </button>
        {msg && <span className="msg">{msg}</span>}
      </div>
    </div>
  );
}
