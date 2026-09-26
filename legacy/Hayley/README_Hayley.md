# 楊知穎（Hayley）｜功能開發交接 README

> 文件目的：說明本分支（`Hayley`）**實際完成**的功能、目前狀態、資料流、測試結果與 Merge 注意事項，供組員 Code Review / Merge / Handoff 使用。
>
> - Branch：`Hayley`　HEAD：`0b1a602`（與 `origin/Hayley` 同步）
> - 對應 commit：`0b1a602 首頁通知／個人檔案跳轉功能新增＋為你挑一套新增衣服資訊`
> - 文件建立時 `git status --short`：**乾淨**（無未提交變更）
> - 所有描述皆對照分支實際程式碼與 git 紀錄；無法確認者一律標示「待確認」，未完成者標示 ⏳。

**歸屬說明（必讀）**
本分支建立在初始 commit `4f4dc7d Initial commit`（作者 aizhen）的靜態 prototype 之上。
本文列出的「完成內容」皆為 `4f4dc7d` **之後**、於本分支實際修改的部分（本分支 6 個 commit 的作者皆為 Hayley）。
**初始版本就已存在的功能不列為本分支成果**；跨模組、可能屬於其他組員的項目另以「待確認」標示。

---

## 1. 負責範圍

- **負責功能**：首頁（`home.html`）、探索頁（`explore.html`）、底部導覽＆側欄（`app.js` 共用版型），以及上述頁面的**跳轉功能**。
- **主要目標**：讓使用者能在 5 個頁面之間（首頁／探索／衣櫥／個人檔案／穿搭求救）用「側欄、手機底部導覽、卡片點擊、頭像、通知」順暢移動，並在點擊後**看到對應的內容**（貼文、留言、帳號、單品）。
- **使用者可以做到什麼**：
  - 用側欄（桌機）或底部導覽（手機）在 首頁／探索／衣櫥／我的 之間切換
  - 收合／展開側欄，狀態會被記住（重新整理後仍保持）
  - 手機底部導覽的「＋」可跨頁新增單品 → 發布 OOTD → 發布求救
  - 首頁：選場合 → 看天氣 → 取得推薦 → 「重新搭配」→ 點衣服看單品資訊 → 點靈感照片看貼文
  - 探索頁：搜尋、切換「為你推薦／追蹤中」、對貼文按愛心／留言／收藏、點作者跳到他的個人檔案、追蹤對方
  - 右上頭像 → 自己的個人檔案；通知 → 對應的貼文／留言／求救，或點通知裡的帳號 → 該帳號的個人檔案

---

## 2. 本次完成內容

（狀態依 PHASE 3 分類；`file:line` 為實際程式證據）

