<template>
  <div class="tryon-view">
    <header class="page-header">
      <div>
        <p class="eyebrow">Virtual Try-On</p>
        <h1>虛擬試穿</h1>
        <p class="subtitle">將您衣櫥中的經典單品與模特兒相結合，模擬即時穿搭成果與氛圍。</p>
      </div>
    </header>

    <div class="tryon-container">
      <!-- 步驟 1: 選擇模特兒 / 照片 -->
      <section class="tryon-panel">
        <div class="panel-step-header">
          <h3>1. 選擇試穿模特兒</h3>
          <div class="source-toggle">
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: avatarSource === 'model' }"
              @click="avatarSource = 'model'"
            >
              經典模特兒
            </button>
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: avatarSource === 'custom' }"
              @click="avatarSource = 'custom'"
            >
              📷 上傳我的全身照
            </button>
          </div>
        </div>

        <div v-if="avatarSource === 'model'" class="model-options">
          <button 
            v-for="(m, idx) in modelOptions" 
            :key="idx" 
            type="button" 
            class="model-card" 
            :class="{ active: selectedModelIndex === idx }"
            :aria-pressed="selectedModelIndex === idx"
            :aria-label="m.label"
            @click="selectedModelIndex = idx"
          >
            <img :src="m.image" :alt="m.label" />
          </button>
        </div>

        <div v-else class="custom-photo-uploader">
          <label class="custom-photo-box" for="tryonSelfPhoto">
            <div v-if="customPhotoUrl" class="custom-photo-preview">
              <img :src="customPhotoUrl" alt="個人全身照預覽" />
              <span class="change-badge">更換照片</span>
            </div>
            <div v-else class="custom-photo-placeholder">
              <span class="upload-icon">📷</span>
              <strong>點擊上傳你的真實全身穿搭照</strong>
              <small>建議背景乾淨、光線均勻的正面站姿照片 (支援 JPG, PNG, WEBP)</small>
            </div>
            <input
              id="tryonSelfPhoto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style="display: none;"
              @change="handleSelfPhotoUpload"
            />
          </label>
        </div>

        <div class="clothes-section-header">
          <h3 class="sub-title">2. 選擇試穿衣服（可多選）</h3>
          <button
            ref="openPickerBtn"
            type="button"
            class="btn-select-clothes"
            aria-label="選擇衣服"
            @click="openClothesPicker"
          >
            選擇衣服
          </button>
        </div>
        <div class="selection-summary">
          <span>已選擇 {{ selectedItemIds.length }} 件衣服</span>
        </div>

        <div v-if="appStore.items.length === 0" class="empty-items-notice">
          您的衣櫥目前沒有單品，系統將自動套用預設單品進行試穿體驗。
        </div>

        <div v-if="selectedItems.length === 0" class="empty-clothes-hint">
          尚未選擇衣服單品，請點擊「選擇衣服」挑選單品。
        </div>

        <div v-else class="selected-clothes-grid">
          <div
            v-for="item in selectedItems"
            :key="item.id"
            class="selected-cloth-card"
          >
            <img :src="item.photo" :alt="item.name_zh || item.name" />
            <button
              type="button"
              class="remove-cloth-btn"
              :aria-label="`移除 ${item.name_zh || item.name}`"
              @click="removeSelectedItem(item.id)"
            >
              ×
            </button>
          </div>
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
          <span v-if="isGenerating">正在進行 AI 試穿模擬...</span>
          <span v-else>開始 AI 試穿預覽</span>
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
              <button class="btn-secondary" @click="saveToCloset">🧺 加入我的衣櫥</button>
              <button class="btn-secondary" @click="saveToHistory">💾 儲存至畫廊</button>
              <button class="btn-primary" @click="postToOotd">📷 發布至 OOTD</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-preview">
          <p>選取模特兒與服飾後，點擊「開始 AI 試穿預覽」即可生成模擬圖！</p>
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

    <!-- 衣服多選彈窗 -->
    <div
      v-if="isPickerOpen"
      class="modal-backdrop open clothes-picker-backdrop"
      @click.self="cancelClothesSelection"
    >
      <section
        ref="pickerDialogRef"
        class="modal clothes-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clothesPickerTitle"
        tabindex="-1"
        @keydown="handleDialogKeydown"
      >
        <div class="picker-header">
          <div>
            <p class="eyebrow">Virtual Try-On</p>
            <h2 id="clothesPickerTitle">選擇試穿衣服</h2>
          </div>
          <button
            type="button"
            class="modal-close"
            aria-label="關閉視窗"
            @click="cancelClothesSelection"
          >
            ×
          </button>
        </div>

        <div class="picker-summary">
          <span>已勾選 {{ draftSelectedItemIds.length }} 件衣服</span>
        </div>

        <div class="picker-body">
          <div class="picker-clothes-grid">
            <button
              v-for="item in availableItems"
              :key="item.id"
              type="button"
              role="checkbox"
              :aria-checked="draftSelectedItemIds.includes(item.id)"
              :aria-label="item.name_zh || item.name"
              class="cloth-card"
              :class="{ active: draftSelectedItemIds.includes(item.id) }"
              @click="toggleDraftItem(item.id)"
            >
              <img :src="item.photo" :alt="item.name_zh || item.name" />
            </button>
          </div>
        </div>

        <div class="picker-footer">
          <button
            type="button"
            class="btn-ghost"
            @click="cancelClothesSelection"
          >
            取消
          </button>
          <button
            type="button"
            class="btn-primary"
            @click="confirmClothesSelection"
          >
            確認選擇
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useClosetStore } from '@/stores/closet';
import { useOotdStore } from '@/stores/ootd';
import { hasFalConfig, callFalTryOnApi } from '@/services/fal';

