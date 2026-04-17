"use client";

import { useState } from "react";
import { GameData, Hero, useGameData } from "../hooks/useGameData";

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
}

const ZONE_NAMES = [
  "",
  "翠綠草原 (Lv.1)", "迷霧山脈 (Lv.3)", "深邃洞穴 (Lv.5)",
  "幽靈要塞 (Lv.7)", "烈焰火山 (Lv.9)", "冰霜凍土 (Lv.11)",
  "遠古神殿 (Lv.13)", "龍之巢穴 (Lv.15)", "虛空裂隙 (Lv.17)", "混沌深淵 (Lv.20)"
];
const DIFF_NAMES = ["", "簡單", "普通", "困難"];

export default function DispatchPanel({ data, api }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [zone, setZone] = useState(1);
  const [subZone, setSubZone] = useState(1);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const idleHeroes = data.heroes.roster.filter((h: Hero) => !h.isExploring && h.type === "territory");

  function toggleHero(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function send() {
    if (selected.length === 0) { setMsg("請選擇英雄"); return; }
    setSending(true);
    setMsg(null);
    try {
      await api("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroIds: selected, zone, subZone, action: "send" }),
      });
      setMsg(`已派遣 ${selected.length} 名英雄到 ${ZONE_NAMES[zone]} ${DIFF_NAMES[subZone]}`);
      setSelected([]);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "派遣失敗");
    } finally {
      setSending(false);
    }
  }

  async function recall() {
    setSending(true);
    setMsg(null);
    try {
      await api("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recall" }),
      });
      setMsg("已召回所有英雄");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "召回失敗");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="panel">
      <h2>⚔️ 派遣探索</h2>

      <div className="zone-select">
        <label>區域: <select value={zone} onChange={(e) => setZone(Number(e.target.value))}>
          {ZONE_NAMES.slice(1).map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
        </select></label>
        <label>難度: <select value={subZone} onChange={(e) => setSubZone(Number(e.target.value))}>
          {DIFF_NAMES.slice(1).map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
        </select></label>
      </div>

      <div className="hero-select">
        {idleHeroes.map((h: Hero) => (
          <button
            key={h.id}
            className={`hero-chip-btn ${selected.includes(h.id) ? "selected" : ""}`}
            onClick={() => toggleHero(h.id)}
          >
            {h.name} Lv.{h.level}
          </button>
        ))}
        {idleHeroes.length === 0 && <p className="empty">沒有待命英雄</p>}
      </div>

      <div className="panel-footer">
        <button className="btn-primary" onClick={send} disabled={sending || selected.length === 0}>
          {sending ? "派遣中..." : `派遣 (${selected.length})`}
        </button>
        <button className="btn-secondary" onClick={recall} disabled={sending}>
          召回全部
        </button>
        {msg && <span className="msg">{msg}</span>}
      </div>
    </div>
  );
}
