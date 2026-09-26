<template>
  <div class="tryon-view">
    <header class="page-header">
      <div>
        <p class="eyebrow">Virtual Try-On</p>

        <p class="subtitle">將您衣櫥中的經典單品與模特兒相結合，模擬即時穿搭成果與氛圍。</p>
      </div>
    </header>

    <div class="tryon-container">
      <!-- 步驟 1: 選擇模特兒 / 照片 -->
      <section class="tryon-panel">
        <h3>1. 選擇模特兒身型</h3>
        <div class="model-options">
          <button 
            v-for="(m, idx) in modelOptions" 
            :key="idx" 
            type="button" 
            class="model-card" 
            :class="{ active: selectedModelIndex === idx }"
            @click="selectedModelIndex = idx"
          >
            <img :src="m.image" :alt="m.label" />
            <span>{{ m.label }}</span>
          </button>
        </div>

        <h3 class="sub-title">2. 選擇試穿衣服單品</h3>
        <div class="selection-summary">
          <span>已選擇 {{ selectedItemIds.length }} 件衣服</span>
        </div>

        <div v-if="appStore.items.length === 0" class="empty-items-notice">
          您的衣櫥目前沒有單品，系統將自動套用預設單品進行試穿體驗。
        </div>

        <div class="clothes-grid">
          <label 
            v-for="item in availableItems" 
            :key="item.id" 
            class="cloth-card" 
            :class="{ active: selectedItemIds.includes(item.id) }"
          >
            <input 
              type="checkbox" 
              :value="item.id" 
              v-model="selectedItemIds" 
            />
            <img :src="item.photo" :alt="item.name_zh || item.name" />
            <span>{{ item.name_zh || item.name }}</span>
          </label>
        </div>

        <h3 class="sub-title">3. 選擇氛圍風格</h3>
        <div class="mood-chips">
          <button 
            v-for="mood in moodOptions" 
            :key="mood" 
            type="button" 
            class="chip-btn" 
            :class="{ active: selectedMood === mood }"
            @click="selectedMood = mood"
          >
            {{ mood }}
          </button>
        </div>

        <button 
          type="button" 
          class="btn-primary start-tryon-btn" 
          :disabled="isGenerating || selectedItemIds.length === 0"
          @click="handleStartTryon"
        >
          <span v-if="isGenerating">✨ 正在進行 AI 試穿模擬...</span>
          <span v-else>✨ 開始 AI 試穿預覽</span>
        </button>
      </section>

      <!-- 試穿預覽與生成結果區 -->
      <section class="tryon-preview-section">
        <h3>✦ 試穿預覽效果</h3>
        
        <div v-if="isGenerating" class="loading-preview">
          <div class="spinner"></div>
          <p>AI 正在融合您選取的 {{ selectedItemIds.length }} 件單品並計算光影布料細節...</p>
        </div>

        <div v-else-if="currentResult" class="result-display">
          <div class="result-photo-wrap">
            <img :src="currentResult.image" :alt="currentResult.name" />
            <span class="preview-badge">AI Virtual Try-On</span>
          </div>

          <div class="result-info">
            <h4>{{ currentResult.name }}</h4>
            <p class="result-meta">
              <span>{{ currentResult.mood }} 風格</span> · 
              <span>{{ currentResult.itemNames }}</span>
            </p>

            <div class="result-actions">
              <button class="btn-secondary" @click="saveToHistory">💾 儲存試穿結果</button>
              <button class="btn-primary" @click="postToOotd">📷 發布至 OOTD</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-preview">
          <div class="placeholder-icon">🪞</div>
          <p>選取模特兒與衣物單品後，點擊「開始 AI 試穿預覽」即可在數秒內生成真人效果圖！</p>
        </div>
      </section>
    </div>

    <!-- 歷史試穿紀錄 -->
    <section class="tryon-history-section">
      <div class="history-header">
        <h3>🕒 歷史試穿畫廊 ({{ historyList.length }})</h3>
        <button v-if="historyList.length > 0" class="btn-text-danger" @click="clearHistory">清空畫廊</button>
      </div>

      <div v-if="historyList.length === 0" class="history-empty">
        尚未生成任何試穿畫像，先選取衣服試穿吧！
      </div>

      <div v-else class="history-gallery">
        <div v-for="(h, idx) in historyList" :key="idx" class="gallery-card">
          <img :src="h.image" :alt="h.name" />
          <div class="gallery-overlay">
            <strong>{{ h.name }}</strong>
            <span>{{ h.item }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { hasFalConfig, callFalTryOnApi } from '@/services/fal';

const appStore = useAppStore();
const authStore = useAuthStore();

const TRYON_HISTORY_KEY = 'ootie-tryon-history-v1';

const modelOptions = [
  { label: '優雅俐落模特兒', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85' },
  { label: '日系清新模特兒', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85' },
  { label: '街頭潮流模特兒', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85' }
];

const moodOptions = ['輕鬆', '正式', '約會', '個性'];

const selectedModelIndex = ref(0);
const selectedItemIds = ref([]);
const selectedMood = ref('輕鬆');

const isGenerating = ref(false);
const currentResult = ref(null);
const historyList = ref([]);

const defaultClothes = [
  { id: 'def-1', name: '經典針織衫', name_zh: '經典針織衫', photo: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
  { id: 'def-2', name: '修身丹寧褲', name_zh: '修身丹寧褲', photo: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80' },
  { id: 'def-3', name: '復古皮革大衣', name_zh: '復古皮革大衣', photo: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80' }
];

const availableItems = computed(() => {
  return appStore.items.length > 0 ? appStore.items : defaultClothes;
});

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(TRYON_HISTORY_KEY);
    historyList.value = raw ? JSON.parse(raw) : [];
  } catch (e) {
    historyList.value = [];
  }
};

const saveHistoryToStorage = () => {
  try {
    localStorage.setItem(TRYON_HISTORY_KEY, JSON.stringify(historyList.value));
  } catch (e) {
    /* ignore */
  }
};

const clearHistory = () => {
  historyList.value = [];
  saveHistoryToStorage();
};

const handleStartTryon = () => {
  // Guest-First UX check: Require auth before running virtual try-on
  authStore.requireAuth(async () => {
    isGenerating.value = true;

    const chosenModel = modelOptions[selectedModelIndex.value];
    const selectedItemObjs = availableItems.value.filter(item => selectedItemIds.value.includes(item.id));
    const itemNames = selectedItemObjs.map(item => item.name_zh || item.name).join(' + ') || '精選穿搭組合';
    const firstGarmentPhoto = selectedItemObjs[0]?.photo || '';

    let generatedImageUrl = null;
    if (hasFalConfig()) {
      generatedImageUrl = await callFalTryOnApi({
        personImage: chosenModel.image,
        garmentImage: firstGarmentPhoto,
        prompt: `Virtual try on ${itemNames} on person model with ${selectedMood.value} vibe`
      });
    }

    currentResult.value = {
      name: `我的 ${selectedMood.value} 穿搭試穿`,
      image: generatedImageUrl || chosenModel.image,
      mood: selectedMood.value,
      itemNames,
      created_at: new Date().toISOString()
    };

    isGenerating.value = false;
    appStore.showToast('✨ AI 試穿預覽完成！');
  });
};

const saveToHistory = () => {
  if (!currentResult.value) return;
  const entry = {
    name: currentResult.value.name,
    image: currentResult.value.image,
    item: currentResult.value.itemNames,
    mood: currentResult.value.mood,
    created_at: new Date().toISOString()
  };

  historyList.value.unshift(entry);
  saveHistoryToStorage();
  appStore.showToast('已儲存至歷史試穿畫廊');
};

const postToOotd = () => {
  if (!currentResult.value) return;
  appStore.isOotdFormOpen = true;
  appStore.showToast('已代入試穿結果至 OOTD 發布');
};

onMounted(() => {
  loadHistory();
  if (availableItems.value.length > 0) {
    selectedItemIds.value = [availableItems.value[0].id];
  }
});
</script>

<style scoped>
.tryon-view {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 28px;
}

.eyebrow {
  font-size: 0.8rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--accent, #c9a96e);
  margin-bottom: 4px;
  font-weight: 600;
}

.subtitle {
  font-size: 0.95rem;
  color: var(--text-muted, #a0a0a5);
}

.tryon-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 40px;
}

@media (max-width: 860px) {
  .tryon-container {
    grid-template-columns: 1fr;
  }
}

.tryon-panel {
  background: var(--surface-card, #1c1c1e);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tryon-panel h3 {
  font-size: 1.05rem;
  font-weight: 600;
}

.sub-title {
  margin-top: 12px;
}

.model-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.model-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.model-card img {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
}

.model-card span {
  font-size: 0.75rem;
  color: var(--text-muted, #a0a0a5);
  text-align: center;
}

.model-card.active {
  border-color: var(--accent, #c9a96e);
  background: rgba(201, 169, 110, 0.1);
}

.model-card.active span {
  color: var(--accent, #c9a96e);
  font-weight: 600;
}

.selection-summary {
  font-size: 0.85rem;
  color: var(--accent, #c9a96e);
  font-weight: 500;
}

.empty-items-notice {
  font-size: 0.8rem;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 8px 12px;
  border-radius: 6px;
}

.clothes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

.cloth-card {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
}

.cloth-card input[type="checkbox"] {
  position: absolute;
  top: 6px;
  right: 6px;
  accent-color: var(--accent, #c9a96e);
}

.cloth-card img {
  width: 100%;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
}

.cloth-card span {
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.cloth-card.active {
  border-color: var(--accent, #c9a96e);
  background: rgba(201, 169, 110, 0.1);
}

.mood-chips {
  display: flex;
  gap: 8px;
}

.chip-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-main, #e0e0e0);
  font-size: 0.85rem;
  cursor: pointer;
}

.chip-btn.active {
  background: var(--accent, #c9a96e);
  color: #111;
  border-color: var(--accent, #c9a96e);
  font-weight: 600;
}

.start-tryon-btn {
  width: 100%;
  padding: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 8px;
}

.tryon-preview-section {
  background: var(--surface-card, #1c1c1e);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.tryon-preview-section h3 {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.loading-preview {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted, #a0a0a5);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent, #c9a96e);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-photo-wrap {
  position: relative;
  width: 100%;
  height: 320px;
  border-radius: 12px;
  overflow: hidden;
}

.result-photo-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  color: var(--accent, #c9a96e);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.result-info h4 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.result-meta {
  font-size: 0.85rem;
  color: var(--text-muted, #a0a0a5);
  margin-bottom: 16px;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.result-actions button {
  flex: 1;
  padding: 10px;
  font-size: 0.88rem;
}

.empty-preview {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted, #a0a0a5);
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.tryon-history-section {
  background: var(--surface-card, #1c1c1e);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.history-header h3 {
  font-size: 1.05rem;
  font-weight: 600;
}

.btn-text-danger {
  background: none;
  border: none;
  color: #f87171;
  font-size: 0.85rem;
  cursor: pointer;
}

.history-empty {
  color: var(--text-muted, #a0a0a5);
  font-size: 0.9rem;
}

.history-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}

.gallery-card {
  position: relative;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
}

.gallery-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 10px;
}

.gallery-overlay strong {
  font-size: 0.85rem;
  color: #fff;
}

.gallery-overlay span {
  font-size: 0.72rem;
  color: var(--text-muted, #a0a0a5);
}
</style>