| 功能 | 狀態 | 說明 |
|---|---|---|
| 共用版型 Shell 注入（側欄／頂欄／底部導覽／通知視窗） | ✅ Complete | `app.js:95-165`（版型常數＋`injectShell()`），5 個頁面都有 4 個 slot |
| 側欄可收合＋狀態記憶 | ✅ Complete | `app.js:167-184`，`localStorage['ootie-sidebar-collapsed']`，含 `aria-expanded/aria-label` |
| 側欄改版（4 項：首頁／探索／衣櫥／我的＋衣櫥 SVG 圖示） | ✅ Complete | `app.js:95-105`（初始版為 5 項且無收合鈕） |
| 底部導覽改版（首頁／探索／＋／衣櫥／我的） | ✅ Complete | `app.js:116-148`，手機版為浮動膠囊（`style.css:355`） |
| 底部導覽「＋」快速選單（加入單品／發布 OOTD／發布求救） | ✅ Complete | `app.js:116-148`（選單 markup）、`app.js:727-745`（`handleQuickAction`） |
| 快速選單**跨頁跳轉**（同頁直接開 modal，非同頁帶 `?quick=` 跳頁再自動開啟） | ✅ Complete | `app.js:738-744`、`app.js:755-763`（`applyQuickActionFromUrl`） |
| 導覽 active 狀態（含「查看別人檔案」時標示為探索） | ✅ Complete | `app.js:87-93`（`setActiveNav`，判斷 `?user=`） |
| 首頁：頁首品牌／場合選擇／推薦面板 | ✅ Complete | `home.html:20-24`、`app.js:214-232` |
| 首頁：天氣資訊（Open-Meteo）＋地理定位 fallback | ✅ Complete | `app.js:186-213`，失敗時用台北 25.033/121.565 |
| 首頁：推薦演算法（場合＋天氣加權） | ✅ Complete | `app.js:233-269`（`getRecommendationItems`／`weatherScore`） |
| 首頁：「重新搭配」 | ✅ Complete | `home.html:24`、`app.js:219`（reroll 會避開目前顯示的單品） |
| 首頁：**點推薦的衣服 → 單品詳細資訊彈窗** | ✅ Complete | `app.js:271-289`（渲染＋事件）、`app.js:706-712`（`openDetail`）；缺件有 guard |
| 首頁：Inspiration 卡片點擊／鍵盤 Enter → 貼文詳情彈窗 | ✅ Complete | `home.html:27`（`data-home-post` + `role=button`）、`app.js:220-224` |
| 首頁：SOS 卡片 → 跳轉 `sos.html` | ✅ Complete | `home.html:26`（`<a class="sos-card" href="sos.html">`） |
| 頂欄頭像 → 自己的個人檔案 | ✅ Complete | `app.js:107-113`（`<a href="profile.html">`，不帶 `?user=`） |
| 探索頁：搜尋＋「為你推薦／追蹤中」切換 | ✅ Complete | `explore.html:24`、`app.js:548-553`、`app.js:844` |
| 探索頁：貼文卡三動作（愛心／留言／收藏）＋SVG 圖示 | ✅ Complete | `app.js:573-576`（圖示與收藏數）、`app.js:605-631` |
| 探索頁：點圖片／留言數 → Instagram 風格貼文詳情彈窗 | ✅ Complete | `app.js:500-547`、`explore.html:46` |
| 探索頁：點作者頭像／帳號 → 該帳號個人檔案 | ✅ Complete | `app.js:562-566`（`data-profile-user`）、`app.js:581-583` |
| 探索頁：追蹤鈕（與個人檔案頁狀態同步、影響「追蹤中」動態） | ✅ Complete | `app.js:569`、`app.js:585-603`、`app.js:294-305` |
| 個人檔案頁：貼文卡可互動（愛心／留言／收藏／點擊開貼文） | ✅ Complete | `app.js:406-439` |
| 通知：細項深層連結（點整條 → 對應貼文／留言／求救） | ✅ Complete | `app.js:441-449`（`notificationLink`）、`app.js:474-490`（點擊綁定）、`app.js:766-776` |
| 通知：點條列中的**帳號字樣** → 該帳號個人檔案 | ✅ Complete | `app.js:451-463`（`notificationProfileLink`／`notificationTextHtml`）、`app.js:484-489` |
| 貼文詳情彈窗：照片固定尺寸且不壓到文字 | ✅ Complete | `style.css:67-70`（桌機 320×400）、`style.css:350`（手機固定 300px） |
| 響應式斷點（1100／900／760px） | ✅ Complete | `style.css:310`、`313`、`314+` |
| 「穿搭求救」導覽入口 | 🟡 Partial | 側欄與底部導覽皆**沒有** `data-page="sos"`；目前只能從首頁 SOS 卡片或「＋」選單進入，且在 `sos.html` 不會有 active 高亮 → 是否刻意設計**待確認** |
| 個人檔案頁「追蹤」鈕 | 🟡 Partial | `profile.html:26`、`app.js:366-375`（顯示與狀態）、`app.js:802-808`（點擊）；功能可用，但**歸屬範圍待確認**，且尚無「追蹤中／追蹤者」數字 |
| 通知系統 | 🟡 Partial | 初始版已有通知視窗與 `target` 跳頁；本分支擴充為細項深層連結。目前仍為**本機模擬**，`comment-like` 型別只有示範資料（沒有「對留言按愛心」的 UI） |
| 首頁「最近加入衣櫥」區塊 | ⚠️ Known Issue | `home.html` 已移除該區塊，但 `app.js:225-229` 仍保留渲染邏輯（不會執行），`style.css:310` 也有 `.recent-row`／`.home-hero` 的無效選擇器 |

---

## 3. 使用者流程

**A. 首頁（推薦 → 單品資訊 / 貼文）**

```text
使用者開啟 home.html
↓
renderHome()：注入場合按鈕 → loadWeather() 取天氣 → updateRecommendation('上班')
↓
使用者點「場合」或「↻ 重新搭配」
↓
getRecommendationItems() 依天氣＋場合計分，挑 3 件單品 → 更新 #outfitMini
↓
使用者點其中一件衣服（role="button" / 鍵盤 Enter）
↓
openDetail(itemId) → 開啟 #detailBackdrop 顯示單品詳細資訊（找不到單品 → toast 提示）
```

**B. 探索 → 個人檔案 → 追蹤（跨頁跳轉）**

```text
使用者在 explore.html 看到貼文卡
↓
點作者頭像／帳號 → profile.html?user=@xxx
↓
renderProfile() 用 getProfileByUsername() 組出對方資料，顯示「＋ 追蹤」鈕
↓
使用者按「＋ 追蹤」→ setFollowingUser() 寫入 followingUsers 並同步該帳號貼文 following
↓
按鈕變「已追蹤」（secondary 樣式），探索頁「追蹤中」會出現該帳號的貼文
```

**C. 通知 → 對應內容（含「點帳號」分流）**

```text
使用者點右上通知鈴 → 標記全部已讀並開啟通知面板
↓
點「通知整條」                          ／  點條列中的「帳號字樣」
↓                                       ↓
notificationLink() 產生深層連結          profile.html?user=@xxx
↓
explore.html?post=post-01&comment=comment-03
↓
applyNotificationDeepLinkFromUrl() → openComments(postId, commentId)
↓
開啟貼文快照彈窗 + 標示（highlight）該留言
```

