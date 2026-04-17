# Mega Idle - 遊戲玩法架構文檔

> 本文件為遊戲介面測試的重要依據，所有 UI 互動設計需與本文件描述的玩法機制對齊。

---

## 核心循環

**Idle Tick**: 每 5 秒自動結算，驅動被動資源 production。

---

## 資源系統

| 類型 | 項目 |
|------|------|
| 貨幣 | 黃金 (gold)、魔法石 (magicStones) |
| 材料 | fruit、water、wood、iron、herbs、rations、drinking_water、potions |
| 容量 | 黃金上限取決於倉庫等級；材料上限取決於倉庫等級 |

### 資源容量公式

- **黃金上限**: `100000 + (warehouse_level * 50000)`
- **材料上限**: `500 + (warehouse_level * 100)`

---

## 建築系統（12 種）

| 建築 | 功能 |
|------|------|
| 城堡 Castle | 解鎖更多領地/流浪英雄欄位上限 |
| 酒館 Tavern | 消耗 fruit + water → 生產 rations + drinking_water |
| 紀念碑 Monument | 被動資源自動生產（fruit、water、wood、iron、herbs） |
| 倉庫 Warehouse | 增加黃金和材料容量上限 |
| 公會大廳 GuildHall | 解鎖公會系統 |
| 武器店 WeaponShop | 流浪英雄金幣來源 |
| 盔甲店 ArmorShop | 流浪英雄金幣來源 |
| 藥水店 PotionShop | 消耗 herbs → 生產 potions |
| 伐木場 LumberMill | 增加木材產量（monument 產量加成） |
| 礦場 Mine | 增加礦石產量（monument 產量加成） |
| 草藥園 HerbGarden | 增加草藥產量（monument 產量加成） |
| 兵營 Barracks | 訓練軍隊 |

### 建築升級

- 最大等級: 10
- 升級成本: `{ gold: 50~100 * level^2, wood/iron/herbs: 10~30 * level }`

---

## 英雄系統

### 英雄類型與上限

| 類型 | 上限公式 | 最大值 |
|------|----------|--------|
| 領地英雄 Territory | `5 + castle_level * 2` | 48 |
| 流浪英雄 Wandering | `10 + castle_level * 3` | 72 |

### 稀有度

| 等級 | 顏色 |
|------|------|
| S | #ff6b6b |
| A | #ffa500 |
| B | #ffd700 |
| C | #4ade80 |
| D | #60a5fa |
| E | #a78bfa |
| F | #9ca3af |

### 英雄屬性

- `id`: 唯一識別碼
- `name`: 名稱
- `type`: "territory" | "wandering"
- `profession`: 職業
- `rarity`: 稀有度 (S/A/B/C/D/E/F)
- `level`: 等級 (1 起)
- `atk`: 攻擊力
- `def`: 防禦力
- `maxHp` / `currentHp`: 最大/當前血量
- `experience` / `totalXp`: 經驗值
- `attackRange`: "melee" | "mid" | "long"
- `hunger`: 飽食度 (0-100)
- `thirst`: 乾渴度 (0-100)
- `isExploring`: 是否探索中
- `currentZone` / `currentSubZone`: 當前區域
- `currentTeamIdx`: 所屬隊伍 (0-4)

### 裝備欄位

- weapon、armor、helmet、accessory

### 狀態機

- 閒置 (idle): 未探索，等待分配
- 探索中 (exploring): 已在某區域戰鬥
- 訓練中: (本版未實裝)

---

## 探索系統

### 10 個區域

| ID | 名稱 |
|----|------|
| 1 | 翠綠草原 |
| 2 | 陰濕沼澤 |
| 3 | 荊棘森林 |
| 4 | 古蹟礦山 |
| 5 | 寒霜冰原 |
| 6 | 烈焰荒原 |
| 7 | 金色沙漠 |
| 8 | 幽靈船塢 |
| 9 | 黑暗洞窟 |
| 10 | 混沌深淵 |

### 3 種難度

| ID | 名稱 |
|----|------|
| 1 | 簡單 |
| 2 | 普通 |
| 3 | 困難 |

### 操作

- **派遣**: 選擇英雄（多選）→ 選擇區域 → 選擇難度 → 點擊派遣
- **召回**: 一鍵召回所有探索中英雄
- **冷卻**: 30 秒 (dispatch cooldown)

---

## 戰鬥系統

### 戰鬥類型

| category | 說明 |
|----------|------|
| solo_combat | 單英雄探索戰鬥 |
| team_combat | 5 支隊伍（0-4）組隊探索 |
| worldboss | 世界 Boss 攻擊 |
| other | 其他事件 |

### World Boss

| 屬性 | 數值 |
|------|------|
| 名稱 | 遠古巨龍 |
| Boss ID | ancient_dragon |
| 等級 | 50 |
| HP | 3,000,000 |
| ATK | 400 |
| DEF | 150 |
| 復活延遲 | 1 小時 |

---

## 隊伍系統

- 5 支隊伍（Team 0-4）
- 每隊可容納多名英雄
- 英雄可從待命池分配至隊伍
- 從隊伍移除後回到待命池

---

## 公會系統

### 公會資料

