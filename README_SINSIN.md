# 劉欣玫｜功能開發交接 README

> 文件基準：本地 `sinsin` 分支 HEAD `c3d9fcf`（`ootd3`）。目前 HEAD 落後 `origin/sinsin` 1 個提交；本文件不包含該遠端尚未同步的提交。

## 1. 負責範圍

- 負責功能：個人頁面（`profile.html`）。
- 主要目標：提供個人資料展示與編輯、衣櫥公開設定，以及目前使用者 OOTD（每日穿搭紀錄）的管理入口。
- 使用者可以：查看個人資訊與統計、編輯姓名／帳號／頭像／簡介、切換衣櫥公開狀態、查看自己的 OOTD，並新增、編輯、刪除或分享 OOTD。

## 2. 本次完成內容

| 功能 | 狀態 | 說明 |
|---|---|---|
| 個人資料展示 | ✅ Complete | 顯示姓名、帳號、簡介、頭像縮寫或圖片，以及 Hearts、幫助衣友、貼文讚數三項統計。 |
| 個人資料編輯 | ✅ Complete | 可編輯姓名、帳號 ID、頭像縮寫與個人簡介；帳號未輸入 `@` 時會自動補上。 |
| 頭像上傳與裁切 | ✅ Complete | 支援 JPEG、PNG、WebP；可預覽、縮放及上下左右調整，儲存時產生 320x320 JPEG Data URL。 |
| 公開衣櫥切換 | ✅ Complete | 可切換 `public_closet`，目前透過 `localStorage` 保存。 |
| 個人 OOTD 顯示 | 🟡 Partial | 前端會從 Supabase `ootie_ootd_posts` 讀取目前使用者資料並依建立時間排序；是否能正常使用取決於遠端表格已存在且權限設定正確。 |
| OOTD 新增／編輯／刪除 | 🟡 Partial | `app.js` 已有 Supabase Remote Write 與刪除邏輯，但沒有登入驗證，且本分支 SQL 沒有建立 `ootie_ootd_posts` 表。 |
| OOTD 分享連結 | ✅ Complete | 產生 `ootd.html?id=<postId>` 連結；支援 Web Share、Clipboard，及傳統複製 fallback。 |

## 3. 使用者流程

一般個人頁面流程：

使用者
↓
進入 `profile.html`
↓
讀取 localStorage 的個人資料，並嘗試從 Supabase 讀取頭像與 OOTD
↓
查看個人資訊、統計與自己的 OOTD
↓
編輯個人資料／切換公開衣櫥／管理 OOTD
↓
看到前端更新；遠端 OOTD 操作需 Supabase 回應成功

新增 OOTD 流程：

使用者
↓
點擊「發布 OOTD」
↓
上傳照片、輸入 Caption／Hashtags、選擇衣櫥單品
↓
寫入 Supabase `ootie_ootd_posts`
↓
更新個人 OOTD 清單並顯示通知

## 4. 主要功能說明

### 4.1 個人資料編輯

用途：更新個人頁面上可見的基本資料。

目前支援：

- 編輯姓名、帳號 ID、頭像縮寫與個人簡介。
- 頭像檔案預覽、縮放與方向調整。
- 儲存後更新頁面頭像與頂部導覽頭像。
- 個人資料主要保存於 `localStorage`；頭像另嘗試 upsert 到 Supabase `profiles`。

限制：

- 只有 `avatar_url` 會寫入 Supabase `profiles`；姓名、帳號、簡介、統計與 `public_closet` 沒有對應的遠端寫入。
- 儲存的頭像是 Base64 JPEG Data URL，可能增加 localStorage 與資料庫欄位大小。

### 4.2 公開衣櫥設定

用途：讓使用者在個人頁面切換衣櫥公開狀態。

目前支援：

- 以按鈕切換 `public_closet`。
- 顯示開啟／關閉的視覺狀態與提示訊息。
- 狀態保存於 localStorage。

限制：