const appStore = useAppStore();
const authStore = useAuthStore();
const closetStore = useClosetStore();
const ootdStore = useOotdStore();

const TRYON_HISTORY_KEY = 'ootie-tryon-history-v1';

const avatarSource = ref('model'); // 'model' | 'custom'
const customPhotoUrl = ref('');

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

const isPickerOpen = ref(false);
const draftSelectedItemIds = ref([]);
const pickerDialogRef = ref(null);
const openPickerBtn = ref(null);
let previousBodyOverflow = '';

const defaultClothes = [
  { id: 'def-1', name: '經典針織衫', name_zh: '經典針織衫', photo: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
  { id: 'def-2', name: '修身丹寧褲', name_zh: '修身丹寧褲', photo: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80' },
  { id: 'def-3', name: '復古皮革大衣', name_zh: '復古皮革大衣', photo: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80' }
];

const availableItems = computed(() => {
  return appStore.items.length > 0 ? appStore.items : defaultClothes;
});

const selectedItems = computed(() => {
  return availableItems.value.filter(item => selectedItemIds.value.includes(item.id));
});

const openClothesPicker = async () => {
  draftSelectedItemIds.value = [...selectedItemIds.value];
  isPickerOpen.value = true;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  await nextTick();
  pickerDialogRef.value?.focus();
};

const closeClothesPicker = () => {
  isPickerOpen.value = false;
  document.body.style.overflow = previousBodyOverflow;
  openPickerBtn.value?.focus?.();
};

const confirmClothesSelection = () => {
  selectedItemIds.value = [...draftSelectedItemIds.value];
  closeClothesPicker();
};

const cancelClothesSelection = () => {
  closeClothesPicker();
};

const toggleDraftItem = (id) => {
  const idx = draftSelectedItemIds.value.indexOf(id);
  if (idx > -1) {
    draftSelectedItemIds.value.splice(idx, 1);
  } else {
    draftSelectedItemIds.value.push(id);
  }
};

const removeSelectedItem = (id) => {
  selectedItemIds.value = selectedItemIds.value.filter(itemId => itemId !== id);
};

const handleDialogKeydown = (event) => {
  if (!isPickerOpen.value) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    cancelClothesSelection();
    return;
  }
  if (event.key === 'Tab') {
    const focusable = pickerDialogRef.value?.querySelectorAll(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
};

const handleGlobalKeydown = (event) => {
  if (isPickerOpen.value && event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    cancelClothesSelection();
  }
};

const handleSelfPhotoUpload = (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    customPhotoUrl.value = e.target.result;
    avatarSource.value = 'custom';
    appStore.showToast('已載入您的個人全身照片');
  };
  reader.readAsDataURL(file);
};

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

/**
 * 智慧視覺模擬合成引擎 (當無外部 Fal.ai key 時，即時融合模特兒與衣物圖層、濾鏡與光影)
 */
const synthesizeVirtualTryOnCanvas = async (baseImageUrl, garmentImages, mood, itemNames) => {
  // 在 Happy DOM 或無完整 Canvas 渲染之測試環境中快速 fallback
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return baseImageUrl;
  }

  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      if (!canvas || typeof canvas.getContext !== 'function') {
        resolve(baseImageUrl);
        return;
      }
      canvas.width = 900;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx || typeof ctx.drawImage !== 'function') {
        resolve(baseImageUrl);
        return;
      }

      const loadImg = (src) => {
        return new Promise((res) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = () => res(null);
          // 在不支援真載入環境直接回傳或逾時
          setTimeout(() => res(null), 100);
          img.src = src;
        });
      };

      loadImg(baseImageUrl).then(async (baseImg) => {
        if (!baseImg) {
          resolve(baseImageUrl);
          return;
        }

        // 1. 繪製模特兒或自選底圖
        ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

        // 2. 氛圍風格濾鏡調色 (Mood Color Grading)
        ctx.save();
        if (mood === '約會') {
          ctx.fillStyle = 'rgba(235, 180, 190, 0.12)'; // 柔粉浪漫
        } else if (mood === '正式') {
          ctx.fillStyle = 'rgba(210, 220, 235, 0.1)'; // 冷調都會
        } else if (mood === '個性') {
          ctx.fillStyle = 'rgba(240, 200, 140, 0.1)'; // 復古琥珀
        } else {
          ctx.fillStyle = 'rgba(245, 240, 230, 0.08)'; // 溫潤休閒
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // 3. 多單品精準融合卡 (Picture-in-picture Look Inset)
        const validGarmentImgs = (await Promise.all(garmentImages.map(loadImg))).filter(Boolean);
        if (validGarmentImgs.length > 0) {
          const thumbSize = 130;
          const padding = 16;
          const startY = canvas.height - (thumbSize + 85);

          // 底部玻璃擬態資訊欄 (Frosted Glass Panel)
          ctx.save();
          ctx.fillStyle = 'rgba(25, 25, 25, 0.72)';
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(24, startY - 20, canvas.width - 48, thumbSize + 70, 16);
            ctx.fill();
          } else {
            ctx.fillRect(24, startY - 20, canvas.width - 48, thumbSize + 70);
          }

          ctx.fillStyle = '#ffffff';
          ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(`AI 試穿搭配：${mood}風格`, 44, startY + 12);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = '400 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const displayNames = itemNames.length > 40 ? itemNames.slice(0, 38) + '...' : itemNames;
          ctx.fillText(displayNames, 44, startY + 36);

          // 渲染單品小圖
          validGarmentImgs.slice(0, 4).forEach((gImg, idx) => {
            const x = canvas.width - 54 - (validGarmentImgs.length - idx) * (thumbSize + padding);
            const y = startY - 6;
            ctx.save();
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(x, y, thumbSize, thumbSize, 12);
              ctx.clip();
            }
            ctx.drawImage(gImg, x, y, thumbSize, thumbSize);
            ctx.restore();

            // 邊框
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          });
          ctx.restore();
        }

        try {
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch (err) {
          resolve(baseImageUrl);
        }
      });
    } catch (e) {
      resolve(baseImageUrl);
    }
  });
};