**D. 手機底部導覽「＋」跨頁新增**

```text
使用者點底部導覽「＋」（quickActionToggle）
↓
選「加入單品 / 發布 OOTD / 發布求救」
↓
handleQuickAction()：若已在對應頁 → 直接開 modal
                    否則 → 導向 closet.html?quick=add-item 等
↓
applyQuickActionFromUrl() 於載入後自動開啟對應 modal
```

---

## 4. 主要功能說明

### 4.1 共用版型（側欄／頂欄／底部導覽／通知視窗）

- 用途：五個 HTML 頁面只保留 4 個空 slot，版型與導覽全部由 `app.js` 注入，避免每個頁面各自複製一份選單。
- 目前支援：
  - `injectShell()` 把 `SIDEBAR_HTML`／`TOPBAR_HTML`／`BOTTOM_NAV_HTML`／`NOTIFICATION_MODAL_HTML` 注入對應 slot（`app.js:95-165`）
  - 側欄：首頁／探索／衣櫥／我的＋收合鈕（`sidebarToggle`，狀態存 `localStorage`）
  - 底部導覽（手機）：首頁／探索／＋（快速選單）／衣櫥／我的，圖示含 inline SVG
  - 頂欄：通知鈴＋未讀數徽章＋頭像（頭像 = 連結到自己的個人檔案）
  - `setActiveNav()` 依 `body[data-page]` 標示當前頁；若在 `profile.html?user=` 看別人，active 會標在「探索」（`app.js:87-93`）
- 限制：
  - 側欄與底部導覽都**沒有**「穿搭求救」入口（見 §12）
  - `setupSidebarToggle()` 需要 `localStorage`；若瀏覽器封鎖儲存，收合狀態不會保留（不會報錯）

### 4.2 首頁

- 用途：依「今天場合＋天氣」推薦一套穿搭，並讓使用者一路點進單品資訊或貼文。
- 目前支援：
  - 場合按鈕列（7 種場合）＋預設選「上班」（`app.js:217`）
  - 天氣：`loadWeather()` 呼叫 Open-Meteo（免金鑰），定位失敗或逾時 → 用台北座標（`app.js:197-213`）
  - 推薦：`getRecommendationItems()` 必須湊出 Tops／Bottoms／Shoes，再依天氣加權；`weatherScore()` 會把不適合天氣的單品扣分（`app.js:233-269`）
  - 「↻ 重新搭配」：`reroll = true` 時會避開畫面上現有的單品（`app.js:236`）
  - 點推薦的衣服 → 單品詳細資訊彈窗（照片、分類、顏色、風格、季節、版型、品牌、購買日期、穿著次數、上次穿著、備註＋加入穿搭／收藏／編輯／刪除）
  - Inspiration 卡片點擊或鍵盤 Enter/Space → 貼文快照彈窗（`app.js:220-224`）
  - SOS 卡片是 `<a href="sos.html">`，直接跳頁
- 限制：
  - 推薦計分含 `Math.random()`，因此「重新搭配」的結果不具決定性
  - 詳細資訊彈窗沿用衣櫥的彈窗，所以**首頁也會出現「編輯／刪除」按鈕**；從首頁刪除單品後，推薦區塊不會即時更新（需重新整理）
  - 首頁「最近加入衣櫥」區塊已移除，但程式仍留有渲染邏輯（見 §12）

### 4.3 探索頁

- 用途：瀏覽社群穿搭，並支援互動與跨頁跳轉。
- 目前支援：
  - 搜尋（比對帳號／caption／hashtag／wearing）＋「為你推薦 / 追蹤中」切換（`app.js:548-553`）
  - 貼文卡：愛心（`liked`）、留言數、收藏（`saved`＋`saved_count`），圖示改為 inline SVG
  - 點圖片／留言數 → Instagram 風格貼文彈窗（左圖右資訊，含 header／caption／hashtags／愛心留言收藏／留言列表／送出留言）
  - 點作者頭像或帳號 → `profile.html?user=@xxx`
  - 追蹤鈕：`setFollowingUser()` 更新 `followingUsers` 並同步該帳號所有貼文的 `following`；在「追蹤中」取消追蹤會即時移除該卡片（`app.js:585-603`）
- 限制：
  - 沒有分頁／無限捲動（一次渲染全部符合條件的貼文）
  - 追蹤狀態只存在本機 `localStorage`

### 4.4 通知（細項跳轉）

- 用途：讓通知不只是「跳到某一頁」，而是跳到該則互動的具體內容。
- 目前支援（`type` 欄位）：
  - `post-like`（獲得愛心）→ `explore.html?post=<postId>`
  - `comment-like`（留言被按愛心）→ `explore.html?post=<postId>&comment=<commentId>`
  - `comment-reply`（回覆了你的留言）→ 同上，開啟後標示該則留言
  - `post-comment`（貼文有新留言）→ 同上，標示該則留言
  - `post-published`（OOTD 已發布）→ `explore.html?post=<postId>`
  - `sos-hearts`／`sos-suggestion`（SOS 相關）→ `sos.html?sos=<sosId>`，滾動並標示該求救卡
  - `follow`（有人追蹤你）→ `profile.html?user=@xxx`
  - 點「帳號字樣」→ `profile.html?user=@xxx`（與整條通知的目標分開）
  - 舊資料／沒有結構化欄位的通知 → 退回原本的 `target.html`（不會壞）
