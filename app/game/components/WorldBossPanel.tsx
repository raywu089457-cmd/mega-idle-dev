"use client";

import { useState } from "react";
import { GameData, Hero, useGameData } from "../hooks/useGameData";

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
  worldBoss?: { currentHp: number; maxHp: number; totalDamage: number; lastAttack: number } | null;
}

export default function WorldBossPanel({ data, api, worldBoss }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [attacking, setAttacking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const idleHeroes = data.heroes.roster.filter((h: Hero) => !h.isExploring);

  function toggle(id: string) {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  async function attack() {
    if (selected.length === 0) { setMsg("請選擇英雄"); return; }
    setAttacking(true);
    setMsg(null);
    try {
      const res = await api("/api/worldboss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroIds: selected }),
      });
      setMsg(res.data?.victory ? "🎉 擊敗世界Boss！" : `攻擊造成 ${res.data?.damage || 0} 傷害`);
      setSelected([]);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "攻擊失敗");
    } finally {
      setAttacking(false);
    }
  }

  const bossHp = worldBoss?.currentHp ?? 3000000;
  const bossMaxHp = worldBoss?.maxHp ?? 3000000;
  const hpPct = Math.max(0, (bossHp / bossMaxHp) * 100);

  return (
    <div className="panel">
      <h2>🐉 世界Boss</h2>
      <div className="boss-status">
        <div className="boss-name">遠古巨龍</div>
        <div className="hp-bar">
          <div className="hp-fill" style={{ width: `${hpPct}%` }} />
        </div>
        <div className="hp-text">{bossHp.toLocaleString()} / {bossMaxHp.toLocaleString()}</div>
        <div className="boss-dmg">我方總傷害: {(worldBoss?.totalDamage || 0).toLocaleString()}</div>
      </div>

      <div className="hero-select">
        {idleHeroes.map((h: Hero) => (
          <button
            key={h.id}
            className={`hero-chip-btn ${selected.includes(h.id) ? "selected" : ""}`}
            onClick={() => toggle(h.id)}
          >
            {h.name} Lv.{h.level}
          </button>
        ))}
        {idleHeroes.length === 0 && <p className="empty">沒有待命英雄</p>}
      </div>

      <div className="panel-footer">
        <button className="btn-danger" onClick={attack} disabled={attacking || selected.length === 0}>
          {attacking ? "攻擊中..." : `挑戰 (${selected.length})`}
        </button>
        {msg && <span className="msg">{msg}</span>}
      </div>
    </div>
  );
}