const handleStartTryon = () => {
  // Guest-First UX check: Require auth before running virtual try-on
  authStore.requireAuth(async () => {
    isGenerating.value = true;

    // 1. 決定試穿對象底圖 (自選照片或內建模特兒)
    const basePhoto = avatarSource.value === 'custom' && customPhotoUrl.value
      ? customPhotoUrl.value
      : modelOptions[selectedModelIndex.value].image;

    // 2. 篩選所選衣服物件
    const selectedItemObjs = availableItems.value.filter(item => selectedItemIds.value.includes(item.id));
    const itemNames = selectedItemObjs.map(item => item.name_zh || item.name).join(' + ') || '精選穿搭單品';
    const garmentPhotos = selectedItemObjs.map(item => item.photo).filter(Boolean);

    let generatedImageUrl = null;

    // 若環境中配置有正式 Fal.ai key 則呼叫遠端模型
    if (hasFalConfig()) {
      generatedImageUrl = await callFalTryOnApi({
        personImage: basePhoto,
        garmentImage: garmentPhotos[0] || '',
        prompt: `Virtual try on ${itemNames} on person model with ${selectedMood.value} vibe`
      });
    }

    // 若無 key 或 API 失敗，由智慧合成引擎融合
    if (!generatedImageUrl) {
      generatedImageUrl = await synthesizeVirtualTryOnCanvas(
        basePhoto,
        garmentPhotos,
        selectedMood.value,
        itemNames
      );
    }

    currentResult.value = {
      name: `我的 ${selectedMood.value} 穿搭試穿`,
      image: generatedImageUrl,
      mood: selectedMood.value,
      itemNames,
      selectedItemIds: [...selectedItemIds.value],
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

const saveToCloset = () => {
  if (!currentResult.value) return;
  const todayStr = new Date().toISOString().slice(0, 10);
  closetStore.addItem({
    name: currentResult.value.name,
    name_zh: currentResult.value.name,
    category: 'Tops',
    style: currentResult.value.mood,
    photo: currentResult.value.image,
    notes: `由 Virtual Try-On 試穿生成 · 單品：${currentResult.value.itemNames}`,
    wear_count: 2,
    last_worn: todayStr,
    purchase_date: todayStr
  });
};

const postToOotd = () => {
  if (!currentResult.value) return;
  ootdStore.editingPostId = null;
  ootdStore.prefillData = {
    image: currentResult.value.image,
    caption: `今天的 AI 虛擬試穿靈感（${currentResult.value.mood}風格）：${currentResult.value.itemNames} ✨`,
    hashtags: `#${currentResult.value.mood} #virtualtryon #ootd`,
    selectedItemIds: [...(currentResult.value.selectedItemIds || [])]
  };
  appStore.isOotdFormOpen = true;
  appStore.showToast('已代入試穿結果至 OOTD 發布');
};

onMounted(() => {
  loadHistory();
  if (availableItems.value.length > 0) {
    selectedItemIds.value = [availableItems.value[0].id];
  }
  window.addEventListener('keydown', handleGlobalKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  if (isPickerOpen.value) {
    document.body.style.overflow = previousBodyOverflow;
  }
});
</script>

<style scoped>
.tryon-view {
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
  margin-bottom: 12px;
  font-weight: 600;
}

.subtitle {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.55;
}

.tryon-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  margin-bottom: 32px;
}

@media (max-width: 1000px) {
  .tryon-container {
    grid-template-columns: minmax(0, 1fr);
  }
}

.tryon-panel {
  min-width: 0;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(40, 38, 30, .06);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tryon-panel h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}

.panel-step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.source-toggle {
  display: flex;
  flex-wrap: wrap;
  max-width: 100%;
  background: #f0f2ec;
  padding: 3px;
  border-radius: 10px;
  gap: 4px;
}

.toggle-btn {
  background: transparent;
  border: none;
  font-size: 0.78rem;
  color: var(--muted);
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}

.toggle-btn.active {
  background: var(--white);
  border-color: var(--line);
  color: var(--ink);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(40, 38, 30, .08);
}

.custom-photo-box {
  display: block;
  border: 1px dashed var(--line);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  background: var(--white);
  transition: background .2s ease, border-color .2s ease;
}

.custom-photo-box:hover {
  border-color: var(--sage-dark);
  background: #f8f7f3;
}

.custom-photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.custom-photo-placeholder .upload-icon {
  font-size: 26px;
}

.custom-photo-placeholder strong {
  font-size: 0.9rem;
  color: var(--ink);
}

.custom-photo-placeholder small {
  font-size: 0.75rem;
  color: var(--muted);
  line-height: 1.5;
}

.custom-photo-preview {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.custom-photo-preview img {
  max-height: 180px;
  max-width: 100%;
  width: auto;
  border-radius: 8px;
  object-fit: contain;
}

.custom-photo-preview .change-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: var(--ink);
  color: var(--white);
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 4px;
}

.sub-title {
  margin-top: 12px;
}

.model-options {
  display: flex;
  justify-content: flex-start;
  gap: 6px;
}

.model-card {
  width: 138.75px;
  height: 185px;
  min-width: 0;
  background: var(--white);
  border: 2px solid var(--line);
  border-radius: 12px;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease;
  aspect-ratio: 3 / 4;
}

.model-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.model-card.active {
  border-color: var(--sage-dark);
  background: #e6ece2;
}

.tryon-view button:focus-visible,
.tryon-view input:focus-visible,
.tryon-view .custom-photo-box:focus-visible,
.tryon-view .model-card:focus-visible,
.tryon-view .cloth-card:focus-visible,
.tryon-view .remove-cloth-btn:focus-visible {
  outline: 2px solid var(--sage-dark);
  outline-offset: 2px;
}

.clothes-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.clothes-section-header .sub-title {
  margin-top: 0;
}

.btn-select-clothes {
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #f0f2ec;
  color: var(--ink);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease;
}

.btn-select-clothes:hover {
  background: #e4ebd9;
  border-color: var(--sage);
}

.selection-summary {
  font-size: 0.85rem;
  color: var(--sage-dark);
  font-weight: 500;
}

.empty-items-notice {
  font-size: 0.8rem;
  color: #66552f;
  background: #f5f1e6;
  border: 1px solid #e7e0cc;
  padding: 8px 12px;
  border-radius: 10px;
  line-height: 1.5;
}

.empty-clothes-hint {
  font-size: 0.85rem;
  color: var(--muted);
  background: #f8f7f3;
  border: 1px dashed var(--line);
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  line-height: 1.5;
}

.selected-clothes-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 6px;
}

.selected-cloth-card {
  position: relative;
  background: var(--white);
  border: 1.5px solid var(--line);
  border-radius: 12px;
  padding: 6px;
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-cloth-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.remove-cloth-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--white);
  border: 2px solid var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(40, 38, 30, 0.15);
  transition: transform .15s ease, background .15s ease;
}

.remove-cloth-btn:hover {
  background: #8f4c48;
  transform: scale(1.1);
}

.cloth-card {
  min-width: 0;
  border: 2px solid var(--line);
  border-radius: 12px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--white);
  aspect-ratio: 1;
  transition: background .2s ease, border-color .2s ease;
}

.cloth-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.cloth-card.active {
  border-color: var(--sage-dark);
  background: #e6ece2;
}

.mood-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-btn {
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--ink);
  font-size: 0.85rem;
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

.start-tryon-btn {
  width: 100%;
  padding: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 8px;
  border: 1px solid var(--ink);
  border-radius: 10px;
  background: var(--ink);
  color: var(--white);
  cursor: pointer;
}

.start-tryon-btn:hover:not(:disabled) {
  background: #383838;
}

.start-tryon-btn:disabled {
  cursor: not-allowed;
  opacity: .58;
}

.tryon-preview-section {
  min-width: 0;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(40, 38, 30, .06);
}

.tryon-preview-section h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 16px;
}

