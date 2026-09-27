<template>
  <SosDialog v-if="appStore.isSuggestionFormOpen && targetPost" title="提供搭配建議" panel-class="suggestion-form-modal" :busy="submitting" @close="close">
      <p class="eyebrow">Style SOS</p>
      <h2>幫衣友搭一套</h2>
      <p class="suggestion-intro">
        正在為 {{ targetPost.username }} 的「{{ targetPost.title }}」挑選搭配。<br />
        <span style="font-size:12px; color:var(--sage-dark);">
          僅顯示本次選擇公開的 {{ availableItems.length }} 件衣物單品
        </span>
      </p>
      <p class="sos-note">{{ targetPost.occasion }} · {{ targetPost.weather }} · {{ targetPost.when_label }}<br />{{ targetPost.details }}</p>
      <p v-if="blockReason" class="sos-empty-note">{{ blockReason }}</p>

      <form @submit.prevent="handleSubmit">
        <div class="form-field">
          <label>選擇單品</label>
          <div v-if="availableItems.length" class="suggestion-items">
            <label
              v-for="item in availableItems"
              :key="item.id"
              :class="['suggestion-item', { selected: selectedIds.includes(item.id) }]"
            >
              <input type="checkbox" :value="item.id" v-model="selectedIds" :disabled="!!blockReason || submitting" />
              <SosClothingImage :src="item.photo" :alt="item.name_zh || item.name" />
              <span>{{ item.name_zh || item.name }}</span>
            </label>
          </div>
          <div v-else style="padding: 16px; border: 1px dashed var(--line); border-radius: 8px; color: var(--muted); font-size: 12px; text-align: center;">
            {{ publicClothingMessage(targetPost, sosStore.mode) }}
          </div>

          <p class="suggestion-selected">已選 {{ selectedIds.length }} 件</p>

          <div :class="['current-outfit', { visible: selectedItems.length > 0 }]">
            <div class="current-outfit-title">目前搭配</div>
            <SosOutfitBoard :items="selectedItems" />
          </div>
        </div>

        <div class="form-field" style="margin-top:18px">
          <label for="suggestionMessage">你的搭配建議</label>
          <textarea
            id="suggestionMessage"
            v-model="message"
            required
            maxlength="1000"
            :disabled="!!blockReason || submitting"
            placeholder="例如：襯衫紮一半、褲管捲一摺，外套留到晚上變涼時再穿。"
          ></textarea>
        </div>

        <p class="sos-note">每人可提供一套搭配，送出後可在留言區補充。</p>
        <p v-if="sosStore.lastError" class="sos-error" role="alert">{{ sosStore.lastError }}</p>
        <div class="form-actions">
          <button type="button" class="secondary" :disabled="submitting" @click="close">返回</button>
          <button type="submit" class="primary" :disabled="submitting || !!blockReason">{{ submitting ? '儲存中…' : '送出建議' }}</button>
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
import SosOutfitBoard from '@/features/sos/components/SosOutfitBoard.vue';
import { publicClothingMessage } from '@/features/sos/presentation';

const appStore = useAppStore();
const sosStore = useSosStore();
const submitting = ref(false);
const blockReason = computed(() => sosStore.getSuggestionBlockReason(targetPost.value));

const targetPost = computed(() => {
  return sosStore.sosPosts.find((p) => p.id === appStore.activeSosId);
});

const availableItems = computed(() => {
  return sosStore.getPublicItemsForSos(targetPost.value);
});

const selectedIds = ref([]);
const message = ref('');

const selectedItems = computed(() => {
  return selectedIds.value
    .map((id) => availableItems.value.find((item) => item.id === id))
    .filter(Boolean);
});

watch(
  () => [appStore.isSuggestionFormOpen, appStore.activeSosId],
  ([open]) => {
    if (!open) return;
    sosStore.clearError();
    selectedIds.value = [];
    message.value = '';
  },
  { immediate: true }
);

const close = () => {
  if (submitting.value) return;
  const sosId = appStore.activeSosId;
  appStore.isSuggestionFormOpen = false;
  appStore.activeSosId = null;
  if (sosId) { appStore.activeSosDetailId = sosId; appStore.isSosDetailOpen = true; }
};

const handleSubmit = async () => {
  if (submitting.value || blockReason.value) return;
  if (!selectedIds.value.length) {
    appStore.showToast('至少選一件衣物來搭配');
    return;
  }
  submitting.value = true;
  let success = false;
  try { success = await sosStore.submitSuggestion({
    sosId: appStore.activeSosId,
    selectedIds: selectedIds.value,
    message: message.value
  }); } finally { submitting.value = false; }
  if (success) {
    close();
  }
};
</script>
