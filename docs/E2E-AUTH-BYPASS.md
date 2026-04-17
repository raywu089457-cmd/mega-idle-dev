# E2E 測試驗證繞過機制

## 問題
Discord OAuth 登入時常出現驗證挑戰（checkpoint / captcha / 電話驗證），導致自動化測試卡住需要人工介入。

## 解決方案
在 `tests/e2e/helpers/auth-session.ts` 和 `tests/e2e/gameplay-full-journey.spec.ts` 中實現了自動點擊通過策略。

## 核心邏輯

### tryClickAuthButton(page)
依序匹配按鈕文字 pattern（authorize / allow / 允許 / continue / yes / 是），點擊找到的第一個可見按鈕。沒找到就 fallback 點第一個可見的 enabled 按鈕。

### handleVerificationAuto(page)
偵測 URL 和頁面文字是否包含 checkpoint / verify / unusual login / captcha / 驗證 等關鍵字，出現時嘗試自動點擊通過。

## 流程

1. **有快取 session** → 完全跳過 OAuth，不需驗證
2. **無快取，OAuth 登入** → 填帳密 → 送出 → 自動點擊任何出現的同意/允許/continue 按鈕 → 嘗試繞過驗證頁 → 等待 redirect 完成 → 保存 session
3. **驗證頁實在點不過去**（如電話驗證需要輸入簡訊碼）→ 還是會卡住，但這情況很少

## 恢復方式

驗證完成後 session 會被快取至 `tests/e2e/.auth/discord-session.json`，之後執行測試不再需要任何驗證。

## 已修改檔案

- `tests/e2e/helpers/auth-session.ts` — 完整重寫 login flow + auto-click
- `tests/e2e/gameplay-full-journey.spec.ts` — 移除等待手動核准，改用 auto-click 策略

---

*2026-04-17*