.loading-preview {
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

.result-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-photo-wrap {
  position: relative;
  width: 100%;
  max-height: min(520px, 70vh);
  aspect-ratio: 3 / 4;
  border-radius: 14px;
  overflow: hidden;
  background: #f0f2ec;
}

.result-photo-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(32, 32, 32, 0.88);
  backdrop-filter: blur(4px);
  color: var(--white);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.result-info h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 4px;
}

.result-meta {
  font-size: 0.85rem;
  color: var(--muted);
  margin-bottom: 16px;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.result-actions button {
  flex: 1 1 120px;
  min-width: 0;
  padding: 10px;
  font-size: 0.88rem;
  border-radius: 10px;
  cursor: pointer;
}

.result-actions .btn-secondary {
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--ink);
}

.result-actions .btn-secondary:hover {
  background: #f0f2ec;
}

.result-actions .btn-primary {
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--white);
}

.result-actions .btn-primary:hover {
  background: #383838;
}

.empty-preview {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
  line-height: 1.55;
}

.tryon-history-section {
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
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--ink);
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
  color: rgba(255, 255, 255, .86);
}

/* 衣服多選彈窗樣式 */
.clothes-picker-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(30, 30, 25, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fade .2s ease;
}

.clothes-picker-dialog {
  width: min(640px, 100%);
  max-height: calc(100dvh - 40px);
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  outline: none;
  position: relative;
  overflow: hidden;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 12px;
}

