# Sandy｜穿搭求救功能開發說明

> 本文件用來說明 Sandy 在本分支負責完成的功能範圍、目前完成狀態、測試結果，以及尚未包含的後端工作。
>
> 目的：方便團隊 Merge / Code Review / Handoff 時快速確認本分支實際做了什麼。

---

## 1. 本次負責範圍

本次主要負責 **「穿搭求救（SOS）」功能完善**，包含：

- 穿搭求救 UI / UX
- 衣友求救板
- 我發出的求救
- 公開衣物選擇與顯示
- 搭配建議（Suggestion）
- 留言（Comment）
- 喜歡（Like）
- 採用搭配（Adopt）
- 結束求救（Close）
- 多使用者 Fixture 模擬模式
- Supabase Remote Read（唯讀）整合
- Fixture 與 Supabase Remote 的隔離驗證

---

## 2. 穿搭求救核心流程

目前已完成以下流程：

```text
User A 發布 SOS
→ 選擇本次願意公開的衣物
→ SOS 出現在衣友求救板
→ User B 查看公開衣物
→ User B 提交搭配建議
→ User C 留言
→ User A 查看所有回覆
→ Like
→ Adopt
→ SOS 仍保持 OPEN
→ User A 明確按「結束這次求救」
→ SOS 變成 CLOSED
```

### 重要規則

- 自己可以看到自己的 OPEN SOS。
- 自己不能替自己的 SOS 提交 Suggestion。
- 同一位 responder 對同一筆 SOS 只能有一份有效 Suggestion。
- 多位 responder 可以同時回覆同一筆 SOS。
- Adopt 不會自動 Close SOS。
- 只有明確執行「結束這次求救」才會 OPEN → CLOSED。
- CLOSED SOS 不再出現在 Community Board，但仍保留在「我發出的求救／歷史紀錄」。
- Helper Count 以「不同 responder 人數」計算，不以 Suggestion 筆數計算。

---

## 3. 公開衣物規則

每筆 SOS 只公開該次使用者主動選擇的衣物。

資料欄位：

```text
closet_item_ids
```

規則：

- 不公開使用者完整衣櫥。
- Suggestion 只能使用該 SOS 合法公開的衣物。
- 公開衣物圖片使用完整顯示方式，不裁切衣服主體。
- 歷史 CLOSED SOS 若當時未保存 `closet_item_ids`，不會自行補造資料。
- 歷史資料會顯示：

```text
這是歷史求救，當時公開的衣物清單未被保存。
```

---

## 4. SOS 狀態

目前使用：

```text
OPEN
CLOSED
```

### OPEN

- 顯示於衣友求救板。
- 可以接受 Suggestion。
- 可以留言。
- Requester 可以 Like / Adopt。

### CLOSED

- 不再接受新的 Suggestion。
- 不再顯示於 Community Board。
- 仍保留歷史 Suggestion / Comment / Adopt 狀態。

---

## 5. 多使用者 Fixture 模擬模式

已建立 **Local Fixture Multi-user Simulation Mode**，用來在不修改 Supabase 正式資料的情況下測試多人互動。

目前 Fixture 初始資料：

```text
Profiles            6
Clothing Items      15
Historical SOS      6
Historical Suggestions 8
Fixture-only OPEN SOS  2
```

### 可模擬操作

- 切換 6 位使用者身份
- 不同使用者看到自己的衣櫥
- 不同使用者看到自己的 SOS
- User B 回覆 User A
- User C 留言 User A
- User A Like / Adopt
- User A Close SOS
- Reload 後狀態持續存在
- Reset Fixture 回到初始模擬資料

### Fixture LocalStorage

使用獨立的 storage key：

```text
ootie-fixture-world-v1
ootie-fixture-active-profile-v1
```

不會污染原本：

```text
weary-app-state-v1
```

---

## 6. Data Mode

目前資料模式區分為：

```text
LOCAL
FIXTURE
REMOTE_READ
```

### LOCAL

原本 Local Prototype。

### FIXTURE

多人模擬模式。

- 使用 local fixture data。
- 所有互動只寫入 localStorage。
- 不對 Supabase 發出 Remote Read / Write。

### REMOTE_READ

Supabase 唯讀資料模式。

- 可讀取 Supabase SOS 相關資料。
- Remote Write 尚未開啟。

---

## 7. Supabase Remote Read

已完成 SOS 相關 Remote Read 架構。

主要包含：

