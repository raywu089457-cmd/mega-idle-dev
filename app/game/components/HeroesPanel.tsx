"use client";

import { useState } from "react";
import { GameData, Hero, useGameData } from "../hooks/useGameData";
import { getXpForLevel } from "@/lib/game/formulas/xp";

interface Props {
  data: GameData;
  api: ReturnType<typeof useGameData>["api"];
}

const RARITY_COLOR: Record<string, string> = { S: "#ff6b6b", A: "#ffa500", B: "#ffd700", C: "#4ade80", D: "#60a5fa", E: "#a78bfa", F: "#9ca3af" };
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
      const res = await api(`/api/heroes/${actionType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroId: hero.id }),
      });
      setMsg(res.data?.reason || "成功");
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
          <span>經驗:</span>
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
            {SLOT_NAMES.map((slot) => (
              <div key={slot} className="equip-slot">
                <span className="slot-icon">{SLOT_ICONS[slot]}</span>
                <span className="slot-item">{hero.equipment?.[slot] || "空"}</span>
              </div>
            ))}
          </div>
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
          {hero.type === "territory" && (
            <button onClick={() => doAction("train")} disabled={action !== null || trainingCost > data.gold || hero.level >= 10} title="訓練英雄花費 💰{trainingCost}">
              訓練 💰{trainingCost}
            </button>
          )}
          <button onClick={() => doAction("feed")} disabled={action !== null || !canFeed}>
            餵食 (口糧)
          </button>
          <button onClick={() => doAction("water")} disabled={action !== null || !canWater}>
            給水 (飲用水)
          </button>
          <button onClick={() => doAction("potion")} disabled={action !== null || !canPotion || hero.currentHp >= hero.maxHp}>
            使用藥水
          </button>
          {!hero.isExploring && hero.type === "territory" && (
            <button onClick={doExpel} disabled={action !== null} className="btn-danger">
              {confirmExpel ? "確認驅逐?" : "驅逐英雄"}
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
      <div className="panel-header">
        <h2>🧙 英雄管理</h2>
        <div className="tab-bar">
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
              className={`hero-row ${h.isExploring ? "exploring" : ""} ${needsAttention ? "needs-attention" : ""} ${isSelected ? "selected" : ""}`}
              onClick={handleClick}
            >
              <div className="hero-info">
                <span className="hero-name" style={{ color: RARITY_COLOR[h.rarity || "D"] }}>
                  {h.name}
                </span>
                <span className="hero-lv">Lv.{h.level}</span>
                {h.isExploring && <span className="badge">⚔️ 探索中</span>}
                {needsAttention && <span className="badge warning">⚠️</span>}
              </div>
              <div className="hero-stats">
                ⚔️{h.atk} 🛡️{h.def} HP:{h.currentHp}/{h.maxHp}
              </div>
              <div className="hero-needs">
                🍖{Math.round(h.hunger)} 💧{Math.round(h.thirst)}
              </div>
              {/* Mini XP bar */}
              <div className="mini-xp-bar">
                <div className="mini-xp-fill" style={{ width: `${Math.min(100, ((h.experience || 0) / getXpForLevel(h.level)) * 100)}%` }} />
              </div>
            </div>
          );
        })}
        {heroes.length === 0 && <p className="empty">還沒有{getLabel(tab)}英雄</p>}
      </div>

      <div className="panel-footer">
        <button className="btn-primary" onClick={recruit} disabled={recruiting || used >= cap}>
          {recruiting ? "招募中..." : tab === "wandering" && selectedHero ? `招募 ${selectedHero.name}` : `招募${getLabel(tab)}英雄`}
        </button>
        {tab === "wandering" && wanderingHeroes.length > 0 && territoryCapUsed < territoryCap && (
          <button className="btn-secondary" onClick={recruitAll} disabled={recruiting}>
            招募全部流浪英雄
          </button>
        )}
        {tab === "wandering" && !selectedHero && wanderingHeroes.length > 0 && territoryCapUsed < territoryCap && (
          <span className="hint">點擊英雄選擇後再點招募</span>
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
