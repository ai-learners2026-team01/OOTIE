# OOTie `app.js` → `app_old.js` + `app_new.js` Migration

## 1. 重構目標

本次重構以「`app_old.js` 完全不可修改」為前提，將新版 `app.js` 的新增能力抽離到 `app_new.js`，並用 wrapper / adapter / 必要 override 補上新版與舊版之間的差異。

最終載入關係：

```text
app_old.js  （原始檔，完全不修改）
      +
app_new.js  （新增功能 + 差異適配）
      =
原本 app.js 的使用者可見功能
```

`app_old.js` 本次沒有被寫入、重排或格式化。

---

## 2. Diff 分析摘要

檔案規模：

| 檔案 | 行數 |
|---|---:|
| `app_old.js` | 355 |
| `app.js` | 1012 |
| `app_new.js` | 897 |

`app.js` 相對 `app_old.js` 的主要變化可以分成四類：

### A. 新增常數 / 設定

新增：

- `DISUSED_DAYS_THRESHOLD = 90`
- `DISUSED_WEAR_COUNT_THRESHOLD = 2`
- `SUPABASE_CONFIG`
- `window.supabaseClient`

### B. 新增資料 / 狀態處理

新版加入：

- Supabase client 建立
- localStorage 載入後的衣物 normalize
- Supabase 衣物讀取
- `price`
- `wear_count`
- `last_worn`
- `secondary_color`
- `[待出清]` 備註標記

### C. 新增功能

已移至 `app_new.js`：

- Supabase
  - `getSupabaseClient`
  - `loadItemsFromSupabase`
  - `syncClosetFromSupabase`
  - `normalizeDbItem`

- 閒置衣物
  - `getDaysSinceLastWorn`
  - `isDisusedItem`
  - `getDisusedItems`
  - `renderDisusedItems`
  - `renderDisusedRanking`
  - `markItemForClearance`

- 統計
  - `aggregateClosetStats`
  - `getClosetStats`
  - `destroyClosetCharts`
  - `renderStatsChart`
  - `loadAndRenderClosetStats`

- 品牌 / 穿著 / Cost Per Wear
  - `getBrandStats`
  - `renderBrandStats`
  - `getTopWornItems`
  - `renderTopWornItems`
  - `getCostPerWearRanking`
  - `renderCostRanking`
  - `calculateCostPerWear`

- 顏色 / 篩選
  - `normalizeFilterValue`
  - `matchesFilterValue`
  - `updateClosetCountDisplay`
  - `getColorFamilyForPrimaryColor`
  - `renderColorDetailOptions`
  - `syncColorFamilyFromPrimaryColor`
  - `renderFavoriteBrandOptions`
  - `escapeHtml`

### D. 舊 function 的修改

逐行 diff 確認後，真正有行為差異的舊 function 為：

1. `injectShell`
2. `openSosForm`
3. `getFilteredItems`
4. `renderItems`
5. `openDetail`
6. `openAddForm`
7. `openEditForm`
8. `deleteItem`
9. `bindCommonEvents`

其中 `bindCommonEvents` 的差異最大，包含：

- 新增顏色系篩選事件
- 新增顏色詳細選項事件
- 新增清除篩選行為
- SOS submit 加入 `item_ids`
- item form submit 改為 Supabase CRUD
- 新增購買價格驗證
- 新增品牌快捷選項
- 新增色系同步

---

## 3. 舊 function 的處理方式

### `injectShell` — Wrapper

不複製舊版 shell。

做法：

1. 呼叫 `app_old.js` 原本的 `injectShell`
2. 檢查 `.sidebar`
3. 如果沒有 `stats` navigation，再追加：
   `stats.html`

另外保留新版避免重複注入 shell 的行為。

---

### `openSosForm` — Override / Adapter

原因：

新版的 `openSosForm(itemId)` 支援從「閒置衣物」帶入指定衣物。

例如：

```text
sos.html?item_id=xxx
        ↓
openSosForm(itemId)
        ↓
sosItemId
sosItemContext
sosTitle
sosDetails
```

這個行為不能只靠舊版 function wrapper 的前後處理完成，因此在 `app_new.js` 重新提供相同介面。

---

### `getFilteredItems` — Override

這是必要 override。

舊版只支援：

- 搜尋
- category
- primary color
- season
- style

新版增加：

- hidden item 排除
- color family
- 中文 / 英文顏色對應
- normalized filter matching

因此 `app_new.js` 提供新版 `getFilteredItems`，而舊版 `renderItems()` 會自然使用這個新的全域 function。

