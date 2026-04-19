"use client";

import { useState } from "react";
import { GameData, Hero, useGameData } from "../hooks/useGameData";
import { getXpForLevel } from "@/lib/game/formulas/xp";
import { ITEMS } from "@/lib/game/types/items";

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
}

const RARITY_COLOR: Record<string, string> = { S: "#ff6b6b", A: "#ffa500", B: "#ffd700", C: "#4ade80", D: "#60a5fa", E: "#a78bfa", F: "#9ca3af" };
const PROFESSION_MAP: Record<string, string> = { melee: "近戰", ranged: "遠程", mage: "法師", healer: "補師", tank: "坦克", assassin: "刺客" };
const SLOT_NAMES = ["weapon", "armor", "helmet", "accessory"] as const;
const SLOT_ICONS: Record<string, string> = { weapon: "⚔️", armor: "🛡️", helmet: "⛑️", accessory: "💍" };

interface HeroDetailProps {
  hero: Hero;
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
  onClose: () => void;
}

function HeroDetail({ hero, data, api, onClose }: HeroDetailProps) {
  const [action, setAction] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmExpel, setConfirmExpel] = useState(false);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [equipTarget, setEquipTarget] = useState<{ itemId: string; slot: string } | null>(null);

  const xpToNext = getXpForLevel(hero.level);
  const xpProgress = (hero.experience || 0) / xpToNext;
  const trainingCost = 15 * Math.max(0, hero.level - 1);
  const canFeed = (data.materials.rations || 0) > 0;
  const canWater = (data.materials.drinking_water || 0) > 0;
  const canPotion = (data.inventory?.potions ? Object.values(data.inventory.potions).reduce((a, b) => a + b, 0) : 0) > 0;
  const needsAttention = hero.hunger < 30 || hero.thirst < 30 || hero.currentHp < hero.maxHp;

  async function doAction(actionType: string) {
    setAction(actionType);
    setMsg(null);
    try {
      // Handle equip/unequip from detail panel
      if (actionType.startsWith("equip_")) {
        const parts = actionType.split("_");
        const slot = parts[1];
        const itemId = parts.slice(2).join("_");
        const res = await api("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "equip", itemId, heroId: hero.id, slot }),
        });
        setMsg(res.data?.reason || "成功");
        setActiveSlot(null);
      } else if (actionType.startsWith("unequip_")) {
        const slot = actionType.split("_")[1];
        const res = await api("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unequip", heroId: hero.id, slot }),
        });
        setMsg(res.data?.reason || "成功");
      } else {
        const res = await api(`/api/heroes/${actionType}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ heroId: hero.id }),
        });
        setMsg(res.data?.reason || "成功");
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "失敗");
    } finally {
      setAction(null);
    }
  }

  async function doExpel() {
    if (!confirmExpel) { setConfirmExpel(true); return; }
    setAction("expel");
    try {
      await api("/api/heroes/expel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroId: hero.id }),
      });
      onClose();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "驅逐失敗");
    } finally {
      setAction(null);
      setConfirmExpel(false);
    }
  }

  return (
    <div className="hero-detail-overlay" onClick={onClose}>
      <div className="hero-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <span className="hero-name" style={{ color: RARITY_COLOR[hero.rarity || "D"] }}>
            {hero.name}
          </span>
          <span className="hero-lv">Lv.{hero.level}</span>
          {hero.profession && <span className="hero-profession">{hero.profession}</span>}
        </div>

        {/* XP Progress Bar */}
        <div className="stat-row">
          <span className="xp-label">EXP</span>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${Math.min(100, xpProgress * 100)}%` }} />
          </div>
          <span>{hero.experience || 0} / {xpToNext}</span>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div>⚔️ ATK: {hero.atk}</div>
          <div>🛡️ DEF: {hero.def}</div>
          <div>❤️ HP: {hero.currentHp}/{hero.maxHp}</div>
        </div>

        {/* Hunger/Thirst */}
        <div className="needs-row">
          <div>🍖 飢餓: {Math.round(hero.hunger)}/100</div>
          <div>💧 口渴: {Math.round(hero.thirst)}/100</div>
        </div>

        {/* Equipment Slots */}
        <div className="equipment-slots">
          <h4>裝備</h4>
          <div className="slots-grid">
            {SLOT_NAMES.map((slot) => {
              const equipped = hero.equipment?.[slot];
              return (
                <div
                  key={slot}
                  className={`equip-slot ${activeSlot === slot ? "active-slot" : ""}`}
                  onClick={() => setActiveSlot(activeSlot === slot ? null : slot)}
                >
                  <span className="slot-icon">{SLOT_ICONS[slot]}</span>
                  <span className="slot-item">{equipped || "空"}</span>
                  {equipped && (
                    <button
                      className="slot-unequip-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        doAction(`unequip_${slot}`);
                      }}
                      title="卸下裝備"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Equipment List Panel - shows when a slot is clicked */}
          {activeSlot && (
            <div className="equip-list-panel">
              <div className="equip-list-header">
                <span>選擇{SLOT_NAMES.includes(activeSlot as any) ? ["武器", "盔甲", "頭盔", "飾品"][SLOT_NAMES.indexOf(activeSlot as any)] : activeSlot} - 可用物品</span>
                <button className="close-equip-list" onClick={() => setActiveSlot(null)}>✕</button>
              </div>
              <div className="equip-list-items">
                {(() => {
                  const slotKey = activeSlot as keyof typeof data.inventory;
                  const inv = data.inventory || {};
                  const slotItems = (inv as any)[slotKey === "weapon" ? "weapons" : slotKey === "armor" ? "armor" : slotKey === "helmet" ? "helmets" : "accessories"] || {};
                  const availableItems: { itemId: string; count: number }[] = Object.entries(slotItems)
                    .map(([itemId, count]) => ({ itemId, count: count as number }))
                    .filter(i => i.count > 0);

                  if (availableItems.length === 0) {
                    return <p className="no-items">背包裡沒有可用的物品</p>;
                  }

                  return availableItems.map(({ itemId, count }) => {
                    const item = ITEMS[itemId as keyof typeof ITEMS];
                    if (!item) return null;
                    return (
                      <div key={itemId} className="equip-list-item" onClick={() => doAction(`equip_${activeSlot}_${itemId}`)}>
                        <span className="item-name">{item.name}</span>
                        <span className="item-stats">
                          {(item.stats?.attack ?? 0) > 0 && <span className="stat-atk">⚔️+{item.stats?.attack}</span>}
                          {(item.stats?.defense ?? 0) > 0 && <span className="stat-def">🛡️+{item.stats?.defense}</span>}
                          {(item.stats?.hp ?? 0) !== 0 && <span className="stat-hp">❤️+{item.stats?.hp}</span>}
                        </span>
                        <span className="item-count">x{count}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Exploration Info */}
        {hero.isExploring && (
          <div className="exploration-info">
            <span className="badge">⚔️ 探索中</span>
            <span>區域 {hero.currentZone} - 難度 {hero.currentSubZone}</span>
          </div>
        )}
        {hero.lastZone && !hero.isExploring && (
          <div className="last-exploration">
            上次探索: 區域 {hero.lastZone} - 難度 {hero.lastSubZone}
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          {/* Priority 1: Immediate needs (if hero needs attention) */}
          {needsAttention && (
            <div className="action-row priority-row">
              {hero.hunger < 30 && (
                <button
                  onClick={() => doAction("feed")}
                  disabled={action !== null || !canFeed}
                  className="btn-warning"
                  title={canFeed ? "🍖 恢復飢餓 +30" : "需要口糧"}
                >
                  {canFeed ? "🍖 餵食" : "🍖 需要口糧"}
                </button>
              )}
              {hero.thirst < 30 && (
                <button
                  onClick={() => doAction("water")}
                  disabled={action !== null || !canWater}
                  className="btn-warning"
                  title={canWater ? "💧 恢復口渴 +30" : "需要飲用水"}
                >
                  {canWater ? "💧 給水" : "💧 需要飲用水"}
                </button>
              )}
              {hero.currentHp < hero.maxHp && (
                <button
                  onClick={() => doAction("potion")}
                  disabled={action !== null || !canPotion}
                  className="btn-warning"
                  title={canPotion ? "🧪 恢復 50% HP" : "需要藥水"}
                >
                  {canPotion ? "🧪 使用藥水" : "🧪 需要藥水"}
                </button>
              )}
            </div>
          )}

          {/* Priority 2: Training */}
          {hero.type === "territory" && (
            <button
              onClick={() => doAction("train")}
              disabled={action !== null || trainingCost > data.gold || hero.level >= 100}
              className="btn-primary"
              title={hero.level >= 100 ? "已達最高等級" : `訓練花費 💰${trainingCost}`}
            >
              {hero.level >= 100 ? "⬆️ 等級已滿" : `⬆️ 訓練 💰${trainingCost}`}
            </button>
          )}

          {/* Priority 3: Secondary actions (only show if no urgent needs) */}
          {!needsAttention && (
            <div className="action-row">
              <button
                onClick={() => doAction("feed")}
                disabled={action !== null || !canFeed}
                title={canFeed ? "🍖 恢復飢餓 +30" : "需要口糧"}
              >
                🍖 餵食
              </button>
              <button
                onClick={() => doAction("water")}
                disabled={action !== null || !canWater}
                title={canWater ? "💧 恢復口渴 +30" : "需要飲用水"}
              >
                💧 給水
              </button>
              <button
                onClick={() => doAction("potion")}
                disabled={action !== null || !canPotion || hero.currentHp >= hero.maxHp}
                title={hero.currentHp >= hero.maxHp ? "HP 已滿" : canPotion ? "🧪 恢復 50% HP" : "需要藥水"}
              >
                🧪 藥水
              </button>
            </div>
          )}

          {/* Danger zone */}
          {!hero.isExploring && hero.type === "territory" && (
            <button onClick={doExpel} disabled={action !== null} className="btn-danger">
              {confirmExpel ? "⚠️ 確認驅逐?" : "🚪 驅逐"}
            </button>
          )}
        </div>
        {msg && <p className="msg">{msg}</p>}
        <button onClick={onClose} className="btn-close">關閉</button>
      </div>
    </div>
  );
}

export default function HeroesPanel({ data, api }: Props) {
  const [tab, setTab] = useState<"territory" | "wandering">("territory");
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [recruiting, setRecruiting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const heroes = data.heroes.roster.filter((h: Hero) => h.type === tab);
  const cap = tab === "territory" ? data.heroes.territoryHeroCap : data.heroes.wanderingHeroCap;
  const used = heroes.length;
  const wanderingHeroes = data.heroes.roster.filter((h: Hero) => h.type === "wandering");
  const territoryCapUsed = data.heroes.roster.filter((h: Hero) => h.type === "territory").length;
  const territoryCap = data.heroes.territoryHeroCap;

  async function recruit() {
    if (used >= cap) { setMsg("已達上限"); return; }
    setRecruiting(true);
    setMsg(null);
    const heroToRecruit = selectedHero;
    // Immediately clear selection so hero disappears from list
    setSelectedHero(null);
    try {
      // If on wandering tab and a hero is selected, recruit that specific hero
      if (tab === "wandering" && heroToRecruit) {
        const res = await api("/api/heroes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ heroId: heroToRecruit.id }),
        });
        setMsg(`成功招募 ${heroToRecruit.name}`);
      } else {
        // Otherwise auto-select a random wandering hero
        const res = await api("/api/heroes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "recruit" }),
        });
        setMsg(`招募成功: ${res.data?.hero?.name || "新英雄"}`);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "招募失敗");
    } finally {
      setRecruiting(false);
    }
  }

  async function recruitAll() {
    if (territoryCapUsed >= territoryCap) { setMsg("領地英雄已滿"); return; }
    setRecruiting(true);
    setMsg(null);
    try {
      const res = await api("/api/heroes/recruit-all", { method: "POST" });
      setMsg(`招募: ${res.data?.recruited?.length || 0} 成功`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "招募失敗");
    } finally {
      setRecruiting(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header heroes-panel-header">
        <h2>英雄管理</h2>
        <div className="tab-bar heroes-tab-bar">
          <button className={`tab ${tab === "territory" ? "active" : ""}`} onClick={() => setTab("territory")}>
            領地 ({data.heroes.roster.filter((h: Hero) => h.type === "territory").length}/{data.heroes.territoryHeroCap})
          </button>
          <button className={`tab ${tab === "wandering" ? "active" : ""}`} onClick={() => setTab("wandering")}>
            流浪 ({data.heroes.roster.filter((h: Hero) => h.type === "wandering").length}/{data.heroes.wanderingHeroCap})
          </button>
        </div>
      </div>

      <div className="hero-list">
        {heroes.map((h: Hero) => {
          const needsAttention = h.hunger < 30 || h.thirst < 30;
          const isSelected = selectedHero?.id === h.id;
          // Wandering heroes: click to select for recruitment (unless already selected)
          // Territory heroes: click to open detail modal
          const handleClick = () => {
            if (tab === "wandering") {
              if (isSelected) {
                setSelectedHero(null); // deselect
              } else {
                setSelectedHero(h);
              }
            } else {
              setSelectedHero(h); // opens detail modal for territory heroes
            }
          };
          return (
            <div
              key={h.id}
              className={`hero-card ${h.isExploring ? "exploring" : ""} ${needsAttention ? "needs-attention" : ""} ${isSelected ? "selected" : ""}`}
              onClick={handleClick}
            >
              <div className="hero-card-name">
                <span className="hero-name" style={{ color: RARITY_COLOR[h.rarity || "D"] }}>
                  {h.name}
                </span>
                {h.profession && <span className="hero-profession-tag">[{PROFESSION_MAP[h.profession] || h.profession}]</span>}
              </div>
              <div className="hero-card-hp">
                <span className="hp-label">❤️</span>
                <div className="hp-bar-gradient">
                  <div className="hp-fill-red" style={{ width: `${Math.min(100, (h.currentHp / h.maxHp) * 100)}%` }} />
                </div>
                <span className="hp-text">{h.currentHp}/{h.maxHp}</span>
              </div>
              <div className="hero-card-stats">
                <span className="stat-atk">⚔️ ATK {h.atk}</span>
                <span className="stat-def">🛡️ DEF {h.def}</span>
              </div>
              <div className="hero-card-needs">
                🍖 {Math.round(h.hunger)}/100 &nbsp; 💧 {Math.round(h.thirst)}/100
              </div>
              {h.isExploring && <span className="badge exploring-badge">⚔️ 探索中</span>}
              {needsAttention && <span className="badge warning-badge">⚠️ 需要注意</span>}
              <div className="mini-xp-bar">
                <div className="mini-xp-fill" style={{ width: `${Math.min(100, ((h.experience || 0) / getXpForLevel(h.level)) * 100)}%` }} />
              </div>
            </div>
          );
        })}
        {heroes.length === 0 && (
          <p className="empty">
            {tab === "territory"
              ? "還沒有領地英雄 — 建造酒館招募流浪英雄"
              : "酒館還沒有流浪英雄 — 等待或升級酒館"}
          </p>
        )}
      </div>

      <div className="panel-footer">
        {tab === "wandering" && (
          <>
            <button className="btn-primary" onClick={recruit} disabled={recruiting || used >= cap}>
              {recruiting ? "招募中..." : selectedHero ? `招募 ${selectedHero.name}` : "招募流浪英雄"}
            </button>
            {wanderingHeroes.length > 0 && territoryCapUsed < territoryCap && (
              <button className="btn-secondary" onClick={recruitAll} disabled={recruiting}>
                招募全部 ({wanderingHeroes.length})
              </button>
            )}
            {!selectedHero && wanderingHeroes.length > 0 && (
              <span className="hint">點擊選擇</span>
            )}
          </>
        )}
        {msg && <span className="msg">{msg}</span>}
      </div>

      {selectedHero && tab === "territory" && (
        <HeroDetail hero={selectedHero} data={data} api={api} onClose={() => setSelectedHero(null)} />
      )}
    </div>
  );
}

function getLabel(type: string) { return type === "territory" ? "領地" : "流浪"; }
