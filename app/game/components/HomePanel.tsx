"use client";

import { GameData } from "../hooks/useGameData";
import { RESOURCE_NAMES, BUILDING_NAMES } from "../lib/localization";

interface Props {
  data: GameData;
}

const MAT_ICONS: Record<string, string> = {
  fruit: "🍎", water: "💧", wood: "🪵", iron: "⛓️",
  herbs: "🌿", magicStones: "💎", magic_stone: "💎", rations: "🍖", drinking_water: "🥤", potions: "🧪",
};

export default function HomePanel({ data }: Props) {
  const exploring = data.heroes.roster.filter((h) => h.isExploring);
  const idle = data.heroes.roster.filter((h) => !h.isExploring);
  const productionRates = data.productionRates || {};

  return (
    <div className="panels">
      {/* Resources */}
      <section className="panel">
        <h2>💰 資源</h2>
        <div className="resource-row">
          <span className="gold">💰 {data.gold.toLocaleString()} / {data.goldCapacity.toLocaleString()}</span>
          <span className="stones">💎 {data.magicStones}</span>
        </div>
        <div className="materials-grid">
          {Object.entries(data.materials).map(([k, v]) => (
            <div key={k} className="mat-item">
              <span>{MAT_ICONS[k] || "📦"}</span>
              <span className="mat-name">{RESOURCE_NAMES[k] || k}</span>
              <span className="mat-val">{Number(v).toLocaleString()}</span>
            </div>
          ))}
        </div>
        {Object.keys(productionRates).length > 0 && (
          <div className="production-rates">
            <h4>每 tick 產量</h4>
            <div className="rates-grid">
              {Object.entries(productionRates).map(([resource, rate]) => (
                <div key={resource} className="rate-item">
                  <span className="rate-icon">{MAT_ICONS[resource] || "📦"}</span>
                  <span className="rate-value">+{Number(rate).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Buildings */}
      <section className="panel">
        <h2>🏠 建築</h2>
        <div className="buildings-grid">
          {Object.entries(data.buildings).map(([k, b]) => (
            <div key={k} className="bld-item">
              <span className="bld-name">{BUILDING_NAMES[k] || k}</span>
              <span className="bld-lv">Lv.{b.level}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Heroes */}
      <section className="panel">
        <h2>🧙 英雄</h2>
        <p className="hero-stat">
          領地: {data.heroes.roster.filter((h) => h.type === "territory").length} / {data.heroes.territoryHeroCap}
          {" · "}
          流浪: {data.heroes.roster.filter((h) => h.type === "wandering").length} / {data.heroes.wanderingHeroCap}
        </p>
        <p className="hero-stat">
          🔍 探索中: {exploring.length} · 🏠 待命: {idle.length}
        </p>
        <div className="heroes-mini">
          {data.heroes.roster.slice(0, 8).map((h) => (
            <div key={h.id} className={`hero-chip ${h.isExploring ? "exp" : ""}`}>
              {h.name} Lv.{h.level}
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="panel">
        <h2>📊 統計</h2>
        <div className="stats-list">
          <div>探索 {data.statistics.explorations || 0} 次</div>
          <div>勝利 {data.statistics.wins || 0} / 敗 {data.statistics.losses || 0}</div>
          <div>黃金總獲得 {data.statistics.goldEarned?.toLocaleString() || 0}</div>
          <div>流浪金幣 {data.statistics.goldFromWandering?.toLocaleString() || 0}</div>
          <div>英雄招募 {data.statistics.heroesRecruited || 0}</div>
          <div>建築升級 {data.statistics.buildingsUpgraded || 0}</div>
          <div>連續登入 {data.statistics.consecutiveDays || 0} 天</div>
          <div>連續週數 {data.statistics.consecutiveWeeks || 0} 週</div>
        </div>
      </section>
    </div>
  );
}
