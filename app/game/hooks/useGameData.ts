"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const API = "";

export interface GameData {
  userId: string;
  username: string;
  gold: number;
  goldCapacity: number;
  magicStones: number;
  materials: Record<string, number>;
  materialCapacity: number;
  buildings: Record<string, { level: number }>;
  heroes: {
    roster: Hero[];
    territoryHeroCap: number;
    wanderingHeroCap: number;
  };
  teams: Record<string, string[]>;
  statistics: Record<string, number>;
  cooldowns: Record<string, unknown>;
  unlockedZones: number[];
  worldBoss: Record<string, unknown>;
  guild: Record<string, unknown>;
}

export interface Hero {
  id: string;
  name: string;
  type: "territory" | "wandering";
  level: number;
  atk: number;
  def: number;
  maxHp: number;
  currentHp: number;
  isExploring: boolean;
  hunger: number;
  thirst: number;
  rarity?: string;
  currentZone?: number;
  currentSubZone?: number;
  currentTeamIdx?: number;
  lastZone?: number;
  lastSubZone?: number;
}

export function useGameData() {
  const [data, setData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const api = useCallback(async (path: string, options?: RequestInit) => {
    const res = await fetch(path, options);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "API error");
    }
    // Refresh user data after mutation
    await fetchUser();
    return json;
  }, [fetchUser]);

  // SSE real-time updates
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const es = new EventSource("/api/events");
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      console.log("SSE connected");
    });

    es.addEventListener("user-update", (event) => {
      try {
        const update = JSON.parse(event.data);
        setData(update);
      } catch {
        // Invalid JSON, skip update
      }
    });

    es.onerror = () => {
      // EventSource will auto-reconnect, no manual intervention needed
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  return { data, loading, error, fetchUser, api };
}