- 限制：
  - 通知全部由前端模擬產生（自己操作後給自己通知），沒有後端事件或推播
  - 目前沒有「對留言按愛心」的 UI，`comment-like` 型別只有預設示範資料
  - 留言為平鋪結構（沒有巢狀回覆），所以「回覆了你的留言」是標示那一則留言本身

### 4.5 個人檔案頁

- 用途：看自己的或別人的檔案；對別人可以追蹤。
- 目前支援：
  - `?user=@xxx` → `getProfileByUsername()` 由該帳號的貼文推導名稱／縮寫／bio／統計（`app.js:312-337`）
  - 自己的檔案：顯示「編輯資料」「＋ 發布 OOTD」；別人的檔案：顯示「＋ 追蹤／已追蹤」（`app.js:366-375`）
  - 別人的檔案顯示「← 返回探索」（`app.js:809-821`，`profile.html:22`）
  - 貼文卡可互動並可點擊開啟貼文彈窗（`app.js:406-439`）
- 限制：
  - 追蹤狀態是本機模擬，沒有真實追蹤者清單
  - 統計數字（Hearts／幫助衣友／讚數）沒有「追蹤中／追蹤者」
  - **此頁歸屬範圍待確認**（見 §2 註記）


---

## 5. Data / State

- **資料來源：純前端 LocalStorage**，沒有 Supabase、沒有 API 讀寫、沒有後端。
- 頁面重新整理後狀態會保留；換瀏覽器／裝置、清快取或無痕模式則回到預設值。

| Storage | Key | 用途 |
|---|---|---|
| localStorage | `weary-app-state-v1` | 全部應用狀態（`items` / `profile` / `ootdPosts` / `notifications` / `sosPosts` / `outfitSuggestions` / `followingUsers`），見 `app.js:2`、`app.js:56` |
| localStorage | `ootie-sidebar-collapsed` | 側欄是否收合（`app.js:170`、`app.js:178`） |

- 讀取：`loadState()`（`app.js:48-53`）；讀不到或 JSON 解析失敗 → 回傳 `null`，各狀態變數改用預設 fixture（`defaultItems`／`defaultProfile`／`defaultOotdPosts`／`defaultNotifications`／`defaultSosPosts`）。
- 寫入：`saveState()`（`app.js:54-57`），任何狀態變更（按愛心、追蹤、發文、留言、通知…）都會呼叫；`localStorage` 不可用時以 try/catch 吞掉例外，功能不會中斷（但不會保存）。
- **外部網路呼叫**（非資料庫）：
  - `https://api.open-meteo.com`（天氣查詢，免 API Key，`app.js:199`）
  - `https://images.unsplash.com`（圖片 CDN，`app.js:3`、各 fixture 圖片）
  - 瀏覽器 Geolocation API（取座標，失敗時 fallback）

---

## 6. 主要 Data Model

> 只列與本功能（首頁／探索／導覽／跳轉）直接相關的欄位；型別為實際 JavaScript 值。

### items（衣櫥單品，`home.html` 推薦與明細彈窗會用到）

| 欄位 | 用途 |
|---|---|
| `id` | 單品識別碼（推薦圖片 `data-item-id`、明細彈窗查詢用） |
| `name` / `name_zh` | 名稱（顯示優先 `name_zh`） |
| `category` | Tops／Bottoms／Shoes…（推薦需湊齊分類） |
| `season` / `primary_color` | `weatherScore()` 天氣加權用 |
| `photo` | 圖片網址 |
| `favorite` / `hidden` | 收藏、是否隱藏（隱藏的不會被推薦） |
| `wear_count` / `last_worn` / `purchase_date` / `brand` / `notes` / `shape` / `style` | 明細彈窗顯示 |

### profile（使用者）

| 欄位 | 用途 |
|---|---|
| `username` | 帳號（跳轉比對基準，統一用 `@xxx`） |
| `initials` | 頭像縮寫 |
| `name` / `bio` | 個人檔案顯示 |
| `hearts` / `helped` / `likes` | 個人檔案統計（此分支未新增追蹤數） |
| `public_closet` | 衣櫥是否公開 |

### ootdPosts（社群貼文，探索頁與貼文彈窗核心）

| 欄位 | 用途 |
|---|---|
| `id` | 貼文識別碼（`?post=` 深層連結、`data-comment-post`） |
| `username` / `initials` | 作者（跳轉個人檔案、比對是否為本人） |
| `image` / `caption` / `hashtags[]` / `wearing[]` | 顯示與搜尋 |
| `likes` / `comments` | 計數 |
| `liked` / `saved` / `saved_count` | 互動狀態（`saved_count` 為本分支新增顯示） |
| `following` | 是否已追蹤該作者（探索「追蹤中」濾鏡、追蹤鈕文案） |
| `commentList[]` | 留言；每筆為 `{ id, user, text }`，`id` 供 `?comment=` 標示用 |

