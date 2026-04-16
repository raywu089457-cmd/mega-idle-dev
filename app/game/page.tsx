"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

interface GameUser {
  userId: string;
  username: string;
  gold: number;
  goldCapacity: number;
  magicStones: number;
  materials: Record<string, number>;
  materialCapacity: number;
  buildings: Record<string, { level: number }>;
  heroes: {
    roster: Array<{
      id: string;
      name: string;
      type: string;
      level: number;
      atk: number;
      def: number;
      maxHp: number;
      currentHp: number;
      isExploring: boolean;
      hunger: number;
      thirst: number;
    }>;
    territoryHeroCap: number;
    wanderingHeroCap: number;
  };
  teams: Record<string, string[]>;
  statistics: Record<string, number>;
}

export default function GamePage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<GameUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/");
    }
    if (status === "authenticated") {
      fetchUser();
    }
  }, [status]);

  async function fetchUser() {
    try {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to load user");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="game-loading">
        <p>載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-error">
        <p>錯誤: {error}</p>
        <button onClick={fetchUser}>重試</button>
      </div>
    );
  }

  if (!user) return null;

  const materialIcons: Record<string, string> = {
    fruit: "🍎",
    water: "💧",
    wood: "🪵",
    iron: "⛓️",
    herbs: "🌿",
    rations: "🍖",
    drinking_water: "🥤",
    potions: "🧪",
  };

  return (
    <div className="game-layout">
      <header className="game-header">
        <h1>⚔️ {user.username}</h1>
        <div className="header-resources">
          <span className="gold">💰 {user.gold.toLocaleString()} / {user.goldCapacity.toLocaleString()}</span>
          <span className="stones">💎 {user.magicStones}</span>
        </div>
      </header>

      <main className="game-main">
        <section className="panel">
          <h2>🏠 領地</h2>
          <div className="buildings">
            {Object.entries(user.buildings).map(([key, b]) => (
              <div key={key} className="building-item">
                <span className="building-name">{key}</span>
                <span className="building-level">Lv.{b.level}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>🎒 資源</h2>
          <div className="materials">
            {Object.entries(user.materials).map(([mat, val]) => (
              <div key={mat} className="material-item">
                <span className="material-icon">{materialIcons[mat] || "📦"}</span>
                <span className="material-name">{mat}</span>
                <span className="material-val">{Number(val).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>🧙 英雄</h2>
          <div className="hero-count">
            領地英雄: {user.heroes.roster.filter((h) => h.type === "territory").length} / {user.heroes.territoryHeroCap}
            <br />
            流浪英雄: {user.heroes.roster.filter((h) => h.type === "wandering").length} / {user.heroes.wanderingHeroCap}
          </div>
          <div className="heroes-list">
            {user.heroes.roster.slice(0, 10).map((hero) => (
              <div key={hero.id} className={`hero-card ${hero.isExploring ? "exploring" : ""}`}>
                <div className="hero-name">{" "}
                  {hero.name}{" "}
                  <span className="hero-level">Lv.{hero.level}</span>
                </div>
                <div className="hero-stats">
                  ⚔️{hero.atk} 🛡️{hero.def} HP:{hero.currentHp}/{hero.maxHp}
                </div>
                <div className="hero-status">
                  {hero.isExploring ? "🔍 探索中" : "🏠 待命"}{" "}
                  🍖{hero.hunger} 💧{hero.thirst}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>📊 統計</h2>
          <div className="stats">
            <div>探索次數: {user.statistics.explorations}</div>
            <div>勝利: {user.statistics.wins} / 敗北: {user.statistics.losses}</div>
            <div>黃金總獲得: {user.statistics.goldEarned?.toLocaleString()}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
