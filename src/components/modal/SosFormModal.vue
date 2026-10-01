<template>
  <SosDialog v-if="appStore.isSosFormOpen" title="發布穿搭求救" panel-class="sos-form-modal" :busy="submitting" @close="close">
      <p class="eyebrow">Style SOS</p>
      <h2>請衣友幫忙搭配</h2>
      <p class="sos-note">說說要去哪裡，再選幾件願意公開的衣物，讓衣友給你更實用的建議。</p>
      <p v-if="!sosStore.canPublish" class="sos-error" role="alert">{{ sosStore.remoteWriteReason || sosStore.interactionReason }}</p>
      <p v-if="contextItem" class="sos-item-context">
        已帶入單品：{{ contextItem.name_zh || contextItem.name }}
      </p>

      <form @submit.prevent="handleSubmit">
        <div class="form-field">
          <label for="sosTitle">標題</label>
          <input
            id="sosTitle"
            v-model="title"
            required
            maxlength="100"
            placeholder="例如：明天第一次約會，我該穿什麼？"
          />
        </div>

        <div class="form-field" style="margin-top:16px">
          <label for="sosDetails">告訴衣友更多</label>
          <textarea
            id="sosDetails"
            v-model="details"
            required
            maxlength="1500"
            placeholder="例如：需要走很多路、怕冷、希望不太正式；也可以說說你不想露出的部位。"
          ></textarea>
        </div>

        <div class="form-grid" style="margin-top:16px">
          <div class="form-field">
            <label for="sosOccasion">場合</label>
            <select id="sosOccasion" v-model="occasion">
              <option>約會</option>
              <option>工作</option>
              <option>上課</option>
              <option>聚餐</option>
              <option>戶外活動</option>
              <option>旅行</option>
              <option>日常</option>
              <option>其他</option>
            </select>
          </div>
          <div class="form-field">
            <label for="sosWeather">預期天氣</label>
            <select id="sosWeather" v-model="weather">
              <option>晴天</option>
              <option>涼爽</option>
              <option>炎熱</option>
              <option>下雨</option>
              <option>微涼有風</option>
            </select>
          </div>
          <div class="form-field">
            <label for="sosWhen">穿著時機</label>
            <select id="sosWhen" v-model="whenLabel">
              <option>今晚</option>
              <option>明天</option>
              <option>週末</option>
              <option>下週</option>
            </select>
          </div>
        </div>

        <div class="form-field" style="margin-top:16px">
          <label>想呈現的風格</label>
          <div class="vibe-options">
            <label
              v-for="vibe in availableVibes"
              :key="vibe"
              :class="['vibe-option', { selected: selectedVibes.includes(vibe) }]"
            >
              <input type="checkbox" :value="vibe" v-model="selectedVibes" />
              {{ vibeLabel(vibe) }}
            </label>
          </div>
        </div>

        <!-- Public Closet Items Selection -->
        <div class="form-field" style="margin-top:20px">
          <label>本次公開給衣友的衣物</label>
          <p class="sos-share-help">
            只有你勾選的衣物會出現在這筆求救中，其他衣櫥內容不會公開。衣友只能使用你本次公開的衣物幫你搭配。
          </p>

          <div class="sos-share-tools">
            <span class="suggestion-selected">已選 {{ selectedClosetItemIds.length }} 件</span>
            <div>
              <button type="button" @click="selectAllClosetItems">全選</button>
              <span style="margin:0 4px; color:var(--muted);">|</span>
              <button type="button" @click="clearClosetItems">取消全選</button>
            </div>
          </div>

          <label for="sos-clothing-search" class="sos-note">找自己的衣物</label>
          <input id="sos-clothing-search" v-model="itemSearch" type="search" placeholder="搜尋衣物名稱" />
          <p v-if="!ownedClosetItems.length" class="sos-empty-note">你的衣櫃還沒有可選的衣物。先到衣櫃新增衣物，再回來發布求救。</p>
          <p v-else-if="!visibleItems.length" class="sos-note">找不到符合的衣物，請換個關鍵字。</p>

          <div class="sos-share-items">
            <label
              v-for="item in visibleItems"
              :key="item.id"
              :class="['suggestion-item', { selected: selectedClosetItemIds.includes(item.id) }]"
            >
              <input type="checkbox" :value="item.id" v-model="selectedClosetItemIds" />
              <SosClothingImage :src="item.photo" :alt="item.name_zh || item.name" />
              <span>{{ item.name_zh || item.name }}</span>
            </label>
          </div>
          <p v-if="showValidation && !selectedClosetItemIds.length" class="sos-share-validation">
            請至少選擇 1 件要公開給衣友的衣物。
          </p>
        </div>

        <p v-if="sosStore.lastError" class="sos-error" role="alert">{{ sosStore.lastError }}</p>
        <p class="sos-note">{{ sosStore.isFixture ? '發布到多人體驗空間，切換角色即可提供建議。' : '求救將發布至衣友求救板。' }}</p>
        <div class="form-actions">
          <button type="button" class="secondary" :disabled="submitting" @click="close">取消</button>
          <button type="submit" class="primary" :disabled="submitting || !sosStore.canPublish || !ownedClosetItems.length">{{ submitting ? '儲存中…' : '發布求救' }}</button>
        </div>
      </form>
  </SosDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAppStore } from '@/stores/app';
