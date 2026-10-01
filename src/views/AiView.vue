<template>
  <div class="ai-view">
    <header class="page-header">
      <div>
        <p class="eyebrow">AI Style Assistant</p>
        <h1>AI 助手</h1>
        <p class="subtitle">針對您的個人衣櫥單品與天氣、場合，智慧生成最合適的穿搭提案。</p>
      </div>
    </header>

    <div class="ai-container">
      <!-- 篩選控制面板 -->
      <section class="ai-panel">
        <h3>✦ 設定穿搭需求</h3>
        
        <div class="field-group">
          <label>場合 (Occasion)</label>
          <div class="chip-options">
            <button 
              v-for="occ in occasions" 
              :key="occ" 
              type="button" 
              class="chip-btn" 
              :class="{ active: selectedOccasion === occ }"
              @click="selectedOccasion = occ"
            >
              {{ occ }}
            </button>
          </div>
        </div>

        <div class="field-group">
          <label>天氣 (Weather)</label>
          <div class="chip-options">
            <button 
              v-for="w in weathers" 
              :key="w" 
              type="button" 
              class="chip-btn" 
              :class="{ active: selectedWeather === w }"
              @click="selectedWeather = w"
            >
              {{ w }}
            </button>
          </div>
        </div>

        <div class="field-group">
          <label>穿搭風格 (Vibe)</label>
          <div class="chip-options">
            <button 
              v-for="v in vibes" 
              :key="v" 
              type="button" 
              class="chip-btn" 
              :class="{ active: selectedVibe === v }"
              @click="selectedVibe = v"
            >
              {{ v }}
            </button>
          </div>
        </div>

        <div class="field-group">
          <label>單品數量限制：{{ itemLimit }} 件</label>
          <input type="range" min="2" max="5" v-model.number="itemLimit" class="range-input" />
        </div>

        <div class="panel-footer">
          <div class="wardrobe-count-badge">
            目前衣櫥擁有 <strong>{{ appStore.items.length }}</strong> 件單品
          </div>
          <button type="button" class="btn-primary generate-btn" :disabled="isGenerating" @click="handleGenerate">
            <span v-if="isGenerating">✨ 智慧分析中...</span>
            <span v-else>✨ 產生 AI 穿搭提案</span>
          </button>
        </div>
      </section>

      <!-- 產生結果顯示區 -->
      <section class="ai-results-section">
        <h3>✦ AI 推薦組合</h3>
        
        <div v-if="isGenerating" class="loading-card">
          <div class="spinner"></div>
          <p>正在分析您衣櫥中的 {{ appStore.items.length }} 件單品與考量 {{ selectedWeather }} 天氣...</p>
        </div>

        <div v-else-if="recommendations.length > 0" class="results-grid">
          <article v-for="(rec, index) in recommendations" :key="index" class="result-card">
            <div class="result-image-wrap">
              <img :src="rec.image" :alt="rec.title" />
            </div>
            <div class="result-content">
              <div class="result-header">
                <span class="tag-badge">{{ rec.tag }}</span>
                <span class="score-badge">契合度 {{ rec.score }} / 100</span>
              </div>
              <h4>{{ rec.title }}</h4>
              <p class="summary-text">{{ rec.summary }}</p>
              <div class="items-used">
                <strong>搭配單品：</strong>
                <span>{{ rec.items.join(' + ') }}</span>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-results">
          <p>點擊上方「產生 AI 穿搭提案」，獲得專屬穿搭建議！</p>
        </div>
      </section>
    </div>

    <!-- 歷史生成紀錄 -->
    <section class="ai-history-section">
      <div class="history-header">
        <h3>🕒 歷史生成紀錄 ({{ historyList.length }})</h3>
        <button v-if="historyList.length > 0" class="btn-text-danger" @click="clearHistory">清空紀錄</button>
      </div>

      <div v-if="historyList.length === 0" class="history-empty">
        尚未生成過 AI 組合，開始試試吧！
      </div>

      <div v-else class="history-grid">
        <article v-for="(item, idx) in historyList" :key="idx" class="history-card">
          <div class="history-top">
            <span class="history-time">{{ item.when }}</span>
            <span class="history-title">{{ item.title }}</span>
          </div>
          <div class="history-tags">
            <span v-for="(tag, tIdx) in item.tags" :key="tIdx" class="history-tag">{{ tag }}</span>
          </div>
          <p class="history-summary">{{ item.summary }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAppStore } from '@/stores/app';
import { hasFalConfig, callFalOutfitApi } from '@/services/fal';

const appStore = useAppStore();

const AI_HISTORY_KEY = 'ootie-ai-history-v1';

const occasions = ['日常 / 上班', '約會', '週末休閒', '戶外露營', '正式派對'];
const weathers = ['晴朗舒適', '微涼有風', '陰天多雲', '下雨天', '寒冷低溫'];
const vibes = ['極簡俐落', '優雅氣質', '街頭潮流', '日系清新', '復古懷舊'];

const selectedOccasion = ref('日常 / 上班');
const selectedWeather = ref('晴朗舒適');
const selectedVibe = ref('極簡俐落');
const itemLimit = ref(3);

const isGenerating = ref(false);
const recommendations = ref([]);
const historyList = ref([]);

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(AI_HISTORY_KEY);
    historyList.value = raw ? JSON.parse(raw) : [];
  } catch (e) {
    historyList.value = [];
  }
};

const saveHistory = () => {
  try {
    localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(historyList.value));
  } catch (e) {
    /* ignore */
  }
};

