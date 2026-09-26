# OOTie 專案架構與程式碼說明手冊 (AIZHEN)

本文件深入分析 **OOTie** 專案的軟體架構、資料流程、前端介面組織、Supabase 雲端資料庫設計與各模組實作細節，提供開發者與團隊維護、除錯與擴充功能之完整參考。

---

## 1. 專案概述

**OOTie** 是一個以「數位衣櫥管理」為核心，並延伸至「社群穿搭靈感探索」與「穿搭求救互動 (Style SOS)」的現代 Web 應用程式。

### 核心價值
1. **衣櫥數位化**：使用者可上傳單品照片、記錄分類、色系、價格、版型與穿著次數。
2. **穿衣數據統計與分析**：
   - 顏色/色系/風格/類別佔比視覺化圖表。
   - 愛用品牌排行。
   - 百搭戰力榜（穿著次數 Top 5）。
   - CP 值（每次穿著成本 Cost Per Wear, CPW）排行。
   - 冷宮衣物檢測（長期未穿或低穿著頻率單品）與出清標記。
3. **場景穿搭推薦**：首頁依上班、約會、旅行、隨性等情境智慧推薦穿搭組合。
4. **社群與 Style SOS 互動**：
   - 瀏覽社群 OOTD 穿搭牆、按讚與留言。
   - 發起穿搭求救（Style SOS），其他衣友可從求救者的公開衣櫥中挑選單品並給予搭配建議。

---

## 2. 系統技術棧

- **前端核心**：原生 HTML5、CSS3（現代 Flexbox / CSS Grid / CSS Variables 變數系統）、原生 JavaScript (ES6+)。
- **腳本與樣式模組架構**：
  - **CSS 樣式雙軌載入**：`style_old.css`（基底全域設計系統與響應式排版）+ `style_new.css`（冷宮、進階篩選、統計圖表等新增樣式）。
  - **JavaScript 雙層設計 (Legacy Core + Adapter/Extension)**：
    - `app_old.js`：不可破壞的基底 Core，負責初始示範資料、基礎 DOM 渲染與本地狀態。
    - `app_new.js`：擴充配接層，負責 Supabase 連線與 RPC 調用、進階色系/品牌篩選、閒置衣物檢測、統計圖表及對舊函式的 Wrapper / Adapter / Override。
- **圖表視覺化**：Chart.js 4.4.4（用於統計頁甜甜圈圖、長條圖與分佈圖）。
- **後端與資料庫 (BaaS)**：Supabase (PostgreSQL 關聯式資料庫 + RPC 預存程序 + JS Client v2)。
- **本地離線與快取**：瀏覽器 `localStorage`（儲存 Key: `weary-app-state-v1`）。
- **字型與視覺設計**：Google Fonts (`DM Sans`, `Playfair Display`)，現代極簡與時髦雜誌風格。

---



## 3. 目錄結構分析