### notifications（通知）

| 欄位 | 用途 |
|---|---|
| `id` | 通知識別碼（列表項目 `data-notification-id`） |
| `text` / `time` / `read` | 顯示文字、時間、已讀狀態 |
| `target` | 目標頁面（`explore`／`sos`／`profile`／`closet`），沒有結構化欄位時的 fallback |
| `type` | 通知型別（`post-like`／`comment-like`／`comment-reply`／`post-comment`／`post-published`／`sos-hearts`／`sos-suggestion`／`follow`／`system`） |
| `postId` / `commentId` / `sosId` | 深層連結目標 |
| `userId` | 觸發者帳號（決定「帳號字樣」連結到哪個個人檔案） |

### sosPosts（求救貼文，首頁卡片與通知跳轉）

`id`、`username`、`initials`、`title`、`occasion`、`weather`、`when_label`、`vibes[]`、`closet_count`、`details`。

### 其他

- `outfitSuggestions`：`id`／`sos_id`／`user_id`／`item_ids[]`／`message`／`hearts`／`created_at`（求救頁用；本分支未修改其結構）。
- `followingUsers`：**本分支新增**，`string[]`（正規化 `@xxx`），追蹤關係的唯一來源（`app.js:67-69`）。
- `occasions`（前端常數）：`label`／`title`／`copy`／`picks[]`，首頁場合與推薦候選（`app.js:36-44`）。
- `weatherState`（記憶體）：`temperature`／`rain`／`label`／`icon`，供 `weatherScore()` 使用。

---

## 7. 主要程式檔案

| File | 用途 |
|---|---|
| `app.js` | 全部前端邏輯（單一檔案，874 行）：Shell 注入、導覽、首頁、探索、通知、個人檔案、衣櫥與求救頁邏輯 |
| `home.html` | 首頁頁面結構（場合列、推薦面板、天氣、SOS 列表、Inspiration 卡片）＋單品明細彈窗／貼文彈窗 |
| `explore.html` | 探索頁（搜尋、feed tabs、貼文格）＋ Instagram 風格貼文彈窗 |
| `profile.html` | 個人檔案頁（返回探索、追蹤鈕、統計、我的 OOTD、貼文彈窗） |
| `style.css` | 全站樣式（含側欄／底部導覽／彈窗／響應式斷點） |
| `closet.html` | 衣櫥頁（本分支僅新增 `page-brand` 與共用 slot） |
| `sos.html` | 求救頁（本分支僅新增 `page-brand` 與共用 slot） |

本分支**沒有新增或刪除任何檔案**；也沒有 `package.json`、測試檔、`supabase-*` 或 `.gitignore`。

---

## 8. 重要產品規則

（皆以目前程式碼為準）

1. **不能追蹤自己**：`isFollowingUser()`／`setFollowingUser()` 對自己的帳號一律回傳 `false`，不會寫入 `followingUsers`（`app.js:294-305`）。
2. **追蹤關係以帳號為單位**：`followingUsers` 是唯一來源；`setFollowingUser()` 會同步更新該帳號**所有貼文**的 `following`，讓探索頁「追蹤中」與追蹤鈕文案一致（`app.js:299-305`）。
3. **追蹤狀態初始化有相容邏輯**：若舊資料沒有 `followingUsers`，會由既有貼文的 `following` 推導一次；並且一律排除自己（`app.js:67-69`）。
4. **判斷「是否本人」一律用正規化帳號比對**（`normalizeUsername()`，自動補 `@`），不用字串直接比較。
5. **導覽 active 規則**：`profile.html?user=<非本人>` 時，active 標示在「探索」而不是「我的」（`app.js:87-93`）。
6. **快速選單跳轉規則**：若已在目標頁 → 直接開 modal；否則導向 `?quick=`，由 `applyQuickActionFromUrl()` 在載入後開啟（`app.js:738-744`、`755-763`）。重整帶 `?quick=` 的網址會再次開啟表單。
7. **通知點擊有兩種目的地**：點「整條」= 該互動的內容（貼文／留言／求救）；點「帳號字樣」= 該帳號的個人檔案。兩者以 `stopPropagation()` 區隔（`app.js:477-489`）。
8. **通知深層連結找不到目標時**：顯示 toast「找不到這則通知對應的貼文」，不會開出空白彈窗（`app.js:773`）。
9. **明細彈窗缺件防護**：`openDetail()` 找不到單品時顯示 toast 並中止，不丟錯（`app.js:710`）。
10. **貼文的 `following` 有兩種用途**：探索頁「追蹤中」濾鏡，以及自己發布的貼文預設 `following: true`（讓自己的貼文出現在追蹤中動態，`app.js:849`）。
11. **天氣與推薦的關係**：`weatherScore()` 會依溫度／降雨加權（例如炎熱時外套扣分、雨天深色鞋加分）；沒有天氣資料（`temperature === null`）時分數為 0，仍會挑出 3 件。
12. **reroll 不重複**：重新搭配時會避開畫面現有的單品（`app.js:236`）。

