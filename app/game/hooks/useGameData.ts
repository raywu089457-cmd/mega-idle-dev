"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback, useEffect, useRef } from "react";

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
  army?: {
    units: ArmyUnits;
    armory: ArmorySlots;
  };
  inventory?: Inventory;
  productionRates?: Record<string, number>;
  notifications?: Notification[];
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
  profession?: string;
  experience?: number;
  currentZone?: number;
  currentSubZone?: number;
  currentTeamIdx?: number;
  lastZone?: number;
  lastSubZone?: number;
  explorationTicks?: number;
  equipment?: Record<string, string | null>;
}

export interface ArmyUnits {
  archery: Record<string, number>;
  barracks: Record<string, number>;
}

export interface ArmorySlots {
  weapon: Record<string, number>;
  helmet: Record<string, number>;
  armor: Record<string, number>;
  accessory: Record<string, number>;
}

export interface Inventory {
  weapons: Record<string, number>;
  armor: Record<string, number>;
  helmets: Record<string, number>;
  accessories: Record<string, number>;
  potions: Record<string, number>;
}

export interface Notification {
  id: string;
  type: "level_up" | "resource_full" | "hero_hungry" | "task_complete" | "boss_respawn";
  message: string;
  timestamp: number;
  read: boolean;
}

export function useGameData() {
  const { data: session } = useSession();
  const [data, setData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user");
      if (!res.ok) {
        if (res.status === 401) {
          // Account was deleted — redirect to home to force re-auth
          window.location.href = "/";
          return;
        }
        throw new Error("Failed to load");
      }
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

  // SSE real-time updates - connect once with the user's session userId
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!session?.user?.id) return;
    if (eventSourceRef.current) return; // Already connected

    const es = new EventSource("/api/events");
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      console.log("SSE connected");
    });

    es.addEventListener("user-update", (event) => {
      try {
        const update = JSON.parse(event.data);
        // Only apply updates for this user
        if (update.userId === session.user.id) {
          setData(update);
        }
      } catch {
        // Invalid JSON, skip update
      }
    });

    es.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [session?.user?.id]);

  return { data, loading, error, fetchUser, api };
}