- Profiles mapping
- Clothing Items mapping
- SOS mapping
- Outfit Suggestions mapping
- 只依 SOS / Suggestion 所需要的 Clothing IDs 載入衣物
- `user_id` / `sender_id` 前後端欄位轉換
- `picked_suggestion_id` / `adopted_suggestion_id` 轉換
- `liked_suggestion_ids` → `requester_liked` 衍生

另外已修正 Remote Read 啟用判斷：

只有：

```text
enabled === true
+ Supabase URL 存在
+ Publishable Key 存在
```

才允許 Remote Read。

`enabled:false` 時不得因為 URL / Key 存在而自動連線 Supabase。

---

## 8. Fixture / Supabase 隔離測試

已使用 Playwright 實際監聽 Browser Network Request。

測試流程包含：

```text
頁面初始化
→ Fixture Identity Switcher
→ A / B / C 身份切換
→ Community Board
→ SOS Detail
→ Sent SOS
→ Community Board
→ Reload
```

結果：

```text
Fixture Mode Active: true

Supabase GET:     0
Supabase POST:    0
Supabase PATCH:   0
Supabase DELETE:  0

Unexpected Supabase Requests: 0
```

代表 Fixture Mode 與 Supabase Remote 已完成隔離。

---

## 9. Git / Local Data 安全處理

以下資料不應 Commit：

```text
.env
supabase-config.local.js
fixture-data.local.js
*.csv
```

Fixture 真實資料與 Supabase 匯出 CSV 只存在本機。

可提交的是 Fixture 結構範例：

```text
fixture-data.example.js
```

---

## 10. 本階段主要程式變更

本次功能主要涉及：

```text
.gitignore
app.js
closet.html
explore.html
fixture-data.example.js
home.html
profile.html
sos.html
style.css
supabase-adapter.js
```

實際 Merge 前仍以 `git diff` / `git status` 為最終依據。

---

## 11. 已完成測試

目前已驗證：

- [x] Fixture 初始資料正確
- [x] Profile / Clothing / SOS / Suggestion 關聯無 orphan
- [x] 6 筆歷史 SOS 保持 CLOSED
- [x] 歷史公開衣物不被偽造
- [x] Fixture OPEN SOS
- [x] 多使用者切換
- [x] Self Suggestion Guard
- [x] Cross-user Suggestion
- [x] Comment
- [x] Like
- [x] Adopt
- [x] Adopt 後仍保持 OPEN
- [x] Explicit Close
- [x] Community / Sent 狀態正確
- [x] Reload Persistence
- [x] Fixture Reset
- [x] Fixture 模式 Supabase GET = 0
- [x] Fixture 模式 Supabase Write = 0
- [x] `node --check`
- [x] `git diff --check`

---

## 12. 本階段完成狀態

```text
SOS UI / UX                 ✅ Complete
SOS Lifecycle               ✅ Complete
Supabase Remote Read        ✅ Complete
Fixture Multi-user Mode     ✅ Complete
Fixture Network Isolation   ✅ Verified
```

### 本分支目前可視為

```text
FIXTURE_MULTIUSER_READY
```

---

## 13. 尚未包含在本階段

以下功能 **尚未完成，不應被視為本次交付內容**：

```text
Real Supabase Auth Verification
RLS Policies
Remote Write
Real Multi-user Backend E2E
Production Deployment
```

也就是說：

> 本階段完成的是「可操作、可多人模擬、可安全測試的穿搭求救功能」。
>
> 真正多人登入後直接寫入 Supabase 的正式 Backend Flow，仍屬後續階段。

---

## 14. Merge 說明

此分支可提供群組進行 Merge / Pull Request Review。

Merge 時請特別確認：

1. 不包含 `.env`。
2. 不包含 `supabase-config.local.js`。
3. 不包含 `fixture-data.local.js`。
4. 不包含 Supabase 匯出的 CSV。
5. 不把本階段誤標為「Backend Complete」。
6. Fixture 模式需保留，方便後續 Regression Test（回歸測試）。

---

## 15. 建議 Commit / PR 說明

### Commit

```text
feat: complete SOS multi-user fixture simulation
```

### PR / Merge Title

```text
穿搭求救｜SOS Fixture Multi-user Simulation
```

### Summary

```text
完成穿搭求救 UI/UX、SOS lifecycle、Supabase Remote Read，
並加入 6 人 Fixture 多人模擬、身份切換、Suggestion、Comment、
Like、Adopt、Close 與 localStorage persistence。
Fixture Mode 已驗證對 Supabase GET/POST/PATCH/DELETE 全部為 0。
Auth / RLS / Remote Write 不包含於本次 Merge。
```