- `name`: 公會名稱
- `level`: 階級
- `contribution`: 貢獻度
- `totalDamageToBoss`: 對 Boss 總傷害

### 每日任務

| 類型 | 說明 |
|------|------|
| kill | 擊殺目標 |
| collect | 收集資源 |
| explore | 探索區域 |

每任務有: `description`、`target`、`progress`、`completed`、`reward (gold/magicStone)`

---

## 獎勵系統

### 每日獎勵

- 💰 500 黃金 + 💎 1 魔法石
- 冷卻: 24 小時

### 每週獎勵

- 💰 5000 黃金 + 💎 10 魔法石
- 冷卻: 7 天

---

## 生產鏈

```
Monument (被動 production, tick=5s):
  → fruit, water, wood, iron, herbs
  → 倍率: monument_bonus = 1 + (level * 0.12)
  → wood 額外乘以 lumberMill_bonus = 1 + (lumberMill_level * 0.5)
  → iron 額外乘以 mine_bonus
  → herbs 額外乘以 herbGarden_bonus

Tavern (需 fruit >= 5*level AND water >= 5*level):
  → fruit + water → rations + drinking_water
  → 產量: 3 * tavern_level each

PotionShop (需 herbs >= 3*level):
  → herbs → potions
  → 產量: 2 * potionShop_level
```

---

## 統計追蹤

| 統計項 | 說明 |
|--------|------|
| explorations | 探索總次數 |
| wins / losses | 勝/敗場次 |
| goldEarned / goldSpent | 黃金收支 |
| goldFromWandering / goldFromExploration | 金幣來源分類 |
| heroesRecruited | 招募英雄數 |
| heroesTrained | 訓練英雄數 |
| buildingsBuilt / buildingsUpgraded | 建築興建/升級 |
| dailyClaims / weeklyClaims | 獎勵領取次數 |
| consecutiveDays / consecutiveWeeks | 連續登入 |
| bossesDefeated | 擊敗Boss數 |
| zonesExplored | 各區域探索次數 Map |

---

## 冷卻時間

| 動作 | 冷卻 |
|------|------|
| 派遣 dispatch | 30 秒 |
| 建築 build | 5 分鐘 |
| 每日獎勵 daily | 24 小時 |
| 每週獎勵 weekly | 7 天 |

---

## 戰報日誌 (Battle Logs)

- 最多保留 50 筆（newest first）
- 每筆記錄: `id`, `timestamp`, `category`, `heroNames`, `victory`, `damageDealt`, `goldReward`, `xpGained`, `description`
- 顯示時取最新 30 筆

---

## UI 面板對應

| 面板 | 路徑 | 對應功能 |
|------|------|----------|
| 首頁 Home | /game (tab=home) | 資源/建築/英雄/統計一覽 |
| 英雄管理 Heroes | /game (tab=heroes) | 領地/流浪英雄列表 + 招募 |
| 派遣探索 Dispatch | /game (tab=dispatch) | 派遣/召回英雄探索 |
| 隊伍管理 Team | /game (tab=team) | 分配英雄至 5 支隊伍 |
| 建築 Buildings | /game (tab=build) | 12 種建築升級 |
| 世界Boss WorldBoss | /game (tab=worldboss) | 攻擊遠古巨龍 |
| 公會 Guild | /game (tab=guild) | 公會資訊 + 每日任務 |
| 獎勵中心 Rewards | /game (tab=rewards) | 每日/每週獎勵領取 |
| 戰報 Logs | /game (tab=logs) | 戰鬥歷史篩選顯示 |

---

## 即時更新

- **SSE 事件**: `/api/events` → `user-update` 事件即時推送用戶狀態變更
- **自動重連**: EventSource 斷線自動重連

---

## Feature Flags（功能開關）

**位置**: `lib/config/features.ts`

| Flag | 預設 | 說明 |
|------|------|------|
| `heroes` | ✅ on | 英雄招募、訓練、驅逐 |
| `dispatch` | ✅ on | 英雄探索派遣 |
| `build` | ✅ on | 建築建造 / 升級 |
| `inventory` | ✅ on | 物品欄 / 裝備 |
| `rewards` | ✅ on | 每日 / 每週獎勵 |
| `profile` | ✅ on | 玩家資料修改 |
| `team` | ✅ on | 隊伍編組 |
| `guild` | ✅ on | 公會任務 |
| `worldBoss` | ✅ on | 世界 BOSS |
| `army` | ❌ off | 軍隊系統（開發中） |
| `crafting` | ❌ off | 合成系統（開發中） |
| `logs` | ✅ on | 戰鬥紀錄查詢 |
| `zones` | ✅ on | 區域資訊查詢 |
| `events` | ✅ on | SSE 即時事件推播 |

### 使用規則

- 所有 API route handler 第一行必須呼叫 `requireFeature()`
- 關閉的 flag 自動回傳 `403`，不執行任何業務邏輯
- 開啟功能：把 `false` 改成 `true`，route 自動解鎖，不需修改其他程式碼

```typescript
import { requireFeature } from "@/lib/config/features";

export async function POST(request: Request) {
  const blocked = requireFeature("army");
  if (blocked) return blocked;
  // ...
}
```

---

*本文檔由程式碼 Schema 反向重構，2026-04-17*