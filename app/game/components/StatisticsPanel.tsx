"use client";

import { useState } from "react";
import { GameData } from "../hooks/useGameData";

interface Props {
  data: GameData;
}

export default function StatisticsPanel({ data }: Props) {
  const stats = data.statistics || {};
  const totalBattles = (stats.wins || 0) + (stats.losses || 0);
  const winRate = totalBattles > 0 ? Math.round((stats.wins || 0) / totalBattles * 100) : 0;
  const maxConsecutiveDays = Math.max(stats.dailyClaims || 0, stats.consecutiveDays || 0);
  const dayProgress = maxConsecutiveDays > 0 ? Math.min(100, (stats.consecutiveDays || 0) / Math.max(maxConsecutiveDays, 1) * 100) : 0;

  const statGroups = [
    {
      title: "戰鬥統計",
      stats: [
        { label: "探索次數", value: stats.explorations || 0 },
        { label: "勝利次數", value: stats.wins || 0 },
        { label: "敗北次數", value: stats.losses || 0 },
        { label: "世界Boss擊敗", value: stats.bossesDefeated || 0 },
      ],
      visualization: {
        type: "winrate",
        data: { wins: stats.wins || 0, losses: stats.losses || 0, winRate }
      },
    },
    {
      title: "資源統計",
      stats: [
        { label: "黃金總獲得", value: (stats.goldEarned || 0).toLocaleString() },
        { label: "黃金總消耗", value: (stats.goldSpent || 0).toLocaleString() },
        { label: "流浪金幣", value: (stats.goldFromWandering || 0).toLocaleString() },
        { label: "探索金幣", value: (stats.goldFromExploration || 0).toLocaleString() },
      ],
    },
    {
      title: "英雄統計",
      stats: [
        { label: "英雄招募", value: stats.heroesRecruited || 0 },
        { label: "英雄訓練", value: stats.heroesTrained || 0 },
        { label: "英雄驅逐", value: stats.heroesExpelled || 0 },
      ],
    },
    {
      title: "建築統計",
      stats: [
        { label: "建築建造", value: stats.buildingsBuilt || 0 },
        { label: "建築升級", value: stats.buildingsUpgraded || 0 },
      ],
    },
    {
      title: "獎勵統計",
      stats: [
        { label: "每日領取", value: stats.dailyClaims || 0 },
        { label: "每週領取", value: stats.weeklyClaims || 0 },
        { label: "連續天數", value: stats.consecutiveDays || 0 },
        { label: "連續週數", value: stats.consecutiveWeeks || 0 },
      ],
      visualization: {
        type: "progress",
        data: { label: "登入進度", current: stats.consecutiveDays || 0, max: 7, unit: "天" }
      },
    },
  ];

  function renderVisualization(group: typeof statGroups[0]) {
    if (!group.visualization) return null;

    if (group.visualization.type === "winrate") {
      const data = group.visualization.data as { wins: number; losses: number; winRate: number };
      return (
        <div className="stat-visualization">
          <div className="winrate-bar">
            <div className="winrate-fill win" style={{ width: `${data.winRate}%` }} />
            <div className="winrate-fill loss" style={{ width: `${100 - data.winRate}%` }} />
          </div>
          <div className="winrate-label">
            <span className="win-text">⚔️ {data.wins}勝</span>
            <span className="rate-text">{data.winRate}%</span>
            <span className="loss-text">{data.losses}敗</span>
          </div>
        </div>
      );
    }

    if (group.visualization.type === "progress") {
      const data = group.visualization.data as { label: string; current: number; max: number; unit: string };
      const progress = Math.min(100, (data.current / data.max) * 100);
      return (
        <div className="stat-visualization">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-label">{data.label}: {data.current}/{data.max}{data.unit}</div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="panel">
      <h2>📊 統計</h2>

      <div className="stats-container">
        {statGroups.map((group) => (
          <div key={group.title} className="stat-group">
            <h3>{group.title}</h3>
            <div className="stat-grid">
              {group.stats.map((stat) => (
                <div key={stat.label} className="stat-item">
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-value">{stat.value}</span>
                </div>
              ))}
            </div>
            {renderVisualization(group)}
          </div>
        ))}
      </div>
    </div>
  );
}
