<template>
  <section class="page active" id="homePage">
    <p class="eyebrow">早安，{{ appStore.profile.name.split(' ')[0] }}</p>
    <h1>今天想穿什麼？</h1>
    <p class="intro">從你的衣櫥裡，找一點靈感開始今天。</p>

    <div class="home-hero">
      <div class="welcome-panel">
        <p class="eyebrow">選擇今天的情境</p>
        <h2>讓穿搭替你進入今天的狀態。</h2>
        <p>選一個場合，OOTie 會從你的衣櫥挑出一套提案。</p>
        <div class="occasion-row">
          <button
            v-for="occ in occasions"
            :key="occ.label"
            :class="['occasion', { selected: selectedOccasionLabel === occ.label }]"
            @click="selectOccasion(occ.label)"
          >
            {{ occ.label }}
          </button>
        </div>
      </div>

      <div class="recommendation">
        <div>
          <p class="eyebrow">OOTie 為你挑了一套</p>
          <h3>{{ currentOccasion.title }}</h3>
          <p>{{ currentOccasion.copy }}</p>
        </div>
        <div class="outfit-mini">
          <template v-for="id in currentOccasion.picks" :key="id">
            <img
              v-if="getItemById(id)"
              :src="getItemById(id).photo"
              :alt="getItemById(id).name_zh || getItemById(id).name"
            />
          </template>
        </div>
      </div>
    </div>

    <div class="section-heading">
      <h2>最近加入衣櫥</h2>
      <router-link class="text-link" to="/closet">查看全部 →</router-link>
    </div>
    <div class="recent-row">
      <a
        v-for="item in recentItems"
        :key="item.id"
        class="recent-card"
        @click.prevent="openDetail(item.id)"
      >
        <div class="item-image">
          <img :src="item.photo" :alt="item.name_zh || item.name" loading="lazy" />
        </div>
        <h3>{{ item.name_zh || item.name }}</h3>
      </a>
    </div>

    <div class="home-columns">
      <section>
        <div class="section-heading">
          <h2>Style SOS</h2>
          <router-link class="text-link" to="/sos">查看更多 →</router-link>
        </div>
        <div class="sos-list">
          <article class="sos-card">
            <strong>第一次約會，要怎麼穿？</strong>
            <span>Soft · Elegant　32 件衣服可選</span>
          </article>
          <article class="sos-card">
            <strong>面試新創公司，西裝會不會太正式？</strong>
            <span>Smart Casual · 明天</span>
          </article>
        </div>
      </section>

      <section>
        <div class="section-heading">
          <h2>OOTD Inspiration</h2>
          <router-link class="text-link" to="/explore">探索更多 →</router-link>
        </div>
        <div class="inspiration-grid">
          <figure class="inspiration-card">
            <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85" alt="城市穿搭靈感" />
            <figcaption>@minji · #everydaystyle</figcaption>
          </figure>
          <figure class="inspiration-card">
            <img src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=700&q=85" alt="簡約穿搭靈感" />
            <figcaption>@sofia · #minimal</figcaption>
          </figure>
          <figure class="inspiration-card">
            <img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=85" alt="週末穿搭靈感" />
            <figcaption>@nora · #weekend</figcaption>
          </figure>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAppStore } from '@/stores/app';
import { occasions } from '@/constants';

const appStore = useAppStore();

const selectedOccasionLabel = ref('隨性');

const currentOccasion = computed(() => {
  return occasions.find((o) => o.label === selectedOccasionLabel.value) || occasions[3];
});

const recentItems = computed(() => {
  return appStore.items.slice(0, 4);
});

const selectOccasion = (label) => {
  selectedOccasionLabel.value = label;
};

const getItemById = (id) => {
  return appStore.items.find((i) => i.id === id);
};

const openDetail = (id) => {
  appStore.selectedItemId = id;
  appStore.isDetailOpen = true;
};
</script>
