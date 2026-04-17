@AGENTS.md

## Architecture Enforcement (MUST FOLLOW)

任何對資料層的修改**必須**遵守以下規則，違反者必須先修復才能繼續：

### 1. 資料存取 — 只用 UserRepository
```typescript
// ❌ 嚴禁
User.findOne({ userId }) as any

// ✅ 正確
UserRepository.findByIdActive(userId)
```

### 2. 公式 — 單一真相
```typescript
// ❌ 嚴禁
function getXpForLevel(level: number) { return Math.floor(100 * Math.pow(level, 1.5)); }

// ✅ 正確
import { getXpForLevel } from "@/lib/game/formulas/xp";
```

### 3. Validation — API Route 層處理
```typescript
// ❌ 嚴禁（直接解構 body）
const { heroId, zone } = await request.json();

// ✅ 正確（先經過 Zod）
const parsed = DispatchSchema.safeParse(body);
if (!parsed.success) return NextResponse.json({ error: "..." }, { status: 400 });
```

### 4. Domain Types — lib/types/index.ts
新增/修改任何 entity 類型（Hero、Item、Building 等）→ 只在 `lib/types/index.ts` 定義，不在其他地方重複。

### 5. 建築成本 — 統一公式
```typescript
// ❌ 嚴禁
const BUILDING_COSTS = { castle: (level) => ({ gold: Math.floor(100 * Math.pow(level, 2)) }), ... };

// ✅ 正確
import { BUILDING_COST_FORMULAS } from "@/lib/game/formulas/buildingCosts";
```

### 6. 不准再出現的 pattern（MUST NOT）
- `as any` 在 API routes
- `as Promise<any>`
- 兩份相同的公式邏輯
- in-memory Set 做 soft-delete（應用 `User.deletedAt`）

---

### 快速查閱

完整規則 → `ARCHITECTURE_GUIDE.md`（強制閱讀）