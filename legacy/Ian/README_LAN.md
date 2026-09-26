# OOTie · 願望清單與穿搭商品書籤系統 / Chrome 擴充功能說明手冊 (LAN)

> **分支名稱**：`lan`  
> **負責模組**：願望清單與穿搭商品書籤系統（Web 端）、Chrome 電商商品擷取擴充功能（Manifest V3）、Supabase 雲端資料庫整合（`ootie_bookmarks`）  
> **交接對象**：教師 / 專案審查與主分支合併維護人員  
> **建立日期**：2026-09-26  

---

## 1. 負責範圍與開發目標

本分支主要負責開發 OOTie 的**「願望清單與穿搭商品書籤 (Bookmarks)」**核心模組，以及配套的 **「Chrome 瀏覽器商品收藏擴充功能 (Chrome Extension)」**。

### 核心目標
1. **穿搭願望清單管理**：讓使用者在選購衣服或瀏覽穿搭靈感時，能將心儀的商品先「存成書籤」，記錄品牌、價格、尺寸、顏色、款式與來源網址，待後續搭配或購買時能一鍵回訪。
2. **Chrome 電商智慧擷取助手**：使用者在各大購物網站（如 UNIQLO、GU、ZARA、Lativ、NET、PAZZO、Shopee 等）瀏覽商品時，點擊 Chrome 擴充功能即可自動萃取商品名稱、圖片、即時售價、顏色與尺寸，並一鍵傳送至 OOTie 書籤頁。
3. **雲端與離線雙軌持久化**：完整串接 Supabase `ootie_bookmarks` 資料表與 Storage 圖片存儲，具備 RLS 安全防護；同時支援 LocalStorage 離線快取機制，確保未連線時體驗不中斷。

---

## 2. 本次完成內容與功能對照表

| 功能模組 | 完成狀態 | 說明 | 程式碼位置 |
|---|---|---|---|
| **書籤總覽網格** | ✅ Complete | 響應式 4 欄排版、卡片懸停動態放大、無圖優雅佔位、外裝直接跳轉按鈕 | `bookmarks.html:45`, `bookmarks.css:9-30`, `bookmarks.js:300-420` |
| **手動建立/編輯書籤** | ✅ Complete | 橫式雙欄佈局（左側 4:5 大圖預覽、右側輸入欄位）、支援圖片網址與本機檔案上傳、折疊式補充資訊（品牌、尺寸、顏色、價格與幣別） | `bookmarks.html:53-164`, `bookmarks.css:41-74`, `bookmarks.js:511-768` |
| **商品詳情檢視彈窗** | ✅ Complete | 獨立 Modal 展示商品大圖、品牌、價格、顏色、尺寸、來源網域與備註，提供「前往商品頁面」、「編輯」與「刪除」功能 | `bookmarks.html:194-234`, `bookmarks.css:32-40`, `bookmarks.js:423-505` |
| **批次管理與刪除** | ✅ Complete | 工具列「管理」模式切換、卡片多選 Checkbox、選取數量即時統計、批次刪除確認與 Supabase 批次刪除 | `bookmarks.html:40-43`, `bookmarks.css:3-8`, `bookmarks.js:598-616` |
| **擴充套件安裝導引** | ✅ Complete | 互動式 Modal 引導使用者載入未封裝套件，內嵌操作介面 Mockup 預覽圖展示 | `bookmarks.html:167-192`, `bookmarks.css:82-98`, `bookmarks.js:820-836` |
| **Chrome 擴充套件 (MV3)** | ✅ Complete | 遵循 Manifest V3 規範，支援主動腳本注入與 `tabs` 跨分頁調用 | `extension/manifest.json` |
| **智慧電商解析引擎** | ✅ Complete | 自動適配 Microdata、JSON-LD、OpenGraph、DOM `<h1>` 與特徵正則清洗，智慧解析 UNIQLO、GU、ZARA、Lativ 等電商 | `extension/content.js:1-540` |
| **Popup 雙欄即時操作介面** | ✅ Complete | 4:3 比例預覽圖、表單即時雙向更新、幣別選擇、自動偵測已開啟之 OOTie 分頁並帶入資料 | `extension/popup.html`, `extension/popup.css`, `extension/popup.js` |
| **Supabase 資料表與 RLS** | ✅ Complete | 建立 `ootie_bookmarks` 資料表、建立 `idx_ootie_bookmarks_owner_created_at` 索引、RLS 增刪查改政策與 `updated_at` Trigger | `supabase/migrations/20260924_ootie_bookmarks.sql` |
| **Storage 圖片儲存桶政策** | ✅ Complete | 建立 `ootie-bookmarks-images` Bucket 讀寫政策，支援使用者上傳本機商品圖 | `supabase/bookmarks-storage.sql` |
| **全站導覽整合** | ✅ Complete | 在桌面側邊欄 (`SIDEBAR_HTML`) 與手機底部導覽 (`BOTTOM_NAV_HTML`) 加入「書籤」專屬入口 | `app.js:90`, `app.js:111` |

---

## 3. 專案檔案結構與異動清單

