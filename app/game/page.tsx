"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "./components/Navigation";
import HomePanel from "./components/HomePanel";
import HeroesPanel from "./components/HeroesPanel";
import DispatchPanel from "./components/DispatchPanel";
import TeamPanel from "./components/TeamPanel";
import BuildingsPanel from "./components/BuildingsPanel";
import WorldBossPanel from "./components/WorldBossPanel";
import GuildPanel from "./components/GuildPanel";
import RewardsPanel from "./components/RewardsPanel";
import LogsPanel from "./components/LogsPanel";
import ArmyPanel from "./components/ArmyPanel";
import CraftingPanel from "./components/CraftingPanel";
import InventoryPanel from "./components/InventoryPanel";
import StatisticsPanel from "./components/StatisticsPanel";
import NotificationBell from "./components/NotificationBell";
import DebugPanel from "./components/DebugPanel";
import { useGameData } from "./hooks/useGameData";

const MAT_ICONS: Record<string, string> = {
  fruit: "🍎", water: "💧", wood: "🪵", iron: "⛓️",
  herbs: "🌿", magicStones: "💎", magic_stone: "💎", rations: "🍖", drinking_water: "🥤", potions: "🧪",
};

function getMaterialIcon(k: string): string {
  return MAT_ICONS[k] || "📦";
}

type Tab = "home" | "heroes" | "dispatch" | "team" | "build" | "worldboss" | "guild" | "rewards" | "logs" | "army" | "crafting" | "inventory" | "stats" | "debug";

export default function GamePage() {
  const { data: session, status } = useSession();
  const { data, loading, error, fetchUser, api } = useGameData();
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    if (status === "authenticated") fetchUser();
  }, [status, fetchUser]);

  if (status === "loading" || loading) {
    return <div className="full-loading"><div className="spinner" /><p>⚔️ Mega Idle 載入中...</p></div>;
  }

  if (status === "unauthenticated") {
    redirect("/");
  }

  if (error || !data) {
    return (
      <div className="game-error">
        <p>錯誤: {error}</p>
        <button onClick={fetchUser}>重試</button>
      </div>
    );
  }

  return (
    <div className="game-shell">
      <Navigation
        active={tab}
        onChange={setTab}
        gold={data.gold}
        goldCapacity={data.goldCapacity}
        username={data.username}
      />
      <div className="header-resources mobile-only">
        <span className="gold">💰 {data.gold.toLocaleString()}</span>
        <span className="stones">💎 {data.magicStones}</span>
        <span className="username">{data.username}</span>
        <div className="mobile-resources">
          {Object.entries(data.materials).map(([k, v]) => (
            <span key={k} className="mobile-res-item">
              {getMaterialIcon(k)} {Number(v).toLocaleString()}
            </span>
          ))}
        </div>
      </div>

      <main className="game-content">
        {tab === "home" && <HomePanel data={data} />}
        {tab === "heroes" && <HeroesPanel data={data} api={api} />}
        {tab === "dispatch" && <DispatchPanel data={data} api={api} />}
        {tab === "team" && <TeamPanel data={data} api={api} />}
        {tab === "build" && <BuildingsPanel data={data} api={api} />}
        {tab === "army" && <ArmyPanel data={data} api={api} />}
        {tab === "worldboss" && <WorldBossPanel data={data} api={api} worldBoss={data.worldBoss as any} />}
        {tab === "crafting" && <CraftingPanel data={data} api={api} />}
        {tab === "guild" && <GuildPanel data={data} api={api} />}
        {tab === "inventory" && <InventoryPanel data={data} api={api} />}
        {tab === "rewards" && <RewardsPanel data={data} api={api} />}
        {tab === "stats" && <StatisticsPanel data={data} />}
        {tab === "logs" && <LogsPanel logs={(data as any).battleLogs || []} />}
        {tab === "debug" && <DebugPanel />}
      </main>
    </div>
  );
}