- 程式目前沒有以 `public_closet` 阻擋或控制其他頁面的資料讀取，這是設定狀態，不是完整的存取控制。

### 4.3 個人 OOTD 管理

用途：管理目前使用者發布的穿搭紀錄。

目前支援：

- 以 `CURRENT_USER_ID` 查詢目前使用者的 OOTD。
- 顯示照片、Caption、Hashtags、穿搭單品與日期。
- 新增、編輯、刪除 OOTD；刪除前會要求確認。
- 分享單篇 OOTD 連結。

限制：

- 沒有 Supabase client、遠端表格或權限設定時，新增／編輯／刪除會失敗並顯示錯誤提示。
- OOTD 照片目前是前端讀取檔案後形成的 Data URL，沒有獨立 Storage upload 流程。
- `profile.html` 使用的是前端可見的 publishable key，不能視為秘密金鑰。

## 5. Data / State

### LocalStorage

Storage key：`weary-app-state-v1`

保存的主要 state：

- `items`
- `profile`
- `ootdPosts`
- `notifications`
- `sosPosts`
- `outfitSuggestions`

個人頁面直接使用的 `profile` 欄位包含 `name`、`username`、`initials`、`avatar_url`、`bio`、`hearts`、`helped`、`likes`、`public_closet`。

### Supabase Remote Read

- `profiles`：以 `id = CURRENT_USER_ID` 讀取 `avatar_url`。
- `ootie_ootd_posts`：依 `user_id = CURRENT_USER_ID` 讀取 OOTD，按 `created_at` 遞減排序。

### Supabase Remote Write

- `profiles.upsert`：儲存目前使用者的 `avatar_url`。
- `ootie_ootd_posts.insert`：新增 OOTD。
- `ootie_ootd_posts.update`：依 `id` 與 `user_id` 編輯 OOTD。
- `ootie_ootd_posts.delete`：依 `id` 與 `user_id` 刪除 OOTD。

### Fixture

`ootd_posts.csv` 是目前分支中的 OOTD 範例資料檔；目前 `app.js` 沒有直接讀取它，不能視為個人頁面的即時資料來源。

## 6. 主要 Data Model

### Profile

- `id`：目前程式在 local state 中使用的 profile 識別值。
- `user_id`：預設 profile 的使用者識別值。
- `name`：顯示名稱。
- `username`：帳號 ID，顯示時以 `@` 開頭。
- `initials`：沒有頭像圖片時顯示的頭像縮寫。
- `avatar_url`：頭像圖片 URL 或 Base64 Data URL。
- `bio`：個人簡介。
- `hearts`：收到的 Hearts 統計。
- `helped`：幫助衣友統計。
- `likes`：貼文獲得讚數統計。
- `public_closet`：衣櫥公開設定；目前為 local state。

### OOTD Post

- `id`：OOTD 識別值。
- `user_id`：發布者識別值。
- `image`：穿搭照片 URL 或 Data URL。
- `caption`：穿搭說明。
- `item_ids`：標註的衣櫥單品 ID 陣列。
- `wearing`：顯示用的穿搭單品名稱陣列。
- `hashtags`：標籤陣列。
- `likes`：讚數。
- `comments`：留言數。
- `created_at`：建立時間。

## 7. 主要程式檔案

| File | 用途 |
|---|---|
| `profile.html` | 個人頁面 UI、編輯資料表單、頭像裁切控制、OOTD 表單與 Supabase client 初始化。 |
| `app.js` | 共用 state、個人頁面 render、localStorage、頭像處理、Supabase profile／OOTD 讀寫與事件綁定。 |
| `style.css` | 個人頁面、編輯視窗、頭像預覽／裁切控制與 OOTD 卡片的樣式及 RWD。 |
| `supabase-schema.sql` | Supabase development schema 與暫時性 RLS（Row Level Security，資料列層級安全性）政策。 |

本分支相對 `main` 另修改或新增 `explore.html`、`ootd.html`、`ootd_posts.csv`；它們屬於同一分支的 OOTD／探索範圍，但不全部是本次個人頁面負責範圍。

