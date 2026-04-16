"use client";

import { useState } from "react";
import { GameData, useGameData } from "../hooks/useGameData";

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
}

const BLD_INFO: Record<string, { name: string; desc: string }> = {
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
  barracks: { name: "兵營", desc: "訓練軍隊" },
};

export default function BuildingsPanel({ data, api }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
      setMsg(`${BLD_INFO[bld]?.name || bld} 升級成功`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "升級失敗");
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
                <span className="bld-name">{BLD_INFO[k]?.name || k}</span>
                <span className="bld-desc">{BLD_INFO[k]?.desc}</span>
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
      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}
