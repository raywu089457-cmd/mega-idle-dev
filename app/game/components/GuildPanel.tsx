"use client";

import { useState } from "react";
import { GameData, useGameData } from "../hooks/useGameData";

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
}

export default function GuildPanel({ data, api }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const guild = (data.guild || {}) as { name?: string; level?: number; contribution?: number; totalDamageToBoss?: number; dailyTasks?: Array<{ id: number; description: string; target: number; progress: number; completed: boolean; reward: { gold: number } }> };
  const dailyTasks = guild.dailyTasks ?? [];

  return (
    <div className="panel">
      <h2>🏰 公會</h2>
      <div className="guild-info">
        <div>公會: {guild.name || "無公會"}</div>
        <div>階級: {guild.level || 0}</div>
        <div>公會貢獻: {guild.contribution || 0}</div>
        <div>Boss總傷害: {guild.totalDamageToBoss || 0}</div>
      </div>

      {dailyTasks.length > 0 && (
        <div className="tasks">
          <h3>每日任務</h3>
          {dailyTasks.map((task) => (
            <div key={task.id} className="task-row">
              <div className="task-info">
                <span>{task.description}</span>
                <span>{task.progress}/{task.target}</span>
              </div>
              <div className="task-progress">
                <div className="prog-fill" style={{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }} />
              </div>
              {!task.completed && <span> reward: 💰{task.reward?.gold || 0}</span>}
              {task.completed && <span className="done">✓已完成</span>}
            </div>
          ))}
        </div>
      )}

      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}