## 8. 重要產品規則

- `CURRENT_USER_ID` 優先取 URL 的 `user_id` query parameter，沒有時使用固定預設 UUID。
- 個人 OOTD 只顯示 `user_id` 或 username 符合目前 profile 的資料。
- OOTD 編輯與刪除要求同時符合 post `id` 與 `user_id`。
- 新增 OOTD 必須先上傳照片；Hashtag 沒有 `#` 時會由前端自動補上。
- 頭像檔案限制為 JPEG、PNG、WebP；裁切結果固定輸出 320x320 JPEG。
- `public_closet` 的切換目前不會自動改變 Supabase RLS 或其他頁面的實際可見資料。
- Supabase SQL 中的 development policies 使用公開讀寫條件，不適合直接作為 production 權限模型。

## 9. 測試結果

目前專案沒有測試檔、`package.json`、Playwright 設定或其他自動化測試設定。

| Test | Result |
|---|---|
| `git diff --check main...HEAD` | PASS |
| JavaScript `node --check app.js` | NOT TESTED：目前環境找不到 `node` |
| Desktop UI | NOT TESTED |
| Mobile UI | NOT TESTED |
| Playwright | NOT TESTED |
| Supabase integration | NOT TESTED：未提供可驗證的遠端環境與測試帳號 |

## 10. 安全 / 資料注意事項

- `profile.html` 內的 Supabase URL 與 publishable key 會暴露在前端；這不是秘密金鑰，但資料庫權限必須由 RLS 控制。
- `supabase-schema.sql` 的 development policies 對 `profiles`、`posts` 開放公開讀寫，並對既有 `ootie_ootd_posts` 開放 update/delete；上線前必須改成與 Auth 使用者綁定的 `auth.uid()` 規則。
- 本分支沒有 `.env`、`*.local.js`、credentials、tokens 或 secrets 檔案。
- `ootd_posts.csv` 是已存在且被分支新增的 fixture，內含使用者 UUID 與範例圖片 URL；若資料不應進入版本庫，需由團隊另行決定，不可誤當成 production data。
- SQL 檔只建立 `profiles` 與 `posts`，並假設 `ootie_ootd_posts` 已存在；執行前需確認遠端資料庫 schema。

## 11. 尚未完成

⏳ Pending

- 真實使用者 Auth 與個人資料擁有者驗證。
- `public_closet` 對實際資料讀取的權限控制。
- `ootie_ootd_posts` 的正式建表 migration（目前 SQL 僅假設該表存在）。
- 正式的 Storage 圖片上傳與圖片大小／格式後端驗證。
- Production 級 RLS；目前政策是 development-only。
- Desktop、Mobile、Playwright 與 Supabase 整合測試。

## 12. Known Issues / Limitations

- `profile.html` 依賴遠端 CDN 載入 Supabase SDK；離線時無法進行遠端 OOTD 操作。
- localStorage 解析失敗時會回到預設資料，可能造成使用者以為資料消失。
- 個人統計數字來自 local state／預設值，沒有從 Supabase 即時聚合。
- 頭像與 OOTD 照片以 Data URL 保存，可能造成 localStorage 或資料庫 payload 過大。
- `supabase-schema.sql` 的 `posts` 與前端實際使用的 `ootie_ootd_posts` 名稱不一致。
- 尚未驗證 URL `user_id` 任意切換、超大圖片、無效圖片來源及遠端權限拒絕等 edge cases。

## 13. Merge 注意事項

