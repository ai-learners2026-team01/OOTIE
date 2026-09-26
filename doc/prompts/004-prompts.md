Step 1.

```
請幫我閱讀並分析當前的專案程式碼內容，其中
legacy/main 裏是重構前的專案，legacy/ming 是根據 legacy/main 進行新功能開發。
而當前專案是根據 legacy/main 以 vue3 + pinia 框架進行重構。新功能則是以 legacy/ming 結構進行開發，該功能的描述儲存在 legacy/ming/FINAL_DELIVERY.md
請先理解專案內容，但先不要進行任何的程式碼修改與撰寫。
```

Step 2.

```
開始整合
```

Step 3.

```
.env.example 沒有整合 legacy/ming/.env.example 機密資訊
```

Step 4.

```
幫我檢視當前專案，使用 fal.ai 功能時要能夠使用 .env 的機密資訊呼叫第三方服務
```

Step 5.

```
統一使用
VITE_FAL_KEY=your_fal_key_here
VITE_FAL_MODEL=fal-ai/fast-sdxl
作為機密資訊的 keyword
```

Step 6.

```
參考上述整合資訊，幫我整理人工驗收流程寫入 doc/human-test/003-ming-branch.md
```
