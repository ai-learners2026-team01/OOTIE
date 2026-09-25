<template>
  <div v-if="appStore.isSosFormOpen" class="modal-backdrop open" @click.self="close">
    <section class="modal sos-form-modal">
      <button class="modal-close" aria-label="關閉" @click="close">×</button>
      <p class="eyebrow">Style SOS</p>
      <h2>請衣友幫忙搭配</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-field">
          <label for="sosTitle">標題</label>
          <input
            id="sosTitle"
            v-model="title"
            required
            placeholder="例如：明天第一次約會，我該穿什麼？"
          />
        </div>

        <div class="form-field" style="margin-top:16px">
          <label for="sosDetails">告訴衣友更多</label>
          <textarea
            id="sosDetails"
            v-model="details"
            required
            placeholder="描述你的行程、期待的感覺或穿搭困擾"
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
              {{ vibe }}
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="secondary" @click="close">取消</button>
          <button type="submit" class="primary">發布求救</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAppStore } from '@/stores/app';
import { useSosStore } from '@/stores/sos';

const appStore = useAppStore();
const sosStore = useSosStore();

const availableVibes = ['Soft', 'Elegant', 'Smart Casual', 'Relaxed', 'Confident', 'Playful'];

const title = ref('');
const details = ref('');
const occasion = ref('約會');
const weather = ref('涼爽');
const whenLabel = ref('明天');
const selectedVibes = ref([]);

watch(
  () => appStore.isSosFormOpen,
  (open) => {
    if (!open) return;
    title.value = '';
    details.value = '';
    occasion.value = '約會';
    weather.value = '涼爽';
    whenLabel.value = '明天';
    selectedVibes.value = [];
  }
);

const close = () => {
  appStore.isSosFormOpen = false;
};

const handleSubmit = () => {
  if (!selectedVibes.value.length) {
    appStore.showToast('至少選一個想呈現的風格');
    return;
  }
  sosStore.createSosPost({
    title: title.value,
    details: details.value,
    occasion: occasion.value,
    weather: weather.value,
    when_label: whenLabel.value,
    vibes: selectedVibes.value
  });
  close();
};
</script>