```
OOTIE/ (Branch: lan)
├── bookmarks.html                           # 書籤頁面入口 HTML (含網格、建立/編輯彈窗、詳情彈窗、導引彈窗)
├── bookmarks.css                            # 書籤專屬樣式表 (響應式排版、雜誌風雙欄彈窗、佔位動畫)
├── bookmarks.js                             # 書籤前端邏輯模組 (CRUD、URL Query 接收、Supabase 同步、批次選取)
├── app.js                                   # 全域腳本 (更新側邊欄與底部導覽列加入書籤項目)
├── style.css                                # 全域基底樣式
├── assets/
│   └── extension-mockup.png                 # 擴充功能 UI 介面操作展示模擬圖
├── extension/                               # Chrome 擴充功能套件 (Manifest V3)
│   ├── manifest.json                        # 擴充功能設定檔 (Permissions, Action, Icons)
│   ├── content.js                           # 智慧電商商品資訊解析引擎 (Microdata / DOM 解析)
│   ├── popup.html                           # 擴充套件彈出視窗 UI (橫式雙欄排版)
│   ├── popup.css                            # 擴充套件專屬樣式 (DM Sans + Playfair Display 設計系統)
│   ├── popup.js                             # 擴充套件事件處理 (資料擷取、表單填入、跨分頁通訊)
│   └── icons/                               # 擴充套件各尺寸圖示 (16x16, 48x48, 128x128)
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── supabase/
│   ├── bookmarks-storage.sql                # Supabase Storage Bucket ('ootie-bookmarks-images') 存取政策
│   └── migrations/
│       └── 20260924_ootie_bookmarks.sql     # Supabase 'ootie_bookmarks' 資料表結構、索引與 RLS SQL
├── README_LAN.md                            # 本分支完整說明手冊與交接文檔 (供合併參照)
└── doc/
    └── human-test/
        └── 007-lan-branch.md                # 本分支人工驗收指南與測試檢核表
```

---

## 4. 系統架構與資料流向

```
  ┌─────────────────────────────────────────────────────────────┐
  │                 外部電商購物網站 (UNIQLO / ZARA 等)           │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                     [Chrome Extension Content Script]
                         (智慧擷取 Title, Price, Image)
                                 │
                                 ▼
                     [Chrome Extension Popup UI]
                         (即時預覽 / 手動修正 / 幣別)
                                 │
                         (傳送至 OOTie 書籤頁)
                                 │
        ┌────────────────────────┴────────────────────────┐
        ▼                                                 ▼
[透過 URL Query Params 傳遞]                  [手動於 Web 頁面建立書籤]
(bookmarks.html?title=...&price=...)                      │
        │                                                 │
        └────────────────────────┬────────────────────────┘
                                 ▼
                    [OOTie 書籤模組 (bookmarks.js)]
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
        【Supabase 雲端同步】            【LocalStorage 離線快取】
      - Table: ootie_bookmarks        - Key: ootie-bookmarks-data
      - Storage: ootie-bookmarks-img  - 斷網或無金鑰時自動無縫備援
```

---

## 5. 前端書籤頁面與互動設計

### A. 響應式 4 欄網格展示
- **卡片佈局**：以 `4:5` 黃金比例展示商品大圖，圖片加載失敗時呈現優雅的佔位圖標。
- **直達外部連結**：卡片右上角設有快捷外連按鈕，點擊在新分頁開啟原始購物網址。
- **空狀態處理**：當無書籤時呈現引導式空狀態卡片與「＋ 建立書籤」按鈕。

### B. 手動優先書籤表單 Modal (橫式大圖雙欄)
- **左側大圖即時預覽**：支援輸入圖片網址或「選取本機檔案」，選取後立即於左側呈現等比預覽。
- **右側欄位**：
  - 必要欄位：商品名稱（`*`）、商品頁網址、商品圖片。
  - 補充更多（折疊收合）：品牌、款式/分類、顏色、尺寸、價格、幣別選單（TWD/USD/EUR/JPY）、備註。
- **重複防護**：若輸入相同網址、款式與尺寸之商品，系統會跳出二次確認對話框，防止重複收藏。

### C. 商品詳情檢視彈窗
- 點擊卡片開啟詳細視窗，列出大圖、品牌、價格、尺寸、顏色、款式、來源網域與備註。
- 底部設有「刪除」、「編輯」與「前往商品頁面」操作按鈕。

### D. 批次管理模式
- 點擊工具列「管理」按鈕進入選取狀態，卡片左上角浮現 Checkbox。
- 頂部顯示已選件數（例如：`已選 2 件`），點擊「刪除已選」可一鍵批次刪除所選項目的雲端與本地資料。

---

## 6. Chrome 瀏覽器擴充功能架構 (`extension/`)

### A. Manifest V3 規範配置
- 使用 Manifest V3 標準，定義 `activeTab`、`scripting` 與 `tabs` 權限。

