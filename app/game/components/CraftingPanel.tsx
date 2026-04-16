"use client";

import { useState } from "react";
import { GameData, Hero, useGameData } from "../hooks/useGameData";
import ITEMS from "@/lib/game/_CONSTS/items";

type ItemEntry = { name: string; type: string; stats?: { attack: number; defense: number; hp: number }; cost?: Record<string, number>; healing?: number };
const ITEMS_TYPED: Record<string, ItemEntry> = ITEMS as any;

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
}

type Category = "weapon" | "armor" | "helmet" | "accessory" | "potion";

const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: "weapon", name: "武器", icon: "⚔️" },
  { id: "armor", name: "盔甲", icon: "🛡️" },
  { id: "helmet", name: "頭盔", icon: "⛑️" },
  { id: "accessory", name: "飾品", icon: "💍" },
  { id: "potion", name: "藥水", icon: "🧪" },
];

const MAT_ICONS: Record<string, string> = {
  fruit: "🍎", water: "💧", wood: "🪵", iron: "⛓️",
  herbs: "🌿", magic_stone: "💎", rations: "🍖", drinking_water: "🥤", potions: "🧪",
};

export default function CraftingPanel({ data, api }: Props) {
  const [category, setCategory] = useState<Category>("weapon");
  const [crafting, setCrafting] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const categoryItems = Object.entries(ITEMS)
    .filter(([, item]) => item && (item as any).type === category)
    .map(([id, item]) => ({ id, ...(item as any) }));

  function canAfford(item: any): boolean {
    if (!item.cost) return true;
    for (const [mat, amount] of Object.entries(item.cost)) {
      if (mat === "gold") {
        if (data.gold < (amount as number)) return false;
      } else {
        if ((data.materials as any)[mat] < (amount as number)) return false;
      }
    }
    return true;
  }

  async function craft(itemId: string) {
    if (!canAfford(ITEMS_TYPED[itemId])) { setMsg("資源不足"); return; }
    setCrafting(itemId);
    setMsg(null);
    try {
      await api("/api/crafting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      setMsg(`製作成功: ${ITEMS_TYPED[itemId].name}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "製作失敗");
    } finally {
      setCrafting(null);
    }
  }

  return (
    <div className="panel">
      <h2>🔨 製作</h2>

      <div className="tab-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`tab ${category === cat.id ? "active" : ""}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="crafting-list">
        {categoryItems.map((item) => (
          <div key={item.id} className="craft-item">
            <div className="item-header">
              <span className="item-name">{item.name}</span>
              <span className="item-type">{CATEGORIES.find(c => c.id === category)?.name}</span>
            </div>

            <div className="item-cost">
              {Object.entries(item.cost || {}).map(([mat, amount]) => (
                <span key={mat} className={`cost-item ${canAfford(item) ? "" : "insufficient"}`}>
                  {MAT_ICONS[mat] || mat}: {String(amount)}
                </span>
              ))}
            </div>

            <div className="item-stats">
              {item.stats?.attack > 0 && <span>⚔️ +{item.stats.attack}</span>}
              {item.stats?.defense > 0 && <span>🛡️ +{item.stats.defense}</span>}
              {item.stats?.hp > 0 && <span>❤️ +{item.stats.hp}</span>}
              {item.healing && <span>💖 恢復 {item.healing}</span>}
            </div>

            <button
              className="btn-craft"
              onClick={() => craft(item.id)}
              disabled={crafting !== null || !canAfford(item)}
            >
              {crafting === item.id ? "製作中..." : "製作"}
            </button>
          </div>
        ))}

        {categoryItems.length === 0 && (
          <p className="empty">該類別沒有可製作的物品</p>
        )}
      </div>

      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}
