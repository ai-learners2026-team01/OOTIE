# OOTie

OOTie 是一個以衣櫥管理為核心的穿搭應用程式，協助使用者整理個人單品、探索 OOTD 靈感、發起穿搭求救，並透過統計資料了解自己的穿衣習慣。

目前專案採用原生 HTML、CSS 與 JavaScript 製作，並可選擇搭配 Supabase 儲存衣櫥資料與執行統計查詢。

## 功能

- **首頁**：依照上班、約會、旅行與隨性等場合查看穿搭提案及近期衣物。
- **我的衣櫥**：
  - 瀏覽衣物卡片與詳細資料
  - 依分類、關鍵字、顏色、色系、季節及風格篩選
  - 新增、編輯、刪除及收藏單品
  - 上傳 JPG、PNG 或 WEBP 單品照片
  - 記錄品牌、價格、版型、備註與穿著次數
  - 顯示長時間未穿或穿著次數偏少的「冷宮衣物」
  - 將冷宮衣物直接帶入穿搭求救
- **探索**：瀏覽 OOTD 貼文、按讚、留言、收藏及發布自己的穿搭。
- **穿搭求救**：發布穿搭需求，或從其他衣友的衣櫥挑選單品提出搭配建議。
- **個人檔案**：編輯個人資料、查看社群數據，以及切換衣櫥公開狀態。
- **衣櫥統計**：
  - 顏色分布
  - 色系分布
  - 風格分布
  - 類別佔比
  - 愛用品牌排行
  - 穿著次數 Top 5
  - 每次穿著成本排行
  - 冷宮衣物完整排名

## 技術架構

- **前端**：原生 HTML、CSS、JavaScript
- **圖表**：Chart.js 4.4.4
- **雲端資料庫**：Supabase JS Client 2
- **本地狀態**：瀏覽器 `localStorage`
- **圖片**：使用者上傳的 Base64 圖片或 Unsplash 示範圖片
- **字型**：DM Sans、Playfair Display

### 主要檔案

| 檔案 | 說明 |
| --- | --- |
| `home.html` | 首頁與場合穿搭提案 |
| `closet.html` | 衣櫥瀏覽、新增及編輯單品 |
| `explore.html` | OOTD 社群探索牆 |
| `sos.html` | 穿搭求救與搭配建議 |
| `profile.html` | 個人檔案與公開設定 |
| `stats.html` | 衣櫥統計與排行 |
| `app.js` | 共用資料、狀態、畫面渲染及事件處理 |
| `style.css` | 全站共用樣式與響應式版面 |
| `files/` | CSV 格式的示範資料 |
| `get_*.sql` | Supabase 統計及排行 RPC 函式 |

## 執行方式

本專案沒有 npm 或 bundler，直接使用靜態檔案即可執行。建議透過本機 HTTP server 開啟，以避免瀏覽器對本地檔案及外部資源的限制。

### 使用 Python

```powershell
python -m http.server 5500
```

接著開啟：

```text
http://localhost:5500/home.html
```

也可以直接開啟 `closet.html` 或 `stats.html`，但透過 HTTP server 測試 Supabase 與外部 CDN 資源會較穩定。

## 資料與同步策略

1. `app.js` 先從 `localStorage` 讀取 `weary-app-state-v1`。
2. 如果沒有本地資料，會使用內建的示範衣物、貼文、通知及 SOS 資料。
3. 衣櫥頁載入後會嘗試從 Supabase 的 `ootie_clothing_items` 讀取單品。
4. 統計頁會優先呼叫 Supabase RPC；呼叫失敗時，會使用前端資料重新計算可用的統計。
5. 新增、編輯、刪除及標記出清時，若 Supabase 可用會同步寫入；同時也會更新本地狀態。

因此，即使暫時無法連線 Supabase，介面仍可使用示範資料與瀏覽器本地狀態執行。

## Supabase 設定

`app.js` 目前包含 Supabase URL 與 publishable key，並使用以下資料表及 RPC 函式：

- 資料表：`ootie_clothing_items`
- RPC：`get_closet_stats`
- RPC：`get_brand_stats`
- RPC：`get_top_worn_items`
- RPC：`get_cost_per_wear_ranking`
- RPC：`get_disused_items`

專案中的 `get_*.sql` 檔案可在 Supabase SQL Editor 中部署對應的統計函式。這些函式依賴專案既有的資料表、使用者識別與 `current_profile_id()` 權限邏輯，部署前請先確認資料庫 schema 與 RLS 設定一致。

## 冷宮衣物判定

當單品符合以下任一條件時，會被列入冷宮衣物：

- 距離上次穿著超過 90 天
- 穿著次數少於 2 次
- 沒有穿著紀錄且穿著次數為 0

已設定為隱藏的單品不會出現在衣櫥、統計或冷宮排行中。

## 安全注意事項

- `SUPABASE.env.txt` 含有敏感設定，尤其是 secret key，不應提交到公開版本庫或放入前端程式。
- 瀏覽器端只能使用 Supabase publishable/anon key；需要權限的操作應透過 Supabase RLS 或後端服務保護。
- 使用者上傳的衣物照片目前以 Base64 形式暫存在 localStorage；大量圖片可能造成瀏覽器儲存空間不足。
- 專案目前未包含登入流程，示範資料使用固定的 `profile-01` 使用者識別。

## 已知限制

- 衣物穿著次數與上次穿著日期目前主要依賴既有資料，前端沒有完整的「記錄今日穿著」流程。
- 新增單品時，圖片會以 Base64 保存在本地狀態；尚未整合 Supabase Storage。
- 社群貼文、通知與 SOS 內容目前主要由前端狀態管理，未完整寫入 Supabase 資料表。
- 若 CDN、Supabase 或圖檔來源無法連線，部分外部圖片、圖表或雲端資料可能無法載入。