### B. 智慧電商解析引擎 (`content.js`)
- **品牌識別**：優先識別網站 Meta、JSON-LD，並內建各大電商特徵庫（UNIQLO、GU、ZARA、Lativ、NET、PAZZO、Shopee 等）。
- **標題清洗**：自動過濾 SEO 冗長後綴（例如 `| UNIQLO 台灣`、`- 蝦皮購物`、`:: PChome 24h購物`）。
- **價格與貨幣解析**：自動清洗價格字串中的逗號與貨幣符號，擷取有效數值，並依據網域名稱或 `itemprop="priceCurrency"` 判定幣別。
- **顏色與尺寸萃取**：智慧辨識 DOM 內選取的尺碼按鈕與顏色標籤，過濾「尺寸表」、「請選擇」等非單一尺碼文字。

### C. Popup 互動與跨分頁同步 (`popup.js`)
- 彈出視窗採用 600px 寬橫式雙欄排版，左側呈現商品圖片，右側提供表單微調。
- 點擊「傳送到 OOTie 書籤」時：
  1. 自動搜尋當前瀏覽器分頁是否已有開啟 `bookmarks.html`。
  2. 若已有開啟，直接更新該分頁網址並聚焦該分頁；若無，則自動開啟新分頁載入。
  3. `bookmarks.js` 透過 `handleUrlQueryParams()` 自動接收參數並彈出預填完成的建立表單，使用者一鍵確認即可存入書籤。

---

## 7. Supabase 資料庫與儲存規格

### A. `ootie_bookmarks` 資料表結構

```sql
create table if not exists public.ootie_bookmarks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  product_url text not null,
  title text not null,
  image_url text,
  image_storage_path text,
  brand text,
  price text,
  currency text default 'TWD',
  variant_name text,
  color text,
  size text,
  source_domain text,
  description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### B. 索引與 Row Level Security (RLS)
- **索引**：`idx_ootie_bookmarks_owner_created_at` 針對 `(owner_id, created_at desc)` 建立複合索引，確保高併發查詢效能。
- **RLS 政策**：啟用 Row Level Security，限制使用者僅能讀取、新增、修改與刪除屬於自己（`auth.uid() = owner_id`）的書籤紀錄。
- **自動時間戳記**：建立 PostgreSQL Trigger `set_ootie_bookmarks_updated_at`，於更新時自動刷新 `updated_at`。

### C. 儲存桶政策 (`bookmarks-storage.sql`)
- 建立 `ootie-bookmarks-images` Bucket 讀取（公開）與寫入/更新/刪除（需認證）安全政策。

---

## 8. 本地端測試與人工驗收步驟

### A. Web 端書籤功能驗收
1. 透過本機伺服器（例如 Live Server `http://127.0.0.1:5500/bookmarks.html`）開啟書籤頁。
2. 點擊「＋ 建立書籤」，填寫名稱、貼上圖片網址與商品網址，點擊「儲存書籤」，確認卡片即時出現在網格中。
3. 點擊卡片開啟詳情彈窗，驗證各欄位顯示正確，點擊「前往商品頁面」可另開分頁。
4. 點擊「管理」，勾選單件或多件書籤，點擊「刪除已選」，確認列表即時更新。

### B. Chrome 擴充功能安裝與擷取驗收
1. 開啟 Chrome 瀏覽器，網址列輸入 `chrome://extensions/` 並開啟右上方「開發人員模式」。
2. 點擊「載入未封裝項目」，選取專案中的 `extension/` 資料夾。
3. 開啟任意電商商品頁（例如 UNIQLO 台灣官網某件衣服）。
4. 點擊擴充功能圖示，驗證彈出視窗自動解析出該商品之名稱、圖片、品牌、售價與顏色。
5. 點擊「傳送到 OOTie 書籤」，驗證 OOTie 頁面自動開啟並帶入全部商品資訊。

---

## 9. 後續合併至主分支 / Vue 3 重構指引 (Teacher / Maintainer Reference)

若後續需將本分支功能整合至主分支的 **Vue 3 + Pinia + Vite** 架構，請參考以下對照建議：

### 1. 路由與視圖映射
- 新增視圖：`src/views/BookmarksView.vue`（對應 `bookmarks.html` + `bookmarks.css`）
- 路由設定：於 `src/router/index.js` 新增 `{ path: '/bookmarks', name: 'bookmarks', component: BookmarksView }`
- 側欄與底部導航：於 `AppSidebar.vue` 與 `AppBottomNav.vue` 加入書籤項目

### 2. 狀態管理 (Pinia Store)
- 新增 Store：`src/stores/bookmarks.js`
- 狀態屬性：`bookmarks: []`, `managerMode: false`, `selectedIds: []`
- Actions：`fetchBookmarks()`, `addBookmark(payload)`, `updateBookmark(id, payload)`, `deleteBookmarks(ids[])`
- 資料庫對接：於 `src/services/supabase.js` 新增 `fetchBookmarksService()`, `insertBookmarkService()` 等方法

### 3. Chrome 擴充套件整合
- `extension/` 資料夾為獨立之瀏覽器外掛，可直接保留於專案根目錄下作為外掛發布包，使用者透過本地載入即可無縫搭配 Vue 3 伺服器（預設 `http://localhost:5173/bookmarks`）使用。

