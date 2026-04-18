"use client";

import { useState } from "react";
import { GameData, Hero, useGameData } from "../hooks/useGameData";

const RARITY_COLOR: Record<string, string> = { S: "#ff6b6b", A: "#ffa500", B: "#ffd700", C: "#4ade80", D: "#60a5fa", E: "#a78bfa", F: "#9ca3af" };

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
  const [confirmRecall, setConfirmRecall] = useState(false);

  const idleHeroes = data.heroes.roster.filter((h: Hero) => !h.isExploring && h.type === "territory");

  function toggleHero(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function send() {
    if (selected.length === 0) { setMsg("請選擇英雄"); return; }
    setSending(true);
    setMsg(null);
    try {
      const res = await api("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroIds: selected, zone, subZone, action: "dispatch" }),
      });
      const count = selected.length;
      setSelected([]);
      // Show success with location info
      setMsg(`✓ 已派遣 ${count} 名英雄到 ${ZONE_NAMES[zone]} ${DIFF_NAMES[subZone]}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "派遣失敗");
    } finally {
      setSending(false);
    }
  }

  async function recall() {
    if (!confirmRecall) {
      setConfirmRecall(true);
      return;
    }
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
      setConfirmRecall(false);
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
            className={`hero-chip-btn ${selected.includes(h.id) ? "selected" : ""} ${sending ? "sending" : ""}`}
            onClick={() => !sending && toggleHero(h.id)}
            disabled={sending}
            style={{ borderColor: RARITY_COLOR[h.rarity || "D"] }}
          >
            {sending && selected.includes(h.id) ? "派遣中..." : (
              <>
                <span style={{ color: RARITY_COLOR[h.rarity || "D"] }}>{h.name}</span> Lv.{h.level}
              </>
            )}
          </button>
        ))}
        {idleHeroes.length === 0 && (
          <p className="empty">
            {data.heroes.roster.filter((h: Hero) => h.type === "territory").length === 0
              ? "沒有可派遣的英雄 — 需先招募領地英雄"
              : "所有英雄都在探索中 — 等待完成或召回"}
          </p>
        )}
      </div>

      <div className="panel-footer">
        <button className="btn-primary" onClick={send} disabled={sending || selected.length === 0}>
          {sending ? "派遣中..." : `派遣 (${selected.length})`}
        </button>
        <button className="btn-secondary btn-danger" onClick={recall} disabled={sending}>
          {confirmRecall ? "確認召回？" : "召回全部"}
        </button>
        {msg && <span className="msg">{msg}</span>}
      </div>
    </div>
  );
}