```text
OOTie/
├── home.html                     # [首頁] 情境穿搭提案、近期加入單品、SOS 摘要與 OOTD 靈感
├── closet.html                   # [我的衣櫥] 單品瀏覽、色彩/風格/季節篩選、新增/編輯/出清衣物、冷宮提醒
├── explore.html                  # [探索] 社群 OOTD 探索牆、為你推薦/追蹤中切換、按讚與留言、發布穿搭
├── sos.html                      # [穿搭求救] 發布 SOS 需求、從他人衣櫥挑選單品組合給予建議
├── profile.html                  # [個人檔案] 個人資訊編輯、社群數據統計、衣櫥公開開關、個人 OOTD 歷史
├── stats.html                    # [衣櫥統計] 圖表分析（顏色/色系/風格/類別/品牌）、戰力榜、CP值與冷宮清單
├── app_old.js                    # [基底腳本] 原始核心狀態管理、初始示範資料、基礎渲染與事件 (保持唯讀/不修改)
├── app_new.js                    # [擴充腳本] Supabase 整合、Adapter/Wrapper、進階篩選、統計圖表與閒置衣物
├── style_old.css                 # [基底樣式] 全域設計系統變數、基礎響應式排版與共用元件
├── style_new.css                 # [擴充樣式] 冷宮提醒、二級色系下拉選單、品牌捷徑與統計版面擴充
├── SUPABASE.env.txt              # [環境設定] Supabase 專案 URL、Anon Key 與 Secret Key (機密檔案)
├── Lovable Cloud.txt             # [雲端備忘] 雲端部署與備註檔案
├── files/                        # [示範資料與遷移記錄]
│   ├── APP_MIGRATION.md          # app.js 拆分為 app_old.js + app_new.js 重構遷移技術指南
│   ├── app_old.js                # 舊版基底腳本備份
│   ├── style_old.css             # 舊版基底樣式備份
│   ├── clothing_items.csv        # 單品資料表示範結構
│   ├── ootd_posts.csv            # OOTD 貼文示範資料
│   ├── outfit_suggestions.csv    # 穿搭建議示範資料
│   ├── post_likes.csv            # 貼文按讚關聯
│   ├── profiles.csv              # 使用者個人檔案
│   ├── saved_posts.csv           # 收藏貼文資料
│   ├── sos_posts.csv             # 穿搭求救貼文
│   └── notifications.csv         # 系統通知
├── get_closet_stats.sql          # [Supabase RPC] 彙整顏色、色系、風格、分類的分佈統計 JSON
├── get_brand_stats.sql           # [Supabase RPC] 計算前 5 大愛用品牌與數量
├── get_top_worn_items.sql        # [Supabase RPC] 取得穿著次數最高的 5 件單品（百搭神器）
├── get_cost_per_wear_ranking.sql # [Supabase RPC] 計算每次穿著成本 (Price / Wear Count) 並排序
├── get_disused_items.sql         # [Supabase RPC] 篩選冷宮衣物（>90天未穿或穿著次數<2）
├── README.md                     # 專案通用說明
└── README_AIZHEN.md              # 系統架構與程式碼深度分析說明手冊
```

---

## 4. 前端架構與程式碼解析

### 4.1 雙層模組架構與載入機制 (`app_old.js` + `app_new.js`)

專案以「`app_old.js` 保持不可修改的 Legacy Core」為前提，將新功能與差異適配抽離至 `app_new.js`，採用 **Wrapper / Adapter / Override** 設計模式：

1. **載入順序**：
   各 HTML 頁面均按順序載入：
   ```html
   <script src="app_old.js"></script>
   <script src="app_new.js"></script>
   ```
2. **命名空間規範 (`window.OOTieNewFeatures`)**：
   - `app_new.js` 中的新功能統一掛載於 `window.OOTieNewFeatures`（例如 `getClosetStats`、`renderBrandStats`、`getCostPerWearRanking`、`getDisusedItems` 等）。
   - 同時掛載到 `window` 全域函式，使各 HTML 內嵌腳本可直接無縫呼叫。
3. **函式配接策略 (Wrapper / Adapter / Override)**：
   - **`injectShell` (Wrapper)**：先呼叫舊版注入基本側邊欄，再動態補上「衣櫥統計 (`stats.html`)」導覽項目與避免重複注入判斷。
   - **`openSosForm` (Adapter/Override)**：支援從網址參數（如 `sos.html?item_id=xxx`）或冷宮卡片自動帶入單品內容。
   - **`getFilteredItems` (Override)**：覆寫篩選邏輯，加入排除隱藏單品、五大色系與二級顏色篩選及字串標準化比對。
   - **`openDetail` (Wrapper + DOM Patch)**：舊版 Detail Modal 產生後，動態補上「色系」、「主要顏色」與「購買價格」欄位，並校正重複的品牌欄位。
   - **`openAddForm` / `openEditForm` (Wrapper)**：舊版表單填值後，動態補齊「愛用品牌快速選擇捷徑」與「主色/色系自動聯動」。
   - **`deleteItem` (Override)**：改為先發送 Supabase DELETE 請求，成功後再自本地 state 刪除並存檔。
   - **`bindCommonEvents` (Capture-phase Adapter)**：透過事件捕獲階段（Capture Phase）攔截 `itemForm` 與 `sosForm` 的 Submit 事件，在舊版 handler 觸發前優先執行 Supabase 同步與擴充欄位驗證。

### 4.2 共用架構注入 (`injectShell`)
為了維持多頁面（Multi-page App）的一致性，`app_old.js` 與 `app_new.js` 在 DOM 載入時自動將共通 UI 結構注入到各頁面的 Slot 容器中：
- `#sidebar-slot`：桌面端側邊導航欄（包含 Logo、首頁、衣櫥、探索、求救、統計、個人檔案等連結及「＋ 新增單品」捷徑）。
- `#topbar-slot`：頂部列（搜尋、通知圖示與未讀 Badge、個人頭像縮寫）。
- `#bottom-nav-slot`：行動裝置底部導航欄。
- `#notification-modal-slot`：共用通知下拉/彈跳視窗。
- `#toast`：全域提示訊息視窗。

