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
import { useGameData } from "./hooks/useGameData";

type Tab = "home" | "heroes" | "dispatch" | "team" | "build" | "worldboss" | "guild" | "rewards" | "logs";

export default function GamePage() {
  const { data: session, status } = useSession();
  const { data, loading, error, fetchUser, api } = useGameData();
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    if (status === "unauthenticated") redirect("/");
    if (status === "authenticated") fetchUser();
  }, [status, fetchUser]);

  if (status === "loading" || loading) {
    return <div className="full-loading"><div className="spinner" /><p>載入中...</p></div>;
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
      <header className="game-header">
        <h1>⚔️ Mega Idle</h1>
        <div className="header-info">
          <span className="gold">💰 {data.gold.toLocaleString()}</span>
          <span className="stones">💎 {data.magicStones}</span>
          <span className="username">{data.username}</span>
        </div>
      </header>

      <Navigation active={tab} onChange={setTab} />

      <main className="game-content">
        {tab === "home" && <HomePanel data={data} />}
        {tab === "heroes" && <HeroesPanel data={data} api={api} />}
        {tab === "dispatch" && <DispatchPanel data={data} api={api} />}
        {tab === "team" && <TeamPanel data={data} api={api} />}
        {tab === "build" && <BuildingsPanel data={data} api={api} />}
        {tab === "worldboss" && <WorldBossPanel data={data} api={api} worldBoss={data.worldBoss as any} />}
        {tab === "guild" && <GuildPanel data={data} api={api} />}
        {tab === "rewards" && <RewardsPanel data={data} api={api} />}
        {tab === "logs" && <LogsPanel logs={(data as any).battleLogs || []} />}
      </main>
    </div>
  );
}