# OOTie 最終交付文件

## 1. 專案概述

OOTie 是一個以「訪客可瀏覽、登入後才能使用私有功能」為核心體驗的穿搭管理與社群型產品。

目前產品方向為：
- 公開瀏覽不需登入
- 個人衣櫥、發文、收藏、求救等私有功能需登入
- 登入後可進行個人資料編輯與衣櫥管理
- 未來可延伸到 AI 穿搭推薦與個人化建議

---

## 2. 目前狀態

### 已完成
- Guest-first UX 設計
- Auth modal 與登入 / 註冊切換
- Supabase config 讀取與 runtime fallback
- session sync
- profile / items 基礎資料結構準備
- SQL schema
- RLS 設定
- 部署說明文件

### 仍需最後驗證
- 專案在本機/正式環境中實際執行
- 執行 SQL 成功
- Email Auth 開啟
- 真實帳號登入成功
- profile 寫入成功
- items 寫入成功

---

## 3. 技術架構

### 前端
- HTML
- CSS
- JavaScript
- 本地 localStorage 狀態管理

### 後端 / 資料庫
- Supabase
- Auth
- Postgres
- Row Level Security

### 核心資料表
- profiles
- items

---

## 4. 產品邏輯

### 訪客模式
- 使用者可瀏覽首頁、探索、公開內容
- 不需登入即可瀏覽

### 私有功能
- 編輯個人資料
- 新增衣櫥單品
- 收藏與互動
- 發布 OOTD
- SOS 穿搭求救

這些功能在未登入時會彈出登入 / 註冊 modal，完成後再繼續執行原本動作。

---

## 5. Supabase 設定

### 需要的設定值
- Project URL
- anon key

### 已準備的前端讀取方式
```js
window.OOTIE_SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
window.OOTIE_SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

也可存入 localStorage：

```js
localStorage.setItem('OOTIE_SUPABASE_URL', 'https://YOUR_PROJECT.supabase.co');
localStorage.setItem('OOTIE_SUPABASE_ANON_KEY', 'YOUR_ANON_KEY');
```

---

## 6. 資料庫設計

### profiles
- id
- user_id
- email
- full_name
- username
- initials
- bio
- avatar_url
- hearts
- helped
- likes
- public_closet
- created_at
- updated_at

### items
- id
- user_id
- name
- name_zh
- brand
- category
- shape
- primary_color
- secondary_color
- color_hex
- style
- season
- photo
- wear_count
- last_worn
- purchase_date
- favorite
- hidden
- notes
- created_at
- updated_at

---

## 7. SQL 建立

請直接執行 [supabase/schema.sql](supabase/schema.sql) 內容。

此 SQL 會建立：
- profiles 表
- items 表
- RLS Policy
- updated_at trigger

---

## 8. Auth 設定

在 Supabase Dashboard 中：

1. 進入 Authentication
2. 進入 Providers
3. 開啟 Email
4. 視需求啟用 email confirmation

---

## 9. 最終驗證清單

### 前端驗證
- [ ] 打開 profile 頁
- [ ] 點擊 Edit Profile
- [ ] 未登入時會跳出 auth modal
- [ ] 登入 / 註冊切換正常
- [ ] 按鈕文字與標題同步

### Auth 驗證
- [ ] 註冊成功
- [ ] 登入成功
- [ ] 登出成功
- [ ] session 狀態更新成功

### 資料驗證
- [ ] profiles 可寫入
- [ ] items 可寫入
- [ ] 使用者只能看自己的資料
- [ ] 其他使用者資料被 RLS 擋住

---

## 10. 交付判準

若以下全部通過，代表交付完成：

- public pages 可正常瀏覽
- private actions 正確觸發 auth
- user login works
- user profile sync works
- wardrobe data sync works
- RLS 正常
- product flow stable

---

## 11. 結論

OOTie 目前已具備一個合理且可延展的基礎架構：
- Public-first UX
- Real Supabase-ready auth and data layer
- Ready for future AI recommendation features

這是適合進入正式產品階段的工程狀態，並且能保留目前的使用者體驗與後續擴充能力。
