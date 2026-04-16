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

type Category = "weapons" | "armor" | "helmets" | "accessories" | "potions";
type Slot = "weapon" | "armor" | "helmet" | "accessory";

const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: "weapons", name: "武器", icon: "⚔️" },
  { id: "armor", name: "盔甲", icon: "🛡️" },
  { id: "helmets", name: "頭盔", icon: "⛑️" },
  { id: "accessories", name: "飾品", icon: "💍" },
  { id: "potions", name: "藥水", icon: "🧪" },
];

const SLOT_NAMES: Slot[] = ["weapon", "armor", "helmet", "accessory"];
const SLOT_ICONS: Record<Slot, string> = { weapon: "⚔️", armor: "🛡️", helmet: "⛑️", accessory: "💍" };

export default function InventoryPanel({ data, api }: Props) {
  const [category, setCategory] = useState<Category>("weapons");
  const [selectedItem, setSelectedItem] = useState<{ itemId: string; count: number } | null>(null);
  const [equipping, setEquipping] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const inventory = data.inventory || { weapons: {}, armor: {}, helmets: {}, accessories: {}, potions: {} };
  const territoryHeroes = data.heroes.roster.filter((h: Hero) => h.type === "territory" && !h.isExploring);

  const categoryItems = Object.entries(inventory[category] || {})
    .filter(([, count]) => (count as number) > 0)
    .map(([itemId, count]) => ({
      itemId,
      count: count as number,
      item: ITEMS_TYPED[itemId],
    }))
    .filter((i) => i.item);

  async function equipItem(heroId: string, slot: Slot) {
    if (!selectedItem) return;
    setEquipping(true);
    setMsg(null);
    try {
      await api("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "equip", itemId: selectedItem.itemId, heroId, slot }),
      });
      setMsg(`已裝備 ${selectedItemData?.name} 到英雄`);
      setSelectedItem(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "裝備失敗");
    } finally {
      setEquipping(false);
    }
  }

  async function unequipItem(heroId: string, slot: Slot) {
    setEquipping(true);
    setMsg(null);
    try {
      await api("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unequip", heroId, slot }),
      });
      setMsg("已卸下裝備");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "卸下失敗");
    } finally {
      setEquipping(false);
    }
  }

  const selectedItemData = selectedItem ? ITEMS_TYPED[selectedItem.itemId] : null;

  return (
    <div className="panel">
      <h2>🎒 背包</h2>

      {selectedItem && (
        <div className="equip-target">
          <h4>選擇英雄裝備 {selectedItemData?.name}</h4>
          <div className="hero-select-grid">
            {territoryHeroes.map((h) => (
              <div key={h.id} className="hero-equip-row">
                <div className="hero-info">
                  <span>{h.name}</span>
                  <span>Lv.{h.level}</span>
                </div>
                <div className="hero-slots">
                  {SLOT_NAMES.map((slot) => (
                    <button
                      key={slot}
                      className={`slot-btn ${h.equipment?.[slot] ? "occupied" : ""}`}
                      onClick={() => equipItem(h.id, slot)}
                      disabled={equipping}
                      title={`${SLOT_ICONS[slot]} ${h.equipment?.[slot] || "空"}`}
                    >
                      {SLOT_ICONS[slot]}
                      {h.equipment?.[slot] && <span className="equipped-item">{(ITEMS_TYPED[h.equipment[slot] as string]?.name ?? "X").charAt(0)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {territoryHeroes.length === 0 && <p className="empty">沒有可裝備的英雄</p>}
          </div>
          <button onClick={() => setSelectedItem(null)} className="btn-cancel">取消</button>
        </div>
      )}

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

      <div className="inventory-grid">
        {categoryItems.map(({ itemId, count, item }) => (
          <div
            key={itemId}
            className={`inv-item ${selectedItem?.itemId === itemId ? "selected" : ""}`}
            onClick={() => setSelectedItem({ itemId, count })}
          >
            <div className="item-name">{item.name}</div>
            <div className="item-count">x{count}</div>
            {item.stats?.attack != null && item.stats.attack > 0 && <div className="item-stat">⚔️{item.stats.attack}</div>}
            {item.stats?.defense != null && item.stats.defense > 0 && <div className="item-stat">🛡️{item.stats.defense}</div>}
            {item.stats?.hp != null && item.stats.hp > 0 && <div className="item-stat">❤️{item.stats.hp}</div>}
          </div>
        ))}
        {categoryItems.length === 0 && <p className="empty">背包是空的</p>}
      </div>

      <div className="hero-equipment-section">
        <h3>英雄裝備</h3>
        <div className="hero-equip-list">
          {territoryHeroes.map((h) => (
            <div key={h.id} className="hero-equip-card">
              <div className="hero-header">
                <span className="hero-name">{h.name}</span>
                <span className="hero-lv">Lv.{h.level}</span>
              </div>
              <div className="equip-slots">
                {SLOT_NAMES.map((slot) => (
                  <div key={slot} className="equip-slot-display">
                    <span className="slot-icon">{SLOT_ICONS[slot]}</span>
                    {h.equipment?.[slot] ? (
                      <div className="equipped">
                        <span className="equipped-name">{ITEMS_TYPED[h.equipment[slot] as string]?.name || h.equipment[slot]}</span>
                        <button onClick={() => unequipItem(h.id, slot)} className="btn-unequip">×</button>
                      </div>
                    ) : (
                      <span className="empty-slot">空</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}
