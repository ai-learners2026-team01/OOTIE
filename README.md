# OOTie · 數位衣櫥與穿搭社群 Web 應用

OOTie 是一個極具質感且功能豐富的數位衣櫥與時尚穿搭社群應用程式。幫助使用者記錄並管理個人衣櫥單品、取得每日情境穿搭靈感、參與 OOTD 社群分享，並透過 Style SOS 由其他衣友提供個人化的單品搭配建議。

本專案已重構為現代化的 **Vue 3 + Pinia + Vue Router + Vite** 架構，並具備完整的 **Vitest + Happy DOM** 單元與整合測試套件。

---

## 🛠️ 本地端建立與開發環境配置 (Local Setup Guide)

請跟隨以下步驟於本地環境建立、啟動與測試專案。

### 1. 環境前置需求 (Prerequisites)

* **Node.js**：建議 `v18.0.0` 或以上版本
* **npm**：建議 `v9.0.0` 或以上版本

### 2. 安裝專案依賴 (Install Dependencies)

在專案根目錄下開啟終端機執行：

```bash
npm install
```

### 3. 設定環境變數 (Environment Variables - 可選)

本專案支援 Supabase 雲端資料庫與認證服務（具備 LocalStorage 本地模擬備援機制）。若需連接遠端 Supabase 服務，請複製 `.env.example` 為 `.env` 並填入金鑰：

```bash
cp .env.example .env
```

`.env` 設定參考：
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`VITE_SUPABASE_ANON_KEY` 仍可作為舊環境相容設定。前端只能放公開 anon/publishable key，絕不可放 `service_role` key。

### Supabase schema 與身份

正式 schema 位於 `supabase/migrations/`，依檔名順序套用。包含 `profiles`、`items`、OOTD、SOS、收藏/按讚、通知、書籤與書籤圖片 Storage 設定。新 Auth 使用者會自動建立 `profiles` 列，`profiles.id` 即 `auth.users.id`；所有私有資料的 `owner_id` 都使用 `supabase.auth.getUser()` 回傳的 UUID，RLS 依此限制擁有者。公開貼文與公開衣櫥僅提供讀取政策，寫入仍限本人。

全新 Supabase 環境可依序透過 Supabase CLI migration 部署，或在 SQL Editor 按檔名順序執行 `supabase/migrations/` 內 SQL。這組 schema 以全新環境為目標；若遠端已手動套用 legacy `profiles/items` 或 `ootie_profiles/ootie_clothing_items` schema，請先備份並規劃舊 profile UUID 到 Auth UUID 的資料轉換，不要直接重跑為新環境設計的 DDL。

### 4. 啟動本機開發伺服器 (Start Development Server)

執行以下命令啟動 Vite 開發伺服器（支援 HMR 熱模組即時替換）：

```bash
npm run dev
```

啟動後，終端機會顯示測試伺服器網址（預設為 `http://localhost:5173/`），請在瀏覽器中開啟進行測試與開發。
啟動後，終端機會顯示本機伺服器網址，請使用該網址在瀏覽器中開啟專案。Chrome 擴充功能的開發與正式書籤頁網址集中設定於 `extension/config.js`；部署到其他環境時只需更新該設定檔。

若要關閉終端或 VS Code 後仍保留預覽，可在 Windows 使用背景模式：

```bash
npm run dev:background
```

背景伺服器會寫入 `%LOCALAPPDATA%\OOTie\dev-server\` 的日誌。使用以下命令停止由此模式啟動的伺服器：

```bash
npm run dev:stop
```

背景模式只會在目前 Windows 使用者工作階段內持續；登出或重新開機後需再次執行啟動命令。

---

## 🧪 本地端測試指南 (Testing & Verification Guide)

專案提供**自動化單元與整合測試**以及**人工驗收流程指南**，確保重構與功能擴充的品質與穩定性。

### 🅰️ 自動化測試 (Automated Unit & Integration Tests)

本專案使用 **Vitest + Happy DOM + @vue/test-utils** 建立高覆蓋率測試套件。

#### 執行測試命令

* **執行單次完整測試 (Single Run)**：
  ```bash
  npm test
  ```
* **啟動實時監聽測試 (Watch Mode)**：
  ```bash
  npm run test:watch
  ```
* **在全新 PostgreSQL 測試資料庫重跑所有 migrations 並驗證 RLS**：
  ```bash
  npm run test:migrations
  ```

此 migration smoke test 使用 PGlite 建立空白資料庫與 Supabase Auth/Storage 最小相容結構，連續套用 migration 兩次，並驗證 Auth profile trigger、統計 RPC 與不同使用者間的私有資料隔離。

#### 測試檔案結構與涵蓋範圍

```
src/
├── stores/
│   └── __tests__/
│       ├── appStore.spec.js     # 測試 Toast 提示、通知新增/已讀標記與 Modal 狀態
│       ├── authStore.spec.js    # 測試 Supabase 認證、訪客防護與 Demo 登入/登出
│       ├── closetStore.spec.js  # 測試單品 CRUD、多條件過濾與收藏切換
│       ├── ootdStore.spec.js    # 測試 OOTD 貼文發布、Hearts 點讚、收藏與留言
│       └── sosStore.spec.js     # 測試 SOS 求救發布與搭配建議提交
├── components/
│   └── modal/__tests__/
│       └── AuthModal.spec.js    # 測試登入/註冊切換、密碼顯示與快速填入測試帳號
└── views/
    └── __tests__/
        ├── HomeView.spec.js     # 整合測試：情境切換、天氣推薦與單品詳情開啟
        ├── ClosetView.spec.js   # 整合測試：衣櫥網格卡片、分類切換與 Modal 觸發
        ├── AiView.spec.js       # 整合測試：AI 穿搭助手提案生成與歷史紀錄
        └── TryonView.spec.js    # 整合測試：虛擬試穿模特兒選擇、訪客驗證與 OOTD 發布