---

## 9. 測試結果

| Test | Result | 說明 |
|---|---|---|
| 專案內建測試（unit / integration） | **NONE** | 本分支沒有 `package.json`、測試框架或測試檔（`git ls-files` 只有 7 個前端檔） |
| JS 邏輯靜態驗證（本分支功能） | PASS | 以 macOS 內建 JavaScriptCore（`jsc`）載入 `app.js` 執行 5 支臨時腳本，共 **146 項斷言 ALL PASS**：通知跳轉 44、追蹤 39、首頁推薦明細 27、明細彈窗 CSS 25、頂欄頭像 11 |
| Browser 手動測試（Desktop） | **NOT TESTED** | 文件整理環境無法操作瀏覽器 GUI，未執行 |
| Browser 手動測試（Mobile / 響應式） | **NOT TESTED** | 同上 |
| Playwright / Vitest / E2E | **NOT TESTED** | 本分支沒有安裝任何測試工具 |
| 效能測試 | **NOT TESTED** | 未執行 |

> ⚠️ 關於上述「JS 邏輯靜態驗證」：該 5 支腳本是整理本文件時為核對程式行為而臨時撰寫、**放在專案外的暫存目錄，並未提交進 repo**，因此不算專案的測試套件，也無法在 CI 重跑。它們驗證的是邏輯與 CSS 結構（例如深層連結產生、追蹤狀態寫入、`object-fit` 與固定尺寸宣告），**不等於真實瀏覽器的視覺／互動驗證**。
> 建議接手者至少補做：桌機／手機各開 5 個頁面走一次 §3 流程。

---


## 10. 安全 / 資料注意事項

| 項目 | 本分支實際狀況 |
|---|---|
| `.env` | **不存在**（`find` 掃描無 `.env*`） |
| API Key / Secret / Token | **沒有**；程式碼用 `grep -iE 'supabase\|api[_-]?key\|secret\|token\|password\|bearer'` 掃描結果為 0 筆 |
| Supabase | **本分支完全沒有**（無 `supabase-client.js` / `supabase-adapter.js` / schema） |
| Local Fixture | **有**，所有資料都是 `app.js` 內的預設常數＋LocalStorage |
| CSV Export | **無** |
| Auth | **無**登入機制（`profile` 是寫死的單一使用者） |
| RLS | **無**（沒有後端） |
| 外部服務 | 僅 Open-Meteo（免金鑰）與 Unsplash 圖片 URL |
| `.gitignore` | ⚠️ **本分支沒有 `.gitignore`**（`origin/main`、`origin/Sandy` 有） |

**Do NOT commit（合併時請注意，雖然本分支目前沒有這些檔案）**

```text
.env
.env.local
*.local.js
*.csv
credentials*
*token*
*secret*
node_modules/
```

**已確認沒有被誤提交的敏感檔**：`git ls-files` 只有 `app.js`、`closet.html`、`explore.html`、`home.html`、`profile.html`、`sos.html`、`style.css` 共 7 個檔案；`git status --short` 乾淨。

---

## 11. 尚未完成

⏳ **Pending（與本模組直接相關，本分支尚未實作）**

- Supabase Remote Read — 探索貼文／個人檔案／通知仍是本機假資料
- Supabase Remote Write — 愛心、留言、追蹤、發布 OOTD／求救都只寫 LocalStorage
- 真實 Auth（登入／註冊／session），目前 `profile` 是寫死的 `@hayley`
- RLS / 權限規則（例：只能改自己的貼文）
- 通知後端事件（目前是前端自己發給自己；沒有推播／WebSocket）
- 多使用者即時同步（A 追蹤 B、B 發文後 A 不會看到）
- Production Deploy / build pipeline（本分支是純靜態檔，沒有打包設定）
- 「追蹤中／追蹤者」數量與追蹤者清單 UI
- 「對留言按愛心」的 UI（目前只有通知型別 `comment-like` 的示範資料）

> 註：`origin/main` 已有 Vue SPA＋Supabase 整合與測試，`origin/Sandy` 已有 `supabase-client.js`／`supabase-adapter.js`／`fixture-data.example.js`。上述 Pending 項目在那些分支可能已有進度，本分支需**與對應組員整合後再評估**（此處只描述本分支狀態，不主張他人進度）。

---

## 12. Known Issues / Limitations

**Prototype / Mock 限制**

