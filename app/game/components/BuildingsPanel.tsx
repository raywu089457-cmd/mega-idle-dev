"use client";

import { useState } from "react";
import { GameData, useGameData } from "../hooks/useGameData";
import { RESOURCE_NAMES, BUILDING_NAMES } from "../lib/localization";

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
}

const ZONE_NAMES = [
  "", "翠綠草原 (Lv.1)", "迷霧山脈 (Lv.3)", "深邃洞穴 (Lv.5)",
  "幽靈要塞 (Lv.7)", "烈焰火山 (Lv.9)", "冰霜凍土 (Lv.11)",
  "遠古神殿 (Lv.13)", "龍之巢穴 (Lv.15)", "虛空裂隙 (Lv.17)", "混沌深淵 (Lv.20)"
];

export default function BuildingsPanel({ data, api }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showBuildNew, setShowBuildNew] = useState(false);

  function getCost(bld: string, level: number) {
    const l = level + 1;
    const costs: Record<string, { gold: number; wood?: number; iron?: number; herbs?: number }> = {
      castle: { gold: 100 * l * l },
      tavern: { gold: 50 * l * l, wood: 20 * l },
      monument: { gold: 80 * l * l },
      warehouse: { gold: 30 * l * l, wood: 15 * l },
      guildHall: { gold: 100 * l * l, wood: 30 * l, iron: 10 * l },
      weaponShop: { gold: 40 * l * l },
      armorShop: { gold: 40 * l * l },
      potionShop: { gold: 40 * l * l },
      lumberMill: { gold: 60 * l * l, wood: 20 * l },
      mine: { gold: 60 * l * l, iron: 20 * l },
      herbGarden: { gold: 60 * l * l, herbs: 20 * l },
      barracks: { gold: 100 * l * l, wood: 30 * l, iron: 10 * l },
    };
    return costs[bld] || { gold: 50 * l * l };
  }

  async function upgrade(bld: string) {
    const cost = getCost(bld, data.buildings[bld]?.level || 0);
    if (data.gold < cost.gold) { setMsg("黃金不足"); return; }
    setUpgrading(true);
    setMsg(null);
    try {
      await api("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ building: bld, action: "upgrade" }),
      });
      setMsg(`升級成功`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "升級失敗");
    } finally {
      setUpgrading(false);
    }
  }

  async function build(bld: string) {
    const cost = getCost(bld, 0);
    if (data.gold < cost.gold) { setMsg("黃金不足"); return; }
    setUpgrading(true);
    setMsg(null);
    try {
      await api("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ building: bld, action: "build" }),
      });
      setMsg(`建造成功`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "建造失敗");
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="panel">
      <h2>🏗️ 建築</h2>

      <div className="buildings-list">
        {Object.entries(data.buildings).map(([k, b]) => {
          const cost = getCost(k, b.level);
          const canAfford = data.gold >= cost.gold;
          return (
            <div key={k} className="bld-row">
              <div className="bld-info">
                <span className="bld-name">{getBuildingName(k)}</span>
                <span className="bld-desc">{getBuildingDesc(k)}</span>
              </div>
              <div className="bld-right">
                <span className="bld-lv">Lv.{b.level}</span>
                <button
                  className="btn-sm"
                  onClick={() => upgrade(k)}
                  disabled={upgrading || !canAfford}
                >
                  升級 💰{cost.gold}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn-secondary" onClick={() => setShowBuildNew(!showBuildNew)}>
        {showBuildNew ? "隱藏建造" : "建造新建築"}
      </button>

      {showBuildNew && (
        <div className="build-new-section">
          {Object.entries(getAllBuildingInfo()).map(([k, info]) => {
            const currentLevel = data.buildings[k]?.level || 0;
            if (currentLevel > 0) return null;
            const cost = getCost(k, 1);
            const canAfford = data.gold >= cost.gold &&
              (!cost.wood || data.materials.wood >= cost.wood) &&
              (!cost.iron || data.materials.iron >= cost.iron) &&
              (!cost.herbs || data.materials.herbs >= cost.herbs);
            return (
              <div key={k} className="bld-row buildable">
                <div className="bld-info">
                  <span className="bld-name">{info.name}</span>
                  <span className="bld-desc">{info.desc}</span>
                </div>
                <div className="bld-cost">
                  <span className={data.gold >= cost.gold ? "" : "insufficient"}>💰{cost.gold}</span>
                  {cost.wood && <span className={data.materials.wood >= cost.wood ? "" : "insufficient"}>🪵{RESOURCE_NAMES.wood} {cost.wood}</span>}
                  {cost.iron && <span className={data.materials.iron >= cost.iron ? "" : "insufficient"}>⛓️{RESOURCE_NAMES.iron} {cost.iron}</span>}
                  {cost.herbs && <span className={data.materials.herbs >= cost.herbs ? "" : "insufficient"}>🌿{RESOURCE_NAMES.herbs} {cost.herbs}</span>}
                </div>
                <button
                  className="btn-sm btn-build"
                  onClick={() => build(k)}
                  disabled={upgrading || !canAfford}
                >
                  建造
                </button>
              </div>
            );
          })}
        </div>
      )}

      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}

function getBuildingName(k: string): string {
  return BUILDING_NAMES[k] || k;
}

function getBuildingDesc(k: string): string {
  const descs: Record<string, string> = {
    castle: "解鎖更多領地英雄欄位",
    tavern: "消耗水果和水製作口糧",
    monument: "自動生產資源",
    warehouse: "增加資源容量上限",
    guildHall: "解鎖公會系統",
    weaponShop: "流浪英雄金幣來源",
    armorShop: "流浪英雄金幣來源",
    potionShop: "消耗草藥製作藥水",
    lumberMill: "增加木材產量",
    mine: "增加礦石產量",
    herbGarden: "增加草藥產量",
    barracks: "訓練步兵單位",
    archery: "訓練弓箭單位",
  };
  return descs[k] || "";
}

function getAllBuildingInfo() {
  return {
    castle: { name: "城堡", desc: "解鎖更多領地英雄欄位" },
    tavern: { name: "酒館", desc: "消耗水果和水製作口糧" },
    monument: { name: "紀念碑", desc: "自動生產資源" },
    warehouse: { name: "倉庫", desc: "增加資源容量上限" },
    guildHall: { name: "公會大廳", desc: "解鎖公會系統" },
    weaponShop: { name: "武器店", desc: "流浪英雄金幣來源" },
    armorShop: { name: "盔甲店", desc: "流浪英雄金幣來源" },
    potionShop: { name: "藥水店", desc: "消耗草藥製作藥水" },
    lumberMill: { name: "伐木場", desc: "增加木材產量" },
    mine: { name: "礦場", desc: "增加礦石產量" },
    herbGarden: { name: "草藥園", desc: "增加草藥產量" },
    barracks: { name: "兵營", desc: "訓練步兵單位" },
    archery: { name: "弓箭塔", desc: "訓練弓箭單位" },
  };
}