const clearHistory = () => {
  historyList.value = [];
  saveHistory();
};

const handleGenerate = async () => {
  isGenerating.value = true;

  const closet = appStore.items;
  const picks = closet.slice(0, Math.max(2, Math.min(itemLimit.value, 4)));
  const promptText = `Occasion: ${selectedOccasion.value}, Weather: ${selectedWeather.value}, Vibe: ${selectedVibe.value}, Wardrobe items: ${picks.map(i => i.name_zh || i.name).join(', ')}`;

  // If Fal.ai key configured in .env, call API
  let apiResult = null;
  if (hasFalConfig()) {
    apiResult = await callFalOutfitApi(promptText);
  }

  if (picks.length === 0) {
    recommendations.value = [
      {
        title: `${selectedOccasion.value}基礎提案`,
        score: 95,
        summary: `適合 ${selectedWeather.value} 的 ${selectedVibe.value} 風格穿搭組合。建議新增更多個人衣物取得個人化推薦！`,
        items: ['極簡白色 T-Shirt', '經典休閒長褲', '簡約球鞋'],
        tag: 'Tops',
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85'
      }
    ];
  } else {
    recommendations.value = picks.map((item, idx) => {
      return {
        title: `${selectedOccasion.value}提案 ${idx + 1}`,
        score: 88 + idx * 4,
        summary: `以「${item.name_zh || item.name}」為核心，打造符合 ${selectedWeather.value} 天氣與 ${selectedVibe.value} 氛圍的理想視覺層次。`,
        items: [item.name_zh || item.name, '適配褲裝/裙裝', '精選配件'],
        tag: item.category || 'Tops',
        image: item.photo || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85'
      };
    });
  }

  // Record in history
  const newHistory = {
    when: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    title: `${selectedOccasion.value} · ${selectedVibe.value}`,
    tags: [selectedOccasion.value, selectedWeather.value, selectedVibe.value],
    summary: recommendations.value[0]?.summary || '完成 AI 搭配提案'
  };

  historyList.value.unshift(newHistory);
  saveHistory();

  isGenerating.value = false;
};

onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.ai-view {
  width: 100%;
  min-width: 0;
}

.page-header {
  margin-bottom: 24px;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--sage-dark);
  margin-bottom: 4px;
  font-weight: 600;
}

.subtitle {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.55;
}

.ai-container {
  display: grid;
  grid-template-columns: minmax(320px, 360px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  margin-bottom: 32px;
}

@media (max-width: 1000px) {
  .ai-container {
    grid-template-columns: minmax(0, 1fr);
  }
}

.ai-panel {
  min-width: 0;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(40, 38, 30, .06);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ai-panel h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink);
}

.chip-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--ink);
  font-size: 0.82rem;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}

.chip-btn:hover {
  background: #f0f2ec;
  border-color: var(--sage);
}

.chip-btn.active {
  background: #e6ece2;
  color: var(--ink);
  border-color: var(--sage-dark);
  font-weight: 600;
}

.ai-view button:focus-visible,
.ai-view input:focus-visible {
  outline: 2px solid var(--sage-dark);
  outline-offset: 2px;
}

.range-input {
  width: 100%;
  accent-color: var(--sage-dark);
  cursor: pointer;
}

.panel-footer {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wardrobe-count-badge {
  font-size: 0.82rem;
  color: var(--muted);
  background: #f0f2ec;
  border: 1px solid var(--line);
  padding: 8px 12px;
  border-radius: 10px;
  text-align: center;
}

.wardrobe-count-badge strong {
  color: var(--ink);
}

.generate-btn {
  width: 100%;
  padding: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid var(--ink);
  border-radius: 10px;
  background: var(--ink);
  color: var(--white);
  cursor: pointer;
}

.generate-btn:hover:not(:disabled) {
  background: #383838;
}

.generate-btn:disabled {
  cursor: not-allowed;
  opacity: .58;
}

.ai-results-section {
  min-width: 0;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(40, 38, 30, .06);
}

.ai-results-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 16px;
}

.loading-card {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--line);
  border-top-color: var(--sage-dark);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-card {
  display: flex;
  gap: 16px;
  min-width: 0;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  align-items: center;
}

@media (max-width: 600px) {
  .result-card {
    flex-direction: column;
    align-items: flex-start;
  }
}

.result-image-wrap img {
  width: 100px;
  height: 120px;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}

.result-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f0f2ec;
  color: var(--sage-dark);
  font-weight: 600;
}

.score-badge {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--sage-dark);
}

.result-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}

.summary-text {
  font-size: 0.875rem;
  color: var(--muted);
  line-height: 1.4;
}

.items-used {
  font-size: 0.82rem;
  color: var(--ink);
  margin-top: 4px;
}

.empty-results {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
}

.ai-history-section {
  min-width: 0;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(40, 38, 30, .06);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.history-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}

.btn-text-danger {
  background: none;
  border: none;
  color: #8f4c48;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-text-danger:hover {
  color: #703b37;
  text-decoration: underline;
}

.history-empty {
  color: var(--muted);
  font-size: 0.9rem;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 12px;
}

.history-card {
  min-width: 0;
  background: #f8f7f3;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-top {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink);
}

.history-time {
  color: var(--sage-dark);
  font-size: 0.78rem;
}

.history-tags {
  display: flex;
  gap: 4px;
}

.history-tag {
  font-size: 0.72rem;
  background: #e6ece2;
  color: var(--ink);
  padding: 2px 6px;
  border-radius: 4px;
}

.history-summary {
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.5;
}
</style>
