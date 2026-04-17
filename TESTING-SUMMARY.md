# Mega Idle E2E 自動化測試完整紀錄

## 測試環境設定

### 基本資訊

| 項目 | 內容 |
|------|------|
| 專案路徑 | `C:\Users\ray\.openclaw\game-studios\projects\mega-idle-dev` |
| 測試目錄 | `next-app/tests/e2e/` |
| 部署網址 | `https://mega-idle-dev.onrender.com` |
| 測試框架 | Playwright 1.59.1 |
| 瀏覽器 | Chromium (Desktop Chrome) |

### 測試帳號 (Discord OAuth)

```
DISCORD_TEST_EMAIL=raywu089457@gmail.com
DISCORD_TEST_PASSWORD=Qazxsw?????!!!!!
DISCORD_TEST_USER_ID=310253972151730178
```

檔案位置: `next-app/.test-env`

### 環境變數設定

#### MongoDB Atlas (已修正 SRV DNS 問題)

```
# 原始 (有 DNS 問題):
mongodb+srv://raywu:1Qazxsw2@cluster0.d32lg7k.mongodb.net/?appName=Cluster0

# 修正後 (使用直接 replica set):
mongodb://raywu:1Qazxsw2@ac-0wlucje-shard-00-00.d32lg7k.mongodb.net:27017,ac-0wlucje-shard-00-01.d32lg7k.mongodb.net:27017,ac-0wlucje-shard-00-02.d32lg7k.mongodb.net:27017/?replicaSet=atlas-shard-0&ssl=true&authSource=admin
```

### Node.js 專案相依性

```json
{
  "dependencies": {
    "mongoose": "^9.4.1",
    "next": "16.2.4",
    "next-auth": "^4.24.14",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@playwright/test": "^1.59.1",
    "typescript": "^5"
  }
}
```

## Playwright 設定

### 設定檔案: `next-app/playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }], ["json", { outputFile: "test-results/results.json" }]]
    : [["list"]],

  timeout: 30000,
  expect: { timeout: 10000 },

  use: {
    baseURL: "https://mega-idle-dev.onrender.com",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        headless: true,
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    stdout: "pipe",
    stderr: "pipe",
  },

  outputDir: "test-results",
});
```

## 測試檔案結構

```
next-app/tests/e2e/
├── .auth/
│   └── discord-session.json      # OAuth session 快取
├── helpers/
│   ├── index.ts
│   ├── auth-session.ts          # Session 管理工具
│   ├── sse-watcher.ts           # SSE 事件監控
│   └── test-config.ts           # 測試帳號設定
├── scripts/
│   ├── explore-game.spec.ts     # 人類化遊戲探索
│   ├── login-and-save-session.ts # 登入並保存 session
│   ├── save-session.spec.ts     # 保存 session 規格
│   ├── test-recruit.spec.ts     # 英雄招募測試
│   └── manual-test.js           # 手動測試腳本
├── README.md                     # 測試文檔
├── landing.spec.ts               # 登入頁測試
├── auth.spec.ts                 # OAuth 認證測試
└── game-journey.spec.ts         # 遊戲流程測試
```

## 執行測試

### 執行所有測試

```bash
cd next-app
export $(cat .test-env | xargs) && npx playwright test
```

### 執行特定測試

```bash
cd next-app
export $(cat .test-env | xargs) && npx playwright test auth.spec.ts
```

### 單一測試 (除錯用)

```bash
cd next-app
export $(cat .test-env | xargs) && npx playwright test auth.spec.ts:37 --timeout=120000
```

### Headed 模式 (看得見瀏覽器)

```bash
cd next-app
export $(cat .test-env | xargs) && npx playwright test --project=chromium --headed
```

### 手動操作腳本 (完整面板測試)

```bash
cd next-app
node test-all-panels.js
```

## Discord OAuth 流程

### 流程步驟

1. 點擊 Discord 登入按鈕
2. 跳轉到 `https://discord.com/oauth2/authorize?...`
3. Discord 可能顯示登入表單 (若未自動登入)
4. 填入帳號密碼，提交表單
5. Discord 可能顯示「App Launched」驗證頁面 → 點擊「Continue to Discord」
6. Discord 可能顯示授權對話框 → 點擊「Authorize」
7. 自動跳轉回 `/game` 頁面

### 測試中的問題與修復

#### 問題 1: "Discord App Launched" 頁面

Discord 顯示「Discord App Launched」驗證頁面，導致 OAuth 流程卡住。

**修復:** 在測試中加入點擊「Continue to Discord」按鈕的邏輯

```typescript
try {
  const continueBtn = page.getByRole('button', {
    name: /continue to discord/i,
  });
  await continueBtn.waitFor({ timeout: 5000 });
  await continueBtn.click();
} catch {
  // No app launched step
}
```