```

---

### 🅱️ 人工驗收流程指南 (Manual Acceptance Testing)

若需針對特定功能分支進行人工 UI / UX 互動驗收，請參考 `doc/human-test/` 中的驗收指南文件：

* 📘 [001-sinsin-branch.md](file:///Users/keoinn/Desktop/OOTIE/doc/human-test/001-sinsin-branch.md) · **Sinsin 分支驗收** (衣櫥刪除確認 Dialog、探索頁留言彈窗、SOS 關閉確認)
* 📘 [002-sandy-branch.md](file:///Users/keoinn/Desktop/OOTIE/doc/human-test/002-sandy-branch.md) · **Sandy 分支驗收** (個人檔案編輯、背景圖裁切、統計數據)
* 📘 [003-ming-branch.md](file:///Users/keoinn/Desktop/OOTIE/doc/human-test/003-ming-branch.md) · **Ming 分支驗收** (AI 智慧穿搭助手、情境濾鏡與對話)
* 📘 [004-hayley-branch.md](file:///Users/keoinn/Desktop/OOTIE/doc/human-test/004-hayley-branch.md) · **Hayley 分支驗收** (側欄收合、即時天氣推薦、追蹤系統、通知 Deep Link、手機 Quick Action)
* 📘 [005-qingnian-branch.md](file:///Users/keoinn/Desktop/OOTIE/doc/human-test/005-qingnian-branch.md) · **Qingnian 分支驗收** (首頁路由重定向、通知與登入模組化、會員 Popover 選單、動畫統一)

---

## 📦 生產環境打包與預覽 (Build & Preview)

當準備進行生產環境部署或預覽編譯成果時：

1. **打包編譯生產 bundle**：
   ```bash
   npm run build
   ```
2. **本地預覽打包產出**：
   ```bash
   npm run preview
   ```

---

## 📂 專案目錄結構 (Project Structure)

```
OOTIE/
├── doc/                      # 系統規格與人工驗收指南 (human-test/)
│   └── human-test/           # 人工驗收步驟與檢核表 (*-branch.md)
├── src/                      # Vue 3 應用主要程式碼
│   ├── assets/               # 靜態資源與全域樣式 (main.css)
│   ├── components/           # Vue 元件 (layout, modal, ui)
│   ├── constants/            # 全域對照常數與預設資料
│   ├── router/               # Vue Router 4 頁面路由設定
│   ├── services/             # Supabase 資料庫與 API 服務
│   ├── stores/               # Pinia 狀態管理 Stores 與測試 (__tests__)
│   └── views/                # 頁面主視圖與整合測試 (__tests__)
├── legacy/                   # 舊版原生程式碼歸檔區 (main, qingnian, hayley 等)
├── supabase/migrations/      # 正式資料庫 schema 與 RLS migrations
├── scripts/                  # 資料庫 migration smoke test
├── index.html                # 入口 HTML
├── vite.config.js            # Vite & Vitest 設定檔
└── package.json              # 專案套件配置
```

---

## ✨ 核心功能簡介 (Features)

1. **數位衣櫥 (Digital Closet)**：新增/編輯單品、上傳照片、色彩與風格條件篩選、收藏與備註。
2. **情境與天氣穿搭推薦 (Home)**：根據上班、約會、旅行、隨性等場合與 Open-Meteo 即時天氣，挑選適合搭配。
3. **OOTD 穿搭社群 (Explore)**：瀏覽衣友穿搭分享、發布 OOTD、按讚 Hearts、收藏、留言與追蹤作者。
4. **Style SOS 穿搭求救 (Sos)**：發布穿搭難題，其他衣友可直接選擇求救者衣櫥內的單品進行組合建議。
5. **個人檔案與數據 (Profile)**：展現發布紀錄、統計數據、公開/私人衣櫥權限設定與頭像 Popover。
