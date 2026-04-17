> 此檔案為 Claude Code 的**強制的 architecture contract**。修改任何資料層程式碼前，必須閱讀全部內容。

---

# Architecture Guide — mega-idle-dev

## 核心理念

```
使用者操作 → API Route → UserRepository → MongoDB
                ↓
           Zod Validation
                ↓
         (可選) Transaction
                ↓
           Service Layer
```

---

## 1. 資料存取

**唯一途徑：** `lib/repositories/UserRepository.ts`

```typescript
// ❌ 嚴禁
const user = await User.findOne({ userId: session.user.id }) as any;
const user = await User.findOne({ userId: session.user.id }) as Promise<any>;

// ✅ 正確
import { UserRepository } from "@/lib/repositories/UserRepository";
const user = await UserRepository.findByIdActive(session.user.id);
```

| Method | 用途 |
|--------|------|
| `findById(userId)` | 一般查詢，包含已刪除 |
| `findByIdActive(userId)` | 排除 soft-deleted（正常流程用這個） |
| `findByEmail(email)` | email 登入用 |
| `findOrCreate(userId, username)` | OAuth 首次登入自動創建 |
| `register(email, password)` | email 註冊 |
| `softDelete(userId)` | soft-delete（設 deletedAt，不實際刪除） |

---

## 2. 公式 — 單一真相

### XP 公式
**位置：** `lib/game/formulas/xp.ts`

```typescript
import { getXpForLevel, getStatIncreaseForLevel, getXpProgress } from "@/lib/game/formulas/xp";
```

**規則：**
- 前端、後端 service 都用這裡的函式
- 禁止在 `HeroesPanel.tsx`、`HeroManagementService.js` 等地方重新實作相同邏輯

### 建築成本公式
**位置：** `lib/game/formulas/buildingCosts.ts`

```typescript
import { BUILDING_COST_FORMULAS, getBuildingCost, VALID_BUILDINGS } from "@/lib/game/formulas/buildingCosts";
```

**規則：**
- 禁止在 `app/api/build/route.ts` 或其他地方重新定義建築成本
- 升級時用：`BUILDING_COST_FORMULAS[building](nextLevel)`

---

## 3. Validation

**位置：** `lib/validation/schemas.ts`

```typescript
import { DispatchSchema, BuildSchema, EquipItemSchema, ... } from "@/lib/validation/schemas";

const parsed = DispatchSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({
    success: false,
    error: parsed.error.issues.map((e: { message: string }) => e.message).join(", ")
  }, { status: 400 });
}
const { heroIds, zone, subZone, action } = parsed.data;
```

**規則：**
- 所有 API route 的 request body 必須經過 Zod schema
- Service/Model 層不做 input validation，只做 business logic
- 商業規則（如、等級上限）也放在 Zod schema 中

---

## 4. Domain Types

**位置：** `lib/types/index.ts`

所有實體類型定義於此：
- `Hero`, `HeroRoster`, `HeroType`, `Rarity`
- `ItemEntry`, `ItemType`, `ItemStats`
- `Buildings`, `BuildingType`
- `Teams`, `BattleLog`
- `Inventory`, `ArmyUnits`, `ArmorySlots`
- `Guild`, `GuildTask`
- `Statistics`, `Cooldowns`
- `ApiResponse<T>`, `GameSnapshot`

**規則：**
- 新增/修改 entity 類型 → 只在 `lib/types/index.ts` 定義
- 不在其他地方重複定義相同 type
- ITEMS 的 type 是 `RawItemEntry`（定義於 `lib/game/types/items.ts`）

---

## 5. Transaction

**位置：** `lib/db/withTransaction.ts`

跨 MongoDB document 操作時使用：

```typescript
import { withTransaction, withUserTransaction } from "@/lib/db/withTransaction";

// 多個 user 操作
await withTransaction(async (session) => {
  // operation
});

// 單一 user 多步驟操作
await withUserTransaction(user, async (session) => {
  // operation
});
```

**規則：**
- 單一 `user.save()` 不需要 transaction
- 同時改 user + 其他 collection（如 WorldBoss）→ 需要 transaction
- MongoDB 非 replica set 模式 → 會自動 fallback 到無 transaction

