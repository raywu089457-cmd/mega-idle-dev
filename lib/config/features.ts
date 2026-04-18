/**
 * Feature Flags — 功能開關
 *
 * 用途：
 *   - 快速關閉未完成或實驗性功能，不需刪程式碼
 *   - API route 層檢查，回傳 403 而非執行邏輯
 *
 * 使用方式：
 *   import { FeatureFlags } from "@/lib/config/features";
 *   if (!FeatureFlags.army) return NextResponse.json({ error: "功能未開放" }, { status: 403 });
 */
export const FeatureFlags = {
  // ── 核心系統（勿關）──────────────────────────────────
  heroes:    true,   // 英雄招募、訓練、驅逐
  dispatch:  true,   // 英雄探索派遣
  build:     true,   // 建築建造 / 升級
  inventory: true,   // 物品欄 / 裝備
  rewards:   true,   // 每日 / 每週獎勵
  profile:   true,   // 玩家資料修改

  // ── 進階系統（可視開發進度開關）────────────────────────
  team:      true,   // 隊伍編組
  guild:     true,   // 公會任務
  worldBoss: true,   // 世界 BOSS
  army:      true,   // 軍隊系統
  crafting:  true,   // 合成系統

  // ── 輔助系統 ─────────────────────────────────────────
  logs:      true,   // 戰鬥紀錄查詢
  zones:     true,   // 區域資訊查詢
  events:    true,   // SSE 即時事件推播
} as const;

export type FeatureName = keyof typeof FeatureFlags;

/**
 * 檢查功能是否開啟，關閉時回傳標準 403 payload。
 *
 * 使用範例（API route）：
 *   const check = requireFeature("army");
 *   if (check) return check;   // 直接回傳 Response
 */
export function requireFeature(feature: FeatureName): Response | null {
  if (FeatureFlags[feature]) return null;
  return Response.json(
    { success: false, error: `功能「${feature}」目前未開放` },
    { status: 403 }
  );
}