.picker-header h2 {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--ink);
  margin: 4px 0 0;
}

.picker-summary {
  padding: 0 24px 12px;
  font-size: 0.85rem;
  color: var(--sage-dark);
  font-weight: 600;
}

.picker-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 4px 24px 16px;
  overscroll-behavior: contain;
}

.picker-clothes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 12px;
}

.picker-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: var(--paper);
  flex-shrink: 0;
}

.btn-ghost {
  padding: 8px 18px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--ink);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background .2s ease;
}

.btn-ghost:hover {
  background: #f0f2ec;
}

.picker-footer .btn-primary {
  padding: 8px 20px;
  border-radius: 10px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--white);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .2s ease;
}

.picker-footer .btn-primary:hover {
  background: #383838;
}

@media (max-width: 600px) {
  .tryon-panel,
  .tryon-preview-section,
  .tryon-history-section {
    padding: 16px;
  }

  .panel-step-header {
    align-items: flex-start;
  }

  .source-toggle {
    width: 100%;
  }

  .toggle-btn {
    flex: 1 1 auto;
  }

  .result-actions button {
    flex-basis: 100%;
  }

  .clothes-picker-backdrop {
    padding: 12px;
  }

  .clothes-picker-dialog {
    max-height: calc(100dvh - 24px);
    border-radius: 16px;
  }

  .picker-header {
    padding: 18px 18px 10px;
  }

  .picker-summary {
    padding: 0 18px 10px;
  }

  .picker-body {
    padding: 4px 18px 14px;
  }

  .picker-clothes-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .picker-footer {
    padding: 12px 18px;
  }

  .picker-footer button {
    flex: 1;
  }
}
</style>