---

## 6. Soft Delete

**欄位：** `User.deletedAt`（Date 或 null）

```javascript
// ✅ 正確：使用 UserRepository.softDelete()
await UserRepository.softDelete(userId);

// ✅ 查詢活躍用戶
const user = await UserRepository.findByIdActive(userId);

// ❌ 嚴禁：in-memory Set（伺服器重啟後失效）
deletedDiscordUserIds.add(userId);
```

---

## 7. 禁止的 Pattern

| Pattern | 為什麼禁止 |
|---------|-----------|
| `User.findOne(...) as any` | 完全繞過 TypeScript 檢查 |
| `as Promise<any>` | 同上 |
| `as any` 在 API routes | 資料邊界沒有類型安全 |
| 兩份 `getXpForLevel` | 修改時不同步，產生不一致 |
| 兩份 `BUILDING_COSTS` | 同上 |
| in-memory Set 做 soft-delete | 伺服器重啟後失效 |

---

## 8. 新功能開發 checklist

```
□ API route？
  → 用 UserRepository，不直接 User.findOne()
  → body 經過 Zod schema

□ 修改 domain type？
  → 在 lib/types/index.ts 新增/修改

□ 新公式邏輯？
  → 在 lib/game/formulas/ 新增 .ts 檔案
  → 移除舊的重複實作

□ 修改 MongoDB schema？
  → 在 models/User.js 修改
  → 考虑是否加 index

□ 跨 document 操作？
  → 用 withTransaction 包住

□ 新物品或新英雄類型？
  → 在 lib/game/_CONSTS/ 新增 runtime 常數
  → 同步更新 lib/types/index.ts 的 interface

□ 新增 API route（功能開發中）？
  → 在 lib/config/features.ts 新增 flag，預設 false
  → route handler 第一行加 requireFeature() guard
  → 功能完成後改為 true
```

---

## 9. 現有檔案結構（不動的）

```
lib/
├── types/index.ts              ← Domain types 單一真相
├── validation/schemas.ts       ← Zod validation schemas
├── config/
│   └── features.ts             ← Feature Flags 功能開關
├── repositories/
│   └── UserRepository.ts       ← User 資料存取唯一途徑
├── db/
│   └── withTransaction.ts      ← Transaction wrapper
└── game/
    ├── formulas/
    │   ├── xp.ts               ← XP 公式單一真相
    │   └── buildingCosts.ts   ← 建築成本單一真相
    ├── types/items.ts         ← ITEMS typed wrapper
    └── services/               ← 業務邏輯（不改結構）

models/
└── User.js                     ← MongoDB schema + deletedAt

app/api/                        ← 所有 routes 用 UserRepository + Zod
```

---

## 10. 觸發重構警訊

看到以下關鍵詞，代表可能破壞重構成果：

```
User.findOne({ userId }) as any
as Promise<any>
function getXpForLevel 或 getStatIncreaseForLevel（不在 lib/game/formulas/）
local BUILDING_COSTS 或 BUILDING_COSTS
deletedDiscordUserIds / deletedEmailUserIds
new Set() 做 user deletion tracking
```

遇到上述任何一種 → 停下來，先問：「這個邏輯應該在哪裡？」

---

## 11. Feature Flags（功能開關）

**位置：** `lib/config/features.ts`

```typescript
import { requireFeature } from "@/lib/config/features";

// ✅ 正確：所有 API route handler 第一行
export async function POST(request: Request) {
  const blocked = requireFeature("army");
  if (blocked) return blocked;   // 關閉時直接回傳 403，不執行業務邏輯
  // ...
}
```

**規則：**
- 新功能開發中 → `false`，上線後改 `true`
- 每個 API route 的每個 handler（GET/POST/...）都要加 guard
- Flag 只在 `lib/config/features.ts` 定義，不在其他地方重複判斷
- 禁止用環境變數或 magic string 做功能開關，統一走此檔案

| 目前狀態 | Flag |
|----------|------|
| ✅ on（核心） | heroes, dispatch, build, inventory, rewards, profile |
| ✅ on（進階） | team, guild, worldBoss, logs, zones, events |
| ❌ off（開發中） | army, crafting |