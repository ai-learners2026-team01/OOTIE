<template>
  <section class="page active" id="sosPage">
    <p class="eyebrow">Style SOS</p>
    <h1>穿搭求救</h1>
    <p class="intro">衣友正在求救，從她真正擁有的衣櫥裡幫她搭一套。</p>

    <div class="sos-toolbar">
      <label class="sos-search">
        <span>⌕</span>
        <input
          v-model="sosStore.searchQuery"
          type="search"
          placeholder="搜尋場合或穿搭需求"
          aria-label="搜尋場合或穿搭需求"
        />
      </label>
      <button class="primary" @click="openSosForm">＋ 發布求救</button>
    </div>

    <div class="sos-feed">
      <template v-if="sosStore.filteredSosPosts.length">
        <article
          v-for="(post, index) in sosStore.filteredSosPosts"
          :key="post.id"
          class="sos-feed-card"
          :style="{ animationDelay: `${index * 45}ms` }"
        >
          <div class="sos-feed-user">
            <div class="sos-feed-avatar">{{ post.initials }}</div>
            <div>
              <strong>{{ post.username }}</strong>
              <span>穿搭求救</span>
            </div>
          </div>
          <h2>{{ post.title }}</h2>
          <div class="sos-meta">
            <span>場合｜{{ post.occasion }}</span>
            <span>天氣｜{{ post.weather }}</span>
            <span>時間｜{{ post.when_label }}</span>
          </div>
          <div class="sos-vibes">想呈現：{{ post.vibes.join('　') }}</div>
          <div class="sos-card-footer">
            <span class="sos-available">{{ post.closet_count }} 件衣服可選</span>
            <button class="sos-cta" @click="openSuggestion(post.id)">幫她搭配</button>
          </div>
        </article>
      </template>

      <div v-else class="sos-empty">
        找不到符合的求救貼文，換個關鍵字試試看吧。
      </div>
    </div>
  </section>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { useSosStore } from '@/stores/sos';

const appStore = useAppStore();
const sosStore = useSosStore();

const openSosForm = () => {
  appStore.isSosFormOpen = true;
};

const openSuggestion = (sosId) => {
  appStore.activeSosId = sosId;
  appStore.isSuggestionFormOpen = true;
};
</script>
