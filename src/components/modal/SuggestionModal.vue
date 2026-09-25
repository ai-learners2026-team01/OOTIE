<template>
  <div v-if="appStore.isSuggestionFormOpen && targetPost" class="modal-backdrop open" @click.self="close">
    <section class="modal suggestion-form-modal">
      <button class="modal-close" aria-label="關閉" @click="close">×</button>
      <p class="eyebrow">Style SOS</p>
      <h2>幫她搭一套</h2>
      <p class="suggestion-intro">
        正在為 {{ targetPost.username }} 的「{{ targetPost.title }}」挑選搭配。
      </p>

      <form @submit.prevent="handleSubmit">
        <div class="form-field">
          <label>選擇單品</label>
          <div class="suggestion-items">
            <label
              v-for="item in availableItems"
              :key="item.id"
              :class="['suggestion-item', { selected: selectedIds.includes(item.id) }]"
            >
              <input type="checkbox" :value="item.id" v-model="selectedIds" />
              <img :src="item.photo" :alt="item.name_zh || item.name" />
              <span>{{ item.name_zh || item.name }}</span>
            </label>
          </div>
          <p class="suggestion-selected">已選 {{ selectedIds.length }} 件</p>

          <div :class="['current-outfit', { visible: selectedItems.length > 0 }]">
            <div class="current-outfit-title">目前搭配</div>
            <div class="current-outfit-images">
              <template v-for="(item, idx) in selectedItems" :key="item.id">
                <span v-if="idx > 0" class="outfit-plus">＋</span>
                <img :src="item.photo" :alt="item.name_zh || item.name" />
              </template>
            </div>
            <p class="current-outfit-names">
              {{ selectedItems.map((i) => i.name_zh || i.name).join(' ＋ ') }}
            </p>
          </div>
        </div>

        <div class="form-field" style="margin-top:18px">
          <label for="suggestionMessage">給她的搭配建議</label>
          <textarea
            id="suggestionMessage"
            v-model="message"
            required
            placeholder="說說你為什麼這樣搭，或提醒她一些小細節"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="secondary" @click="close">取消</button>
          <button type="submit" class="primary">送出建議</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAppStore } from '@/stores/app';
import { useSosStore } from '@/stores/sos';

const appStore = useAppStore();
const sosStore = useSosStore();

const targetPost = computed(() => {
  return appStore.sosPosts.find((p) => p.id === appStore.activeSosId);
});

const availableItems = computed(() => appStore.items.slice(0, 8));

const selectedIds = ref([]);
const message = ref('');

const selectedItems = computed(() => {
  return selectedIds.value.map((id) => appStore.items.find((i) => i.id === id)).filter(Boolean);
});

watch(
  () => appStore.isSuggestionFormOpen,
  (open) => {
    if (!open) return;
    selectedIds.value = [];
    message.value = '';
  }
);

const close = () => {
  appStore.isSuggestionFormOpen = false;
};

const handleSubmit = () => {
  if (!selectedIds.value.length) {
    appStore.showToast('至少選一件衣物來搭配');
    return;
  }
  sosStore.submitSuggestion({
    sosId: appStore.activeSosId,
    selectedIds: selectedIds.value,
    message: message.value
  });
  close();
};
</script>
