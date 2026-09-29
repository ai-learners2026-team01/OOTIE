# SOS 驗收

Owner: Sandy。套件使用專案現有版本，不需 `npm install`。

## Store / Component

```powershell
node node_modules/vitest/vitest.mjs run src/stores/__tests__/sosStore.spec.js src/stores/__tests__/sosWorkflow.spec.js src/stores/__tests__/sosUi.spec.js
```

## 整站離線回歸

```powershell
node node_modules/vitest/vitest.mjs run --config tests/sos/vitest.regression.config.js
```

`offline.setup.js` 攔截 fetch 並回傳離線錯誤，避免既有 OOTD、Profile、Stats 測試寫入真實 Supabase。這些離線錯誤訊息是刻意測試條件，不能解讀為正式後端已驗證。

## 瀏覽器流程

先執行本機 Vite（範例 port 5192）。使用已安裝的 Playwright 與 Edge：

```powershell
$env:PLAYWRIGHT_MODULE_PATH = '<既有 Playwright 套件的絕對路徑>'
$env:SOS_TEST_URL = 'http://127.0.0.1:5192'
node tests/sos/browser-flow.mjs
```

也可以省略 `PLAYWRIGHT_MODULE_PATH`，使用 Node 已可解析的 `playwright`；不要為此擅自新增依賴。

- `SOS_BROWSER_CHANNEL` 預設 `msedge`。
- `SOS_ARTIFACT_DIR` 預設 `tests/sos/results.local`，已被專案 `*.local` 規則忽略。
- Fixture 先計數所有 Supabase 請求，再阻擋外部網路；不是因阻擋而把計數設為零。
- 一般網站的後端回應使用測試資料，僅驗證前端導覽／UI 合約。
- 測試使用全新暫時瀏覽器 context，不清除使用者實際瀏覽器資料。
- 瀏覽器流程涵蓋三角色、發布、建議、留言、讚、採納、結束、通知、reload、reset、390px、鍵盤、正式 SOS 唯讀邊界與主要頁面導覽。Closet → SOS 的單件預選另由 `sosUi.spec.js` 驗證；正式寫入停用時不會開啟發布表單。
- 建置版本可用 `vite preview` 換 port，再指定 `SOS_TEST_URL` 驗證；不可部署到外部服務。

## 仍須正式後端驗收

跨裝置／真實帳號收件、RLS、FK、唯一約束、並行寫入與遠端失敗重試。本測試不授權操作資料庫。