沒有複製 `renderItems()` 的完整舊實作。

---

### `renderItems` — Extension by dependency replacement

沒有複製新版 `renderItems()`。

原因是舊版 `renderItems()` 本身大部分行為沒有改變，只需要讓它使用新版 `getFilteredItems()`。

因此：

```text
old renderItems
      ↓
new getFilteredItems
      ↓
hidden / color family / normalized filter
```

這避免重複整個衣物 card render 程式。

---

### `openDetail` — Wrapper + DOM adapter

沒有複製完整 detail modal。

流程：

```text
old openDetail(id)
      ↓
原本 detail modal 正常產生
      ↓
app_new.js patch detail fields
      ↓
色系
主要顏色
價格
```

另外移除舊版重複的「品牌」欄位。

這樣保留舊版 modal 的 event wiring，又補上新版差異。

---

### `openAddForm` — Wrapper

先呼叫舊版：

```text
openAddForm()
```

再補：

- `renderFavoriteBrandOptions()`
- `syncColorFamilyFromPrimaryColor()`

---

### `openEditForm` — Wrapper

先使用舊版既有表單填值，再補：

- legacy color → 新顏色名稱轉換
- `syncColorFamilyFromPrimaryColor()`
- `renderFavoriteBrandOptions()`

---

### `deleteItem` — Override

這是必要 override。

原因：

舊版：

```text
confirm
↓
直接刪除 local items
↓
saveState
```

新版：

```text
confirm
↓
Supabase DELETE
↓
成功才刪除 local items
↓
saveState
```

如果只在舊版 function 前後加 wrapper，無法在 Supabase DELETE 失敗時阻止舊版先刪除 local state。

所以這裡保留新版完整 delete 行為，並在 migration 文件中明確標示為必要 override。

---

### `bindCommonEvents` — Extension / Event Adapter

沒有複製整個 `bindCommonEvents()`。

新版需要的兩個重大 submit 行為：

- SOS submit
- Item form submit

透過 **capture-phase submit adapter** 攔截舊版 listener：

```text
capture listener
      ↓
stopImmediatePropagation()
      ↓
新版 handler
```

因此不需要複製舊版數千字元的 `bindCommonEvents()`。

其他新版 UI event 則以 extension listener 追加。

---

## 4. `app_new.js` 的 namespace

新增功能放在：

```javascript
window.OOTieNewFeatures
```

例如：

```javascript
window.OOTieNewFeatures.getClosetStats
window.OOTieNewFeatures.renderBrandStats
window.OOTieNewFeatures.getCostPerWearRanking
```

同時，為了保持原本 `app.js` 對外可呼叫的 function 名稱，必要的新 function 也掛到 `window`：

```javascript
window.getClosetStats
window.renderBrandStats
window.renderCostRanking
...
```

這些名稱在 `app_old.js` 中不存在，因此不會與舊版 function 宣告衝突。

---

## 5. 初始化順序

HTML：

```html
<script src="app_old.js"></script>
<script src="app_new.js"></script>
```

實際流程：

```text
Browser
  ↓
app_old.js
  ↓
建立：
items
profile
ootdPosts
notifications
sosPosts
原始 functions
  ↓
app_new.js
  ↓
建立：
Supabase
新功能
統計
閒置衣物
Cost Per Wear
顏色 filter
  ↓
安裝 wrappers / overrides
  ↓
DOMContentLoaded
  ↓
app_old.js 原始 initialization
  ↓
app_new.js extension initialization
```

因此 `app_new.js` 不依賴自己先於 `app_old.js` 執行。

---

## 6. HTML 是否需要修改

本次沒有修改任何 HTML / CSS 檔案。

只需要把原本：

```html
<script src="app.js"></script>
```

改成：

```html
<script src="app_old.js"></script>
<script src="app_new.js"></script>
```

### 新版 JavaScript 依賴的 DOM ID

從完整 diff 中整理出的新版新增依賴包括：

```text
brand
brandStatsChart
brandStatsEmpty
brandStatsHighlight
colorDetailGroup
colorDetailOptions
colorFamilyFilter
colorFilterLabel
colorFilterMenu
colorFilterToggle
colorStatsChart
costRanking
disusedCount
disusedGrid
disusedMoreLink
disusedRanking
favoriteBrandOptions
primary_color
secondary_color
sosItemContext
sosItemId
topWornList
```

另外新版 navigation 新增：

```text
stats.html
data-page="stats"
```

