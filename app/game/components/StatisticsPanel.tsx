"use client";

import { useState } from "react";
import { GameData } from "../hooks/useGameData";

interface Props {
  data: GameData;
}

export default function StatisticsPanel({ data }: Props) {
  const stats = data.statistics || {};
  const statGroups = [
    {
      title: "戰鬥統計",
      stats: [
        { label: "探索次數", value: stats.explorations || 0 },
        { label: "勝利次數", value: stats.wins || 0 },
        { label: "敗北次數", value: stats.losses || 0 },
        { label: "世界Boss擊敗", value: stats.bossesDefeated || 0 },
      ],
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
    },
  ];

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
          </div>
        ))}
      </div>
    </div>
  );
}