| # | 項目 | 說明 |
|---|---|---|
| 1 | 資料只存在瀏覽器 | 全部狀態在 `localStorage`（`weary-app-state-v1`）；換裝置、清快取、無痕模式即回到預設 fixture，且無法跨裝置／跨使用者 |
| 2 | 通知是本機模擬 | 由自己的操作產生通知給自己；沒有後端事件。且打開通知面板就會「全部標記已讀」（`app.js:828`，初始版本即為如此） |
| 3 | 推薦含隨機成分 | `getRecommendationItems()` 使用 `Math.random()` 計分，reroll 結果不可預期、無法寫出決定性斷言 |
| 4 | 留言為平鋪結構 | `commentList` 沒有巢狀回覆；「回覆了你的留言」通知是標示那一則留言本身 |
| 5 | 追蹤者資訊不完整 | 有追蹤狀態（`followingUsers`）但個人檔案沒有「追蹤中／追蹤者」數字與清單 |

**Dead code / 尚未清理**

| # | 項目 | 說明 |
|---|---|---|
| 6 | 首頁「最近加入衣櫥」殘留 | `home.html` 已移除 `#recentRow`，但 `app.js:225-229` 仍保留渲染邏輯（因有 `if (recentRow)` 保護，目前不會執行）；`style.css` 仍留有 `.home-hero`（`:154`、`:310`）與 `.recent-row`（`:178`、`:310`）的無效選擇器 → 待確認是要清掉或復原該區塊 |
| 7 | 舊留言彈窗樣式殘留 | `.comment-modal` 只剩 CSS（`style.css:101-102`），沒有任何 HTML 或 JS 再使用（探索／個人頁已改用 `instagram-post-modal`）→ 可安全移除 |
| 8 | 無效選擇器 | `app.js:752` 的 `closeQuickActionMenu()` 會查詢 `.sidebar-add`，但目前的側欄／底部導覽都沒有這個 class（對不存在元素做 no-op，不影響功能）→ 可安全移除 |

**導覽 / 跳轉相關**

| # | 項目 | 說明 |
|---|---|---|
| 9 | 「穿搭求救」沒有導覽入口 | 側欄與底部導覽都沒有 `data-page="sos"`（初始版本側欄有）；`sos.html` 上不會有任何 active 高亮。目前只能從首頁 SOS 卡片或「＋」選單進入 → 是否刻意設計**待確認** |
| 10 | 首頁明細彈窗帶管理按鈕 | 沿用衣櫥彈窗，首頁也會出現「編輯／刪除」；從首頁刪除單品後，推薦區塊不會即時更新（需重新整理） |

**尚未驗證的 Edge Case**

| # | 項目 | 說明 |
|---|---|---|
| 11 | 改名後的歷史資料 | 若使用者在個人檔案改 `username`，舊通知／舊貼文內的 `@舊帳號` 不會自動更新，相關深層連結可能失效（**未測試**） |
| 12 | `renderExplore()` 的假設 | 依賴 `.feed-tab.active` 一定存在（`app.js:552`）；目前靠 `#ootdGrid` 的 early return 保護，若未來在沒有 feed tabs 的頁面呼叫會拋錯（**未測試**） |
| 13 | 側欄收合狀態 | 依賴 `localStorage`；若被封鎖則每次載入都回到展開，且不會提示（**未測試**） |

**待確認（不可視為已完成）**

| # | 項目 | 說明 |
|---|---|---|
| 14 | commit `a5702c9` 的自述 | 該 commit 訊息寫「尚有部分要修改，側欄&底部導覽的+」；後續 `e3e26e8` 已再調整首頁／底部導覽，**是否仍有未處理項目需本人確認** |
| 15 | 個人檔案頁功能歸屬 | `profile.html`（返回探索／追蹤鈕／貼文卡互動）在本分支有實作，但與最初自述負責範圍（首頁／探索／導覽／跳轉）重疊度需與負責個人檔案頁的組員確認 |

---


## 13. Merge 注意事項

### 13.1 本分支的 commit 歷程（作者皆為 Hayley）

| Commit | 內容 | 變更規模 |
|---|---|---|
| `1948cc6` | 新增探索頁與個人頁功能（愛心留言收藏列表＋點擊貼文跳轉） | app.js +192、explore.html、profile.html、style.css |
| `4229f9b` | 同上（後續修正） | app.js +25、profile.html、style.css |
| `19fa385` | 平台介面底部導覽與點擊圖示修改 | app.js +116、explore.html、profile.html、style.css |
| `a5702c9` | 首頁細節修改＋響應式介面功能鍵修改（訊息註記：尚有部分要修改，側欄＆底部導覽的＋） | 7 檔，+224／-64 |
| `e3e26e8` | 首頁＋底部導覽修改 | app.js、style.css |
| `0b1a602` | 首頁通知／個人檔案跳轉功能新增＋為你挑一套新增衣服資訊 | app.js +173、profile.html、style.css |

### 13.2 與初始 commit（`4f4dc7d`）相比，本分支修改的檔案

| File | 變更 |
|---|---|
| `app.js` | 355 行 → 874 行（+615／-88 級別的大幅修改） |
| `style.css` | +143（側欄／底部導覽／彈窗／響應式） |
| `home.html` | 17 行變更（頁首品牌、天氣、reroll、卡片可點、移除 `home-hero`／`recentRow`） |
| `profile.html` | 7 行變更（品牌、返回探索、追蹤鈕、貼文彈窗） |
| `explore.html` | 3 行變更（品牌、貼文彈窗改 `instagram-post-modal`） |
| `closet.html` | +1（`page-brand`） |
| `sos.html` | +1（`page-brand`） |
| 新增檔案 | **無** |
| 刪除檔案 | **無** |