import { useSosStore } from '@/stores/sos';
import SosDialog from '@/features/sos/components/SosDialog.vue';
import SosClothingImage from '@/features/sos/components/SosClothingImage.vue';
import { vibeLabel } from '@/features/sos/presentation';

const appStore = useAppStore();
const sosStore = useSosStore();
const submitting = ref(false);
const itemSearch = ref('');

const availableVibes = ['Soft', 'Elegant', 'Smart Casual', 'Relaxed', 'Confident', 'Playful'];

const title = ref('');
const details = ref('');
const occasion = ref('約會');
const weather = ref('涼爽');
const whenLabel = ref('明天');
const selectedVibes = ref([]);
const selectedClosetItemIds = ref([]);
const showValidation = ref(false);

const ownedClosetItems = computed(() => sosStore.ownedClosetItems);
const visibleItems = computed(() => ownedClosetItems.value.filter(item =>
  `${item.name_zh || ''} ${item.name || ''}`.toLowerCase().includes(itemSearch.value.trim().toLowerCase())
));

const contextItem = computed(() => {
  return appStore.sosTargetItemId
    ? ownedClosetItems.value.find((item) => item.id === appStore.sosTargetItemId)
    : null;
});

watch(
  () => appStore.isSosFormOpen,
  (open) => {
    if (!open) return;
    sosStore.clearError();
    itemSearch.value = '';
    title.value = '';
    details.value = '';
    occasion.value = '約會';
    weather.value = '涼爽';
    whenLabel.value = '明天';
    selectedVibes.value = ['Soft'];
    selectedClosetItemIds.value = [];
    showValidation.value = false;

    if (contextItem.value) {
      const item = contextItem.value;
      const name = item.name_zh || item.name || '這件單品';
      title.value = `這件${name}，想請衣友幫忙搭配`;
      details.value = `我很少穿這件${name}，想請衣友幫我找找適合的搭配。`;
      if (!selectedClosetItemIds.value.includes(item.id)) {
        selectedClosetItemIds.value.push(item.id);
      }
    }
  },
  { immediate: true }
);

const selectAllClosetItems = () => {
  selectedClosetItemIds.value = ownedClosetItems.value.map((item) => item.id);
};

const clearClosetItems = () => {
  selectedClosetItemIds.value = [];
};

const close = () => {
  if (submitting.value) return;
  appStore.isSosFormOpen = false;
  appStore.sosTargetItemId = null;
};

const handleSubmit = async () => {
  if (submitting.value || !sosStore.canPublish) return;
  sosStore.clearError();
  if (!selectedVibes.value.length) {
    appStore.showToast('至少選一個想呈現的風格');
    return;
  }
  if (!selectedClosetItemIds.value.length) {
    showValidation.value = true;
    appStore.showToast('請至少選擇 1 件要公開給衣友的衣物。');
    return;
  }

  submitting.value = true;
  let success = false;
  try { success = await sosStore.createSosPost({
    title: title.value,
    details: details.value,
    occasion: occasion.value,
    weather: weather.value,
    when_label: whenLabel.value,
    vibes: selectedVibes.value,
    closet_item_ids: selectedClosetItemIds.value
  }); } finally { submitting.value = false; }

  if (success) {
    close();
  }
};
</script>