### 4.3 狀態管理與雙軌同步策略

系統採用 **「本地 LocalStorage 優先 + Supabase 雲端非同步同步」** 的混合設計：
1. **讀取順序**：
   - 頁面載入時透過 `loadState()` 從 `localStorage`（Key: `weary-app-state-v1`）載入包含 `items`, `profile`, `ootdPosts`, `notifications`, `sosPosts`, `outfitSuggestions`。
   - `app_new.js` 初始化時透過 `normalizeDbItem()` 補齊每件單品的擴充屬性（`price`、`wear_count`、`last_worn`、`secondary_color`）。
   - 若本地無資料，則載入內建初始示範資料。
   - 進入衣櫥頁時呼叫 `loadItemsFromSupabase()` / `refreshClosetFromSupabase()`，從雲端資料庫抓取最新衣物單品覆蓋並更新本地快取。
2. **寫入順序**：
   - 使用者進行單品新增、編輯、刪除或標記待出清時，優先更新本地 `items` 陣列並執行 `saveState()`，確保畫面立即反映（Optimistic UI）。
   - 若偵測到 Supabase 連線正常，同步發送 `insert`/`update`/`delete` 到雲端資料庫 `ootie_clothing_items` 資料表。

### 4.4 核心演算法與商業邏輯

1. **色彩與色系自動對應**：
   系統內建五大色系映射規則：
   - `無彩色系`：白色、黑色、炭灰色、米白色
   - `大地色系`：卡其色、奶茶色、棕色
   - `清甜暖色系`：暖橙色、奶油黃、櫻花粉、芥末黃
   - `藍綠冷色系`：丹寧藍、天藍色、軍綠色、酪梨綠
   - `紫紅神秘系`：酒紅色、薰衣草紫、玫瑰紅、葡萄紫
   選擇主要顏色時，表單會自動映射並填入對應色系與 Hex 顏色碼。

2. **每次穿著成本 (Cost Per Wear, CPW)**：
   $$\text{CPW} = \frac{\text{購買價格 (Price)}}{\max(\text{穿著次數 (Wear Count)}, 1)}$$
   若單品無價格或價格為 0 則不納入划算排行；穿著次數為 0 時以 1 計算單次成本。

3. **冷宮衣物 (Disused Items) 判定標準**：
   未被隱藏（`hidden != true`）且符合以下任一條件者：
   - 距離上次穿著日期（`last_worn`）超過 90 天（`DISUSED_DAYS_THRESHOLD = 90`）。
   - 穿著次數（`wear_count`）小於 2 次（`DISUSED_WEAR_COUNT_THRESHOLD = 2`）。
   - 尚無穿著紀錄且穿著次數為 0。

---

## 5. 資料庫與 Supabase RPC 設計

專案利用 PostgreSQL 的強大聚合能力，將複雜的運算移至資料庫層（RPC 函式），提升前端效能：

| SQL 檔案 | RPC 函式名稱 | 傳回格式 | 業務邏輯與用途 |
| :--- | :--- | :--- | :--- |
| `get_closet_stats.sql` | `get_closet_stats()` | `JSONB` | 聚合計算當前使用者的 `colorStats`、`colorFamilyStats`、`styleStats`、`categoryStats` 數量分佈。 |
| `get_brand_stats.sql` | `get_brand_stats()` | `TABLE(brand, item_count)` | 排除空白品牌，統計各品牌持有數量並取出 Top 5。 |
| `get_top_worn_items.sql` | `get_top_worn_items()` | `TABLE(...)` | 依照 `wear_count DESC` 排序，挑選前 5 件最高頻率穿著的單品。 |
| `get_cost_per_wear_ranking.sql` | `get_cost_per_wear_ranking()` | `TABLE(...)` | 篩選有價格之單品，依 $\text{price} / \text{wear\_count}$ 升冪排序，計算最具 CP 值的單品。 |
| `get_disused_items.sql` | `get_disused_items()` | `TABLE(...)` | 篩選未穿 > 90 天或次數 < 2 之單品，並按久未穿著天數降冪排序。 |