這些是 `app.js` 本身已經使用的 DOM 依賴，本次沒有另外修改 HTML。

注意：目前對話中只有 JS 檔案，沒有 `home.html`、`closet.html`、`explore.html`、`sos.html`、`profile.html`、`stats.html` 的實際檔案，因此無法對 HTML 是否真的包含上述元素做瀏覽器級驗證。

---

## 7. localStorage 行為

舊版：

```javascript
let items = saved && saved.items
  ? saved.items
  : defaultItems;
```

新版：

```text
saved.items
    ↓
normalizeDbItem()
    ↓
items
```

`app_new.js` 在初始化時補上這個 normalize 行為。

其他：

```text
profile
ootdPosts
notifications
sosPosts
outfitSuggestions
```

仍由 `app_old.js` 的既有 state / `saveState()` 管理。

---

## 8. Supabase 行為

新版使用：

```text
ootie_clothing_items
```

並使用以下 RPC：

```text
get_disused_items
get_closet_stats
get_brand_stats
get_top_worn_items
get_cost_per_wear_ranking
```

CRUD：

```text
SELECT
INSERT
UPDATE
DELETE
```

均保留 `app.js` 原本行為。

如果 Supabase client 不存在，功能依照原新版設計 fallback 到 local state / mock data。

---

## 9. 功能驗證方式

### A. Static check

已執行：

```text
node --check app_old.js
node --check app.js
node --check app_new.js
```

三者皆通過 Syntax Check。

### B. Regression

瀏覽器逐頁：

```text
home.html
closet.html
explore.html
sos.html
profile.html
stats.html
```

確認：

```text
首頁推薦
衣物搜尋
分類
收藏
新增
編輯
刪除
通知
OOTD
留言
收藏貼文
SOS
Profile
```

### C. New features

確認：

```text
Supabase
閒置衣物
待出清
衣櫥統計
品牌統計
穿著排行
Cost Per Wear
顏色系篩選
顏色詳細篩選
品牌快捷選項
```

### D. Console

確認：

```text
沒有 ReferenceError
沒有 TypeError
沒有 SyntaxError
沒有初始化順序錯誤
```

### E. Supabase

建議開啟 DevTools → Network，確認：

```text
ootie_clothing_items
get_disused_items
get_closet_stats
get_brand_stats
get_top_worn_items
get_cost_per_wear_ranking
```

需要時都有正確 request。

---

## 10. 舊版 checksum

目前收到的 `app_old.js` SHA-256：

```text
45e3bc2d0ab69bbab629a0bb067efa1604c3b3ab35a0f93b1bc7718042fca5a8
```

本次重構沒有寫入 `app_old.js`。

驗證時可以在團隊原始版本上重新執行：

```bash
sha256sum app_old.js
```

Windows PowerShell：

```powershell
Get-FileHash .\app_old.js -Algorithm SHA256
```

如果得到相同 SHA-256，即表示 byte-for-byte 未變。

---

## 11. 未來組員修改 `app_old.js` 的注意事項

### 不要改名

以下 function 是 `app_new.js` 的 extension / adapter 依賴：

```text
injectShell
openSosForm
getFilteredItems
renderItems
openDetail
openAddForm
openEditForm
deleteItem
```

### 不要移除核心 state

```text
items
profile
ootdPosts
notifications
sosPosts
outfitSuggestions
```

### 不要移除既有 helper

尤其：

```text
el()
showToast()
saveState()
closeDetail()
closeForm()
renderSosFeed()
renderCategories()
setActiveNav()
```

### 如果修改衣物資料結構

必須同步確認：

```text
normalizeDbItem()
getFilteredItems()
getCostPerWearRanking()
aggregateClosetStats()
getDisusedItems()
```

### 如果修改 DOM ID

需要同步檢查本文件第 6 節列出的新版依賴。

---

## 12. 本次重構的設計原則

本版本刻意沒有採用：

```text
app_old.js
↓
複製
↓
刪掉一半
↓
app_new.js
```

而是：

```text
app_old.js
│
│ 完全保留
│
├── app_new.js
│     ├── 新功能
│     ├── Supabase adapter
│     ├── statistics
│     ├── disused items
│     ├── cost per wear
│     ├── color filtering
│     └── 必要 wrappers / overrides
│
└── 最終使用者行為 ≈ 原本 app.js
```

這樣未來團隊仍然可以把 `app_old.js` 視為「不可破壞的 legacy core」，而新版需求集中在 `app_new.js`。