- 個人頁面主要修改檔案是 `profile.html`、`app.js`、`style.css`；三者都可能與其他組員的共用頁面功能產生 conflict。
- `app.js` 同時包含首頁、衣櫥、探索、SOS 與 OOTD 共用邏輯；合併時不可只保留個人頁面片段而遺失其他頁面事件綁定。
- `style.css` 是全站共用樣式；保留 profile、avatar、OOTD 相關 class 及手機版 media query。
- `supabase-schema.sql` 只應在確認遠端 schema 後執行；不要把 development-only RLS 視為 production 權限方案。
- `ootd_posts.csv` 是 fixture，不是個人頁面的必要 runtime 資料來源；是否合併應依團隊資料管理決策處理。
- 本地 HEAD 尚未包含 `origin/sinsin` 的 `390f854 Update OOTIE app`；合併前需另外檢閱該提交，不能把它默認算入本次完成內容。

## 14. 開發狀態

| Area | Status |
|---|---|
| Frontend | ✅ |
| UI / UX | ✅ |
| Local Profile Logic | ✅ |
| LocalStorage | ✅ |
| Avatar Crop | ✅ |
| Supabase Profile Avatar Read / Write | 🟡 |
| Supabase OOTD Read | 🟡 |
| Supabase OOTD Remote Write | 🟡 |
| Auth | ⏳ |
| RLS Production Policy | ⏳ |
| Production Deploy | ⏳ |

## 15. README Consistency Review

| README 項目 | 實際程式 | 結果 | 證據 |
|---|---|---|---|
| 個人資料編輯 | `profileEditForm` submit handler | PASS | `app.js`：更新 `profile` 並呼叫 `saveState()`。 |
| 頭像裁切 | `generateAvatarCroppedDataUrl`、`avatarZoom`、`data-avatar-move` | PASS | `app.js`：canvas 輸出 320x320 JPEG。 |
| 公開衣櫥切換 | `publicClosetToggle` click handler | PASS | `app.js`：切換 `profile.public_closet` 並保存。 |
| 個人 OOTD 讀取 | `loadProfilePostsFromSupabase` | NEEDS_VERIFICATION | `app.js`：查詢 `ootie_ootd_posts`；遠端表格與權限未由本地測試驗證。 |
| OOTD 新增／編輯／刪除 | `ootdForm` submit、`deleteOotd` | NEEDS_VERIFICATION | `app.js`：存在 insert、update、delete 呼叫；SQL 未建立 `ootie_ootd_posts`。 |
| OOTD 分享 | `shareOotd` | PASS | `app.js`：Web Share、Clipboard 與 fallback。 |
| localStorage state | `STORAGE_KEY`、`saveState` | PASS | `app.js`：key 為 `weary-app-state-v1`。 |
| 自動化測試 | 專案檔案盤點 | PASS | 沒有測試檔、`package.json` 或 Playwright 設定，因此 README 標記 NOT TESTED。 |

### 特別檢查

README 描述錯誤：

- NONE（以本地 HEAD 的實際程式為準；遠端 Supabase 行為仍標為 NEEDS_VERIFICATION）。

README 遺漏的已完成內容：

- NONE，目前已列出個人頁面入口、編輯、頭像、公開設定、OOTD 顯示與管理、資料來源及限制。

README 寫了但程式不存在：

- NONE。

README 誤把其他組員功能算進來：

- NONE；分支中的探索、SOS、衣櫥等共用邏輯只在合併注意事項中被標示為非本次個人頁面範圍。

Modified Files Difference：

- `app.js`：修改。
- `explore.html`：修改，非個人頁面主要 UI。
- `ootd.html`：新增，屬 OOTD 分享頁。
- `ootd_posts.csv`：新增，fixture。
- `profile.html`：修改，個人頁面入口與表單。
- `style.css`：修改，共用與個人頁面樣式。
- `supabase-schema.sql`：新增，Supabase development schema／政策。
- `README_SINSIN.md`：本次新增的交接文件，不屬原始功能提交。

## 文件結論

目前可確認的是前端個人頁面與 localStorage 流程，以及 Supabase 操作程式碼已存在；遠端資料表、權限、Auth 與跨裝置資料一致性尚未由本地測試證明。後續合併前請先確認 `origin/sinsin` 的未同步提交與 `ootie_ootd_posts` 遠端 schema。
