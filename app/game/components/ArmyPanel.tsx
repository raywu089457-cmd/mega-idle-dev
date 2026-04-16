"use client";

import { useState } from "react";
import { GameData, useGameData } from "../hooks/useGameData";
import ITEMS from "@/lib/game/_CONSTS/items";
type ItemEntry = { name: string; type: string; stats?: { attack: number; defense: number; hp: number }; cost?: Record<string, number>; healing?: number };
const ITEMS_TYPED: Record<string, ItemEntry> = ITEMS as any;

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
}

const ARCHERY_UNITS = ["huntsman", "archer", "ranger", "survivalist", "sharpshooter"];
const BARRACKS_UNITS = ["peasant", "militia", "guardsman", "knight", "berserker", "justicar"];
const UNIT_NAMES: Record<string, string> = {
  huntsman: "獵人", archer: "弓箭手", ranger: "巡林客", survivalist: "生存專家", sharpshooter: "神射手",
  peasant: "農民", militia: "民兵", guardsman: "衛兵", knight: "騎士", berserker: "狂戰士", justicar: "正義使者",
};
const UNIT_ICONS: Record<string, string> = {
  huntsman: "🏹", archer: "🏹", ranger: "🎯", survivalist: "🧭", sharpshooter: "💀",
  peasant: "🧑‍🌾", militia: "⚔️", guardsman: "🛡️", knight: "🏰", berserker: "🪓", justicar: "⚖️",
};
const ARMORY_SLOTS = [
  { key: "weapon", name: "武器", icon: "⚔️" },
  { key: "armor", name: "盔甲", icon: "🛡️" },
  { key: "helmet", name: "頭盔", icon: "⛑️" },
  { key: "accessory", name: "飾品", icon: "💍" },
];

const BASE_COSTS: Record<string, Record<string, number>> = {
  archery: { huntsman: 50, archer: 100, ranger: 200, survivalist: 400, sharpshooter: 800 },
  barracks: { peasant: 30, militia: 80, guardsman: 200, knight: 500, berserker: 600, justicar: 1000 },
};

export default function ArmyPanel({ data, api }: Props) {
  const [tab, setTab] = useState<"training" | "armory">("training");
  const [archeryTab, setArcheryTab] = useState<"archery" | "barracks">("archery");
  const [training, setTraining] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const armyUnits = data.army?.units || { archery: {}, barracks: {} };
  const armoryData = data.army?.armory || {};
  const archeryLevel = data.buildings?.archery?.level || 0;
  const barracksLevel = data.buildings?.barracks?.level || 0;

  function getTrainingCost(buildingType: string, unitType: string): number {
    const level = buildingType === "archery" ? archeryLevel : barracksLevel;
    const base = BASE_COSTS[buildingType]?.[unitType] || 100;
    return Math.floor(base * Math.pow(1.5, Math.max(0, level - 1)));
  }

  async function trainUnit(buildingType: string, unitType: string) {
    const cost = getTrainingCost(buildingType, unitType);
    if (data.gold < cost) { setMsg("黃金不足"); return; }
    setTraining(true);
    setMsg(null);
    try {
      await api("/api/army", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "train", buildingType, unitType, count: 1 }),
      });
      setMsg(`訓練成功: ${UNIT_NAMES[unitType]}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "訓練失敗");
    } finally {
      setTraining(false);
    }
  }

  return (
    <div className="panel">
      <h2>⚔️ 軍隊</h2>

      <div className="tab-bar">
        <button className={`tab ${tab === "training" ? "active" : ""}`} onClick={() => setTab("training")}>
          訓練單位
        </button>
        <button className={`tab ${tab === "armory" ? "active" : ""}`} onClick={() => setTab("armory")}>
          軍械室
        </button>
      </div>

      {tab === "training" && (
        <div className="training-section">
          <div className="tab-bar sub">
            <button className={`tab ${archeryTab === "archery" ? "active" : ""}`} onClick={() => setArcheryTab("archery")}>
              弓箭塔 Lv.{archeryLevel}
            </button>
            <button className={`tab ${archeryTab === "barracks" ? "active" : ""}`} onClick={() => setArcheryTab("barracks")}>
              兵營 Lv.{barracksLevel}
            </button>
          </div>

          {archeryTab === "archery" && archeryLevel > 0 && (
            <div className="unit-list">
              {ARCHERY_UNITS.map((unitType) => (
                <div key={unitType} className="unit-row">
                  <div className="unit-info">
                    <span className="unit-icon">{UNIT_ICONS[unitType]}</span>
                    <span className="unit-name">{UNIT_NAMES[unitType]}</span>
                    <span className="unit-count">x{armyUnits.archery?.[unitType] || 0}</span>
                  </div>
                  <button
                    className="btn-sm"
                    onClick={() => trainUnit("archery", unitType)}
                    disabled={training || data.gold < getTrainingCost("archery", unitType)}
                  >
                    訓練 💰{getTrainingCost("archery", unitType)}
                  </button>
                </div>
              ))}
            </div>
          )}
          {archeryTab === "archery" && archeryLevel === 0 && (
            <p className="empty">需要建造弓箭塔才能訓練弓箭單位</p>
          )}

          {archeryTab === "barracks" && barracksLevel > 0 && (
            <div className="unit-list">
              {BARRACKS_UNITS.map((unitType) => (
                <div key={unitType} className="unit-row">
                  <div className="unit-info">
                    <span className="unit-icon">{UNIT_ICONS[unitType]}</span>
                    <span className="unit-name">{UNIT_NAMES[unitType]}</span>
                    <span className="unit-count">x{armyUnits.barracks?.[unitType] || 0}</span>
                  </div>
                  <button
                    className="btn-sm"
                    onClick={() => trainUnit("barracks", unitType)}
                    disabled={training || data.gold < getTrainingCost("barracks", unitType)}
                  >
                    訓練 💰{getTrainingCost("barracks", unitType)}
                  </button>
                </div>
              ))}
            </div>
          )}
          {archeryTab === "barracks" && barracksLevel === 0 && (
            <p className="empty">需要建造兵營才能訓練步兵單位</p>
          )}
        </div>
      )}

      {tab === "armory" && (
        <div className="armory-section">
          <p className="hint">軍械室裝備可獲得額外ATK加成 (每件+5%, 最高+50%)</p>
          <div className="armory-slots">
            {ARMORY_SLOTS.map((slot) => (
              <div key={slot.key} className="armory-slot">
                <div className="slot-header">
                  <span className="slot-icon">{slot.icon}</span>
                  <span className="slot-name">{slot.name}</span>
                </div>
                <div className="slot-items">
                  {(armoryData as any)[slot.key] && Object.entries((armoryData as any)[slot.key]).map(([itemId, count]: [string, any]) => (
                    <div key={itemId} className="armory-item">
                      <span>{ITEMS_TYPED[itemId]?.name || itemId}</span>
                      <span>x{count}</span>
                    </div>
                  ))}
                  {(!((armoryData as any)[slot.key]) || Object.keys(((armoryData as any)[slot.key]) || {}).length === 0) && (
                    <span className="empty-slot">空</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}
