"use client";

import { useState, useEffect } from "react";
import { GameData, Hero, useGameData } from "../hooks/useGameData";

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
  worldBoss?: {
    currentHp: number;
    maxHp: number;
    totalDamage: number;
    lastAttack: number;
    isAlive?: boolean;
    respawnAt?: number;
  } | null;
}

export default function WorldBossPanel({ data, api, worldBoss }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [attacking, setAttacking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);

  const idleHeroes = data.heroes.roster.filter((h: Hero) => !h.isExploring && h.type === "territory");
  const bossAlive = worldBoss?.isAlive !== false;
  const bossHp = worldBoss?.currentHp ?? 3000000;
  const bossMaxHp = worldBoss?.maxHp ?? 3000000;
  const hpPct = Math.max(0, (bossHp / bossMaxHp) * 100);

  useEffect(() => {
    if (bossAlive || !worldBoss?.respawnAt) {
      setCountdown(null);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, (worldBoss.respawnAt ?? 0) - Date.now());
      if (remaining <= 0) {
        setCountdown(null);
        clearInterval(interval);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [bossAlive, worldBoss?.respawnAt]);

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

  return (
    <div className="panel">
      <h2>🐉 世界Boss</h2>
      <div className="boss-status">
        <div className="boss-name">遠古巨龍</div>
        <div className="hp-bar">
          <div className="hp-fill" style={{ width: `${hpPct}%` }} />
        </div>
        <div className="hp-text">{bossHp.toLocaleString()} / {bossMaxHp.toLocaleString()}</div>
        <div className="my-contribution">我的總傷害: {(worldBoss?.totalDamage || 0).toLocaleString()}</div>
        {!bossAlive && countdown && (
          <div className="respawn-timer">Boss已死亡，重生倒計時: {countdown}</div>
        )}
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

      {selected.length > 0 && (
        <div className="damage-preview">
          <h4>預估傷害分配</h4>
          {selected.map((id) => {
            const hero = idleHeroes.find((h) => h.id === id);
            if (!hero) return null;
            const estDmg = Math.floor(hero.atk * selected.length * 2);
            return (
              <div key={id} className="damage-row">
                <span>{hero.name}</span>
                <span>~{estDmg.toLocaleString()}</span>
              </div>
            );
          })}
          <div className="damage-total">
            總計: ~{selected.reduce((sum, id) => {
              const hero = idleHeroes.find((h) => h.id === id);
              return sum + (hero ? Math.floor(hero.atk * selected.length * 2) : 0);
            }, 0).toLocaleString()}
          </div>
        </div>
      )}

      <div className="panel-footer">
        <button className="btn-danger" onClick={attack} disabled={attacking || selected.length === 0}>
          {attacking ? "攻擊中..." : `挑戰 (${selected.length})`}
        </button>
        {msg && <span className="msg">{msg}</span>}
      </div>
    </div>
  );
}
