"use client";

import { useState } from "react";
import { GameData, useGameData } from "../hooks/useGameData";

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
}

export default function RewardsPanel({ data, api }: Props) {
  const [claiming, setClaiming] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const dailyCd = data.cooldowns?.daily ? Math.max(0, 86400000 - (Date.now() - new Date(data.cooldowns.daily as string).getTime())) : 0;
  const weeklyCd = data.cooldowns?.weekly ? Math.max(0, 604800000 - (Date.now() - new Date(data.cooldowns.weekly as string).getTime())) : 0;

  function formatCd(ms: number) {
    if (ms <= 0) return "可領取";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}小時${m}分`;
  }

  async function claim(type: "daily" | "weekly") {
    setClaiming(type);
    setMsg(null);
    try {
      await api(`/api/rewards/${type}`, { method: "POST" });
      setMsg(type === "daily" ? "每日獎勵領取成功！💰500 + 💎1" : "每週獎勵領取成功！💰5000 + 💎10");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "領取失敗");
    } finally {
      setClaiming(null);
    }
  }

  return (
    <div className="panel">
      <h2>🎁 獎勵中心</h2>

      <div className="reward-card">
        <div className="reward-title">每日獎勵</div>
        <div className="reward-items">💰 500 黃金 + 💎 1 魔法石</div>
        <button
          className="btn-primary"
          onClick={() => claim("daily")}
          disabled={claiming === "daily" || dailyCd > 0}
        >
          {dailyCd > 0 ? formatCd(dailyCd) : claiming === "daily" ? "領取中..." : "領取"}
        </button>
      </div>

      <div className="reward-card">
        <div className="reward-title">每週獎勵</div>
        <div className="reward-items">💰 5000 黃金 + 💎 10 魔法石</div>
        <button
          className="btn-primary"
          onClick={() => claim("weekly")}
          disabled={claiming === "weekly" || weeklyCd > 0}
        >
          {weeklyCd > 0 ? formatCd(weeklyCd) : claiming === "weekly" ? "領取中..." : "領取"}
        </button>
      </div>

      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}
