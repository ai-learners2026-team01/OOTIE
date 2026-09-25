# OOTie · 數位衣櫥與穿搭社群 Web 應用

OOTie 是一個極具質感且功能豐富的數位衣櫥與時尚穿搭社群應用程式。幫助使用者記錄並管理個人衣櫥單品、取得每日情境穿搭靈感、參與 OOTD 社群分享，並透過 Style SOS 由其他衣友提供個人化的單品搭配建議。

本專案已重構為現代化的 **Vue 3 + Pinia + Vue Router + Vite** 架構，並具備完整的 **Vitest + Happy DOM** 單元與整合測試套件。

---

## 🚀 快速開始 (Getting Started)

### 1. 安裝依賴 (Install Dependencies)

在專案根目錄下執行：

```bash
npm install
```

### 2. 啟動開發測試伺服器 (Start Development Server)

執行以下命令啟動 Vite 開發伺服器（支援熱模組替換 HMR）：

```bash
npm run dev
```

啟動後，終端機會顯示測試伺服器網址（通常為 `http://localhost:5173/`），請在瀏覽器中開啟即可進行測試與開發。

### 3. 生產環境打包與預覽 (Build & Preview)

* **打包編譯**：
  ```bash
  npm run build
  ```
* **本地預覽生產打包檔**：
  ```bash
  npm run preview
  ```

---

## 🧪 測試說明 (Testing Guide)

本專案使用 **Vitest + Happy DOM + @vue/test-utils** 建立整合測試機制，為後續功能擴充與重構提供品質與穩定性保障。

### 執行測試命令

* **執行單次完整測試**：
  ```bash
  npm test
  ```
* **啟動測試 Watch 模式** (開發時實時監聽並 re-run 測試)：
  ```bash
  npm run test:watch
  ```

### 測試覆蓋範圍與架構

```
src/
├── stores/
│   └── __tests__/
│       ├── appStore.spec.js     # 測試全域 Toast、通知與 Modal 顯隱狀態
│       ├── closetStore.spec.js  # 測試單品 CRUD、多條件篩選與收藏切換
│       ├── ootdStore.spec.js    # 測試 OOTD 發布、點讚 Hearts、收藏與留言
│       └── sosStore.spec.js     # 測試 SOS 求救發布與搭配建議提交
└── views/
    └── __tests__/
        ├── HomeView.spec.js     # 測試首頁情境提案按鈕與推薦單品即時更新
        └── ClosetView.spec.js   # 測試衣櫥卡片渲染、分類標籤切換與 Modal 觸發
```

#### 測試案例摘要

| 測試模組 | 測試內容與驗證重點 |
| :--- | :--- |
| **App Store** | 驗證預設狀態初始化、Toast 訊息觸發與 2.2 秒自動隱藏、全域通知新增與閱讀標記、Modal 開關狀態控制。 |
| **Closet Store** | 驗證依分類 (Tops/Shoes 等)、顏色、風格、關鍵字過濾單品，測試單品新增、更新、刪除確認 dialog 及收藏切換。 |
| **OOTD Store** | 驗證推薦/追蹤牆切換、搜尋過濾、貼文點讚 Hearts 統計、收藏切換、留言新增與發布 OOTD (Hashtags 格式化)。 |
| **SOS Store** | 驗證穿搭求救發布、呈現風格標籤選取、單品組合建議提交與個人幫助次數 (helped) 統計。 |
| **HomeView** | 整合測試：驗證首頁畫面渲染、點擊「上班/約會/旅行/隨性」情境按鈕實時更換推薦標題與挑選單品。 |
| **ClosetView** | 整合測試：驗證單品清單網格卡片渲染、點擊分類過濾、點擊單品卡片與「新增單品」開啟對應 Modal 視窗。 |

---

## 📂 專案目錄結構 (Project Structure)

```
OOTIE/
├── src/                      # Vue 3 應用主要程式碼
│   ├── assets/               # 靜態資源與全域樣式 (main.css)
│   ├── components/           # Vue 元件 (layout, modal, ui)
│   ├── constants/            # 全域對照常數與預設資料
│   ├── router/               # Vue Router 4 頁面路由設定
│   ├── stores/               # Pinia 狀態管理 Stores 與測試 (__tests__)
│   └── views/                # 頁面主視圖與整合測試 (__tests__)
├── legacy/                   # 舊版原生程式碼歸檔區
│   └── main/                 # 舊版 app.js, style.css 及 HTML 檔案
├── index.html                # 入口 HTML
├── vite.config.js            # Vite & Vitest 設定檔
└── package.json              # 專案套件配置
```

---

## ✨ 核心功能簡介 (Features)

1. **數位衣櫥 (Digital Closet)**：新增/編輯單品、上傳照片、色彩與風格條件篩選、收藏與備註。
2. **情境穿搭推薦 (Home)**：根據上班、約會、旅行、隨性等不同場合，實時挑選適合的搭配方案。
3. **OOTD 穿搭社群 (Explore)**：瀏覽衣友穿搭分享、發布 OOTD、按讚 Hearts、收藏與留言。
4. **Style SOS 穿搭求救 (Sos)**：發布穿搭難題，其他衣友可直接選擇求救者衣櫥內的單品進行組合建議。
5. **個人檔案與數據 (Profile)**：展現發布紀錄、統計數據與公開/私人衣櫥權限設定。
