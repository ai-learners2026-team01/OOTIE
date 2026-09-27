# SOS 模組交接

負責人：Sandy。前端狀態：**FEATURE FREEZE**。本次 SOS 測試 58/58、Home／Closet／Profile 回歸 11/11、Build，以及 1440×900、1024×768、768×1024、390×844 響應式檢查皆通過。後續前端改動以 Bug 修復及已驗證的後端整合為限。

## SOS 負責範圍

- `src/views/SosView.vue`：衣友求救板、我發出的求救、卡片及 SOS 對話框入口。
- `src/components/modal/SosFormModal.vue`、`SosDetailModal.vue`、`SuggestionModal.vue`、`SosCloseConfirmModal.vue`：發布、詳情、搭配建議與結束求救。
- `src/features/sos/*`：SOS 規則、身份邊界、Fixture、遠端讀取轉換、穿搭拼貼、留言、通知及模式工具。
- `src/stores/sos.js`：SOS 狀態及 Action Layer Guard。
- `src/stores/__tests__/sos*.spec.js`、`tests/sos/*`：SOS 回歸與本機瀏覽器檢查。

## 共用依賴

- `src/stores/app.js` 與全站 Auth／Profile：正式 currentProfile 與全站對話框狀態。SOS 不建立第二套正式帳號。
- 全站衣物資料：SOS 只消費既有 Clothing Item，顯示前同時檢查 `closet_item_ids` 及 `item.owner_id === SOS sender_id`。
- `src/services/supabase.js`：沿用既有 Supabase Client 與讀取函式，不建立第二套 Client。
- `src/App.vue`、Router、Navigation、Notifications、`src/assets/main.css`：共用整合點，修改時應先與負責同學協調並跑跨模組回歸。

## 後端待辦邊界

Shared Auth → currentUser → currentProfile、`auth.users.id` → `ootie_profiles.user_id` → `ootie_profiles.id` 對應、RLS、Remote Write、真實 A/B 帳號 E2E，以及 SOS Comment 遠端 Schema，仍屬共用後端工作。正式 SOS 寫入在驗證完成前維持停用。

## 本次呈現規則

- 求救需求只使用現有 `when_label`、`occasion`、`weather`、`vibes`、`details`；沒有新增資料庫欄位。
- 穿搭拼貼只顯示該筆 SOS 公開範圍內、且被 Suggestion `item_ids` 指定的衣物。`outfitBoard.js` 僅將現有 category 對應為畫面分類，不改資料庫值。有效 `photo` 優先，缺圖或壞圖才顯示中性備援。
- Adopt 只記錄採用，SOS 繼續 OPEN；只有明確 Close 才會變 CLOSED。CLOSED 歷史可讀取，未保存的 `closet_item_ids` 不會被補造。
- 篩選只使用現有 Local Like、SOS 的 `liked_suggestion_ids`（若有）及 adopted suggestion；沒有新增後端狀態。

## 未來候選，尚未實作

- `anchor_item_ids`／必搭單品：須先確認產品與後端模型。
- 圖片處理流程：Upload → Background Removal → Trim Empty Area → Normalize Canvas → Center Garment → Outfit Board。本次沒有串接 AI 或修改上傳流程。
- 指定衣友求救：需另外做產品決策。
- Real Auth／RLS／Remote Write 整合，包含 SOS Comment 遠端保存。