> 對照 `origin/main` 時（`git diff --stat origin/main...Hayley`）會看到相同數字，因為 `origin/main` 已把舊版靜態檔移到 `legacy/main/`，git 會把本分支根目錄檔案與 `legacy/main/` 配對比較。

### 13.3 合併策略風險（重要）

1. **架構落差**：`origin/main` 目前是 **Vue 3 + Vite SPA（`src/`）＋ Vitest 測試**，舊版靜態檔被保存在 `legacy/main/`；本分支是**根目錄的純靜態版**。合併前必須先決定：把本分支 7 個檔案放進 `legacy/`（存檔），或把功能**移植**到 Vue 元件（`src/views/HomeView.vue`、`ExploreView.vue`、`src/components/layout/AppSidebar.vue`／`AppBottomNav.vue`／`AppTopbar.vue`、`src/components/modal/NotificationModal.vue` 等）。
2. **文字衝突**：本分支 7 個檔案在 `origin/main` 根目錄**不存在**（都被移到 `legacy/`），因此直接合併不會產生文字衝突，但會與 `legacy/` 內容重複。
3. **與 `origin/Sandy` 的衝突**：Sandy 分支同樣在**根目錄**有 `app.js`、`home.html`、`explore.html`、`closet.html`、`profile.html`、`sos.html`、`style.css` → 兩個分支若都合併到同一目標，同名檔案會衝突，需協調（建議先約定誰的版本進 `legacy/`、誰的進 `src/`）。
4. **高衝突風險檔案**：`app.js`（單檔 874 行，五個頁面的邏輯都在裡面）、`style.css`（全站樣式單檔）。任何一個頁面的修改都會動到這兩個檔案。
5. **不應 Merge 的 local-only 檔案**：**無**（本分支沒有 `.env`／`*.local.js`／`*.csv`／credentials）；但請注意本分支**沒有 `.gitignore`**，合併時不要順手把 `node_modules/`、`.env`、`*.csv` 帶進來。
6. **`README_Hayley.md`**：本文件是新增的**未追蹤**文件（尚未 `git add`／commit），僅文件不影響功能；如要保留請自行 commit。
7. **`main`／`Sandy` 上已存在但本分支沒有的檔案**（合併時不要被覆蓋或刪除）：`package.json`、`package-lock.json`、`.gitignore`、`README.md`、`README_SANDY.md`、`doc/`、`src/`、`legacy/`、`supabase-*.js`、`*.csv`、`fixture-data.example.js`。

### 13.4 Merge 時必須保留的行為

- Shell 注入機制與四種導覽（側欄／頂欄／底部導覽／通知視窗，`app.js:95-165`）
- 導覽 active 規則（`?user=` 時標在探索）
- 快速選單跨頁流程（`?quick=`）
- 探索頁 → 個人檔案的跳轉（`data-profile-user`）與追蹤狀態（`followingUsers`＋貼文 `following` 同步）
- 通知細項深層連結（`?post=`／`?comment=`／`?sos=`）與「點帳號 → 個人檔案」分流
- 首頁推薦與「點衣服看明細」（固定尺寸彈窗）
- 明細彈窗、貼文彈窗的缺件防護（toast 而非拋錯）

---

## 14. 開發狀態

| 層級 | 狀態 | 說明 |
|---|---|---|
| Frontend（HTML/CSS/JS） | ✅ | 5 頁靜態版已完成並可互動 |
| UI / UX | ✅ | 側欄收合、底部膠囊導覽、彈窗、hover/focus 回饋、響應式（1100／900／760px） |
| Local Logic | ✅ | 推薦、搜尋、追蹤、通知、留言、收藏等全部為本機邏輯 |
| Fixture（假資料） | ✅ | `app.js` 內建預設資料，可直接 demo |
| LocalStorage 持久化 | ✅ | `weary-app-state-v1`、`ootie-sidebar-collapsed` |
| Remote Read（Supabase） | ⏳ | 本分支未實作 |
| Remote Write（Supabase） | ⏳ | 本分支未實作 |
| Auth | ⏳ | 本分支未實作 |
| RLS | ⏳ | 本分支未實作 |
| Backend / API | ⏳ | 本分支未實作 |
| Notification Backend（事件／推播） | ⏳ | 本分支未實作（僅前端模擬） |
| Automated Tests（unit / E2E） | ⏳ | 本分支沒有測試套件（見 §9） |
| Production Deploy | ⏳ | 本分支未實作 |

---

*文件建立方式：實際閱讀本分支程式碼（`app.js` 874 行、5 個 HTML、`style.css`）＋ 檢查 `git status`／`git diff`／`git log`／各 commit 差異＋重跑臨時驗證腳本後撰寫；所有引用皆可對照 `file:line`。*