#### 問題 2: Session Cookie 未設定

OAuth 完成後 session 未正確建立，返回 `Unauthorized`。

**修復:** 測試使用 `page.request.get()` 而非瀏覽器上下文發送請求，正確攜帶 cookies。

#### 問題 3: localhost vs 部署網址

測試檔案中有 hardcoded `localhost:3000`，需改為部署網址。

**修復:** 將所有 `localhost:3000` 替換為 `https://mega-idle-dev.onrender.com`

## 測試結果

### 登入頁測試 (landing.spec.ts) - 4/4 通過 ✅

| 測試項目 | 結果 |
|---------|------|
| 頁面載入 | ✅ |
| Discord 按鈕可見 | ✅ |
| 未登入跳轉 / | ✅ |
| 按鈕 href 正確 | ✅ |

### 認證測試 (auth.spec.ts)

| 測試項目 | 結果 | 備註 |
|---------|------|------|
| 完整 OAuth 流程 | ✅ | 需 DB 正常 |
| Session 持久化 | ⚠️ | 不穩定 |
| 已登入跳轉 /game | ✅ | |

### 遊戲流程測試 (game-journey.spec.ts)

| 測試項目 | 結果 | 備註 |
|---------|------|------|
| 遊戲頁面載入 | ✅ | |
| 金幣/魔法石顯示 | ✅ | |
| 分頁導航 | ✅ | |
| 首頁顯示 | ✅ | |
| SSE 連線建立 | ✅ | |
| 資源自動更新 | ✅ | |
| SSE user-update 事件 | ❌ | userId 匹配問題 |
| Idle tick 處理 | ✅ | |

### 完整面板測試 (test-all-panels.js) - 9/9 ✅

| Panel | 結果 | 發現 |
|-------|------|------|
| 1. 首頁 Home | ✅ | 金幣 5,050, 魔法石 11, 英雄 8 |
| 2. 英雄 Heroes | ✅ | 面板可見, 招募 enabled |
| 3. 探索 Dispatch | ✅ | 可派遣英雄 28 |
| 4. 隊伍 Team | ✅ | 隊伍欄位 2 |
| 5. 建築 Buildings | ✅ | 建築 12, 升級按鈕 12 |
| 6. 世界王 World Boss | ✅ | 面板可見, 攻擊按鈕取決於條件 |
| 7. 公會 Guild | ✅ | 無公會, 貢獻 0 |
| 8. 獎勵 Rewards | ✅ | 面板可見, 領取按鈕取決於冷卻 |
| 9. 戰報 Logs | ✅ | 戰報筆數取決於遊戲歷史 |

### 已知問題

1. **Console 401 Error**: `/api/user` 返回 401，可能是 session token 過期
2. **獎勵按鈕顯示邏輯**: 領取/X小時Y分/已領取 狀態需進一步驗證
3. **戰報 Logs CSS class**: `沒有戰報` 提示的選擇器可能需調整

## 未來 Agent 快速上手

### 1. 環境檢查

```bash
cd next-app
# 確認 .test-env 存在
cat .test-env

# 確認 Playwright 安裝
npx playwright --version
```

### 2. 執行測試

```bash
cd next-app
export $(cat .test-env | xargs) && npx playwright test
```

### 3. 除錯

```bash
# 看截圖
ls next-app/test-results/*.png

# 看 Playwright trace
# 訪問 test-results/trace.zip
```

### 4. 強制重新登入

```bash
rm next-app/tests/e2e/.auth/discord-session.json
export $(cat .test-env | xargs) && npx playwright test
```

## 關鍵檔案路徑

| 檔案 | 用途 |
|------|------|
| `next-app/.test-env` | 測試帳號憑證 |
| `next-app/playwright.config.ts` | Playwright 設定 |
| `next-app/tests/e2e/README.md` | 測試文檔 |
| `next-app/test-all-panels.js` | 完整面板測試腳本 |
| `lib/auth.ts` | NextAuth 設定 |
| `lib/db.ts` | MongoDB 連線 |
| `models/User.js` | 使用者資料模型 |
| `app/api/user/route.ts` | 使用者資料 API |
| `app/game/page.tsx` | 遊戲頁面 |

## 技術備忘

- Discord OAuth Client ID: `1493164742729007104`
- NextAuth Secret: `/9pe97lxVXrJku39+WrkDy2fsBs4xKxjBeHmg5tAZZc=`
- Callback URL: `https://mega-idle-dev.onrender.com/api/auth/callback/discord`
- MongoDB Atlas Replica Set: `atlas-shard-0`
- SSE 事件端口: `/api/events`