*註：所有 RPC 函式均採用 `security invoker` 並透過 `owner_id = current_profile_id()` 確保多租戶資料隔離與安全性。*

---

## 6. 各頁面功能與互動說明

### 6.1 首頁 (`home.html`)
- **情境選單**：支援「上班、約會、旅行、隨性」四種情境，即時切換推薦的單品組合與說明。
- **近期加入**：動態展示最近新增入庫的 4 件單品卡片。
- **動態捷徑**：直接連通 Style SOS 求救清單與社群熱門 OOTD 穿搭靈感。

### 6.2 我的衣櫥 (`closet.html`)
- **冷宮提醒橫幅**：快速展示需要拯救或考慮出清的衣物。
- **多維度複合篩選**：
  - 關鍵字搜尋（名稱、品牌、備註）。
  - 色系與二級顏色過濾。
  - 季節（春夏、秋冬、四季）與風格（極簡、休閒、簡約正式、時髦）下拉選單。
  - 分類標籤頁切換（全部、上衣、下身、洋裝、外套、鞋履、包款、配件）。
- **單品互動**：支援查看單品詳細 Modal、編輯資料、標記 `[待出清]` 以及直接為單品發起 SOS 求救。

### 6.3 探索社群 (`explore.html`)
- **穿搭瀑布牆**：展示衣友發布的 OOTD 照片、標籤、單品關聯與文案。
- **互動機制**：即時點擊愛心按讚、展開檢視與新增評論。
- **發布 OOTD**：支援使用者上傳實穿照片、撰寫 Caption、輸入 Hashtag 並連結衣櫥內的單品。

### 6.4 Style SOS 穿搭求救 (`sos.html`)
- **發布求救**：設定情境場合、預期天氣、時機、期待風格及指定困擾單品。
- **互動搭套**：其他使用者點擊「幫她搭一套」後，可直接於 Modal 瀏覽該使用者的數位衣櫥，勾選多件衣物進行視覺化搭配，並留下具體搭配建議。

### 6.5 衣櫥統計 (`stats.html`)
- **Chart.js 視覺化圖表**：
  - 顏色分佈甜甜圈圖
  - 五大色系分佈長條圖
  - 風格偏好分佈圖
  - 類別比例甜甜圈圖
  - 品牌分佈圖表
- **三大榜單**：
  - 我的百搭神器 (Top 5 穿著頻率)
  - 最划算單品 (CP 值最高單品)
  - 冷宮衣物完整清單 (含直接出清與求救捷徑)

### 6.6 個人檔案 (`profile.html`)
- 個人簡介、帳號 ID 與頭像縮寫修改。
- 社群聲譽指標（Hearts 數量、幫助衣友次數、貼文總讚數）。
- 衣櫥公開/私人切換開關。
- 個人歷次發布的 OOTD 穿搭專屬牆面。

---

## 7. 安裝與執行說明

專案採用標準純靜態架構，無需經過 Webpack、Vite 或 npm 編譯流程：

### 本地啟動方式

1. **使用 Python 內建 HTTP Server**：
   ```bash
   python -m http.server 5500
   ```
2. **使用 VS Code Live Server**：
   在 VS Code 中右鍵點擊 `home.html` 並選擇 **"Open with Live Server"**。
3. **瀏覽存取**：
   開啟瀏覽器連線至 `http://localhost:5500/home.html`。

---

## 8. 未來擴充與優化建議

1. **Supabase Storage 整合**：目前衣物照片以 Base64 格式暫存於 localStorage，未來建議將圖片直接上傳至 Supabase Storage Bucket 並儲存公開 URL，以避免 LocalStorage 容量超限問題。
2. **完整會員認證 (Supabase Auth)**：整合 Email / OAuth 登入流程，替換目前預設的 `profile-01` 靜態 ID。
3. **即時穿搭打卡 (Wear Today)**：增加快速「記錄今日穿著」功能，在點選穿搭時自動將關聯單品的 `wear_count + 1` 並更新 `last_worn` 為當日日期。
4. **社群資料雲端化**：將 OOTD 貼文、留言、按讚與 SOS 穿搭建議完全持久化至 Supabase 對應資料表。
5. **環境變數安全管理**：`SUPABASE.env.txt` 內含 Secret Key，部署至生產環境時切勿暴露於前端或公開版本庫，所有需要高權限的操作應透過後端或 Supabase RLS（Row Level Security）保護。
