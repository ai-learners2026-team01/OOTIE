<template>
  <div class="bottom-nav-wrapper">
    <div v-if="isQuickMenuOpen" class="quick-action-backdrop" @click="isQuickMenuOpen = false"></div>
    <div :class="['quick-action-menu', { open: isQuickMenuOpen }]">
      <button type="button" class="quick-action-item" @click="triggerQuickAction('add-item')">
        <span class="quick-action-icon">＋</span>
        <span>
          <strong>加入單品</strong>
          <small>上傳衣服、建立記錄</small>
        </span>
      </button>
      <button type="button" class="quick-action-item" @click="triggerQuickAction('add-ootd')">
        <span class="quick-action-icon">✦</span>
        <span>
          <strong>發布 OOTD</strong>
          <small>分享今天的穿搭照片</small>
        </span>
      </button>
      <button type="button" class="quick-action-item" @click="triggerQuickAction('add-sos')">
        <span class="quick-action-icon">♡</span>
        <span>
          <strong>發布求救</strong>
          <small>讓衣友為你提供搭配建議</small>
        </span>
      </button>
      <button type="button" class="quick-action-item" @click="triggerQuickAction('add-bookmark')">
        <span class="quick-action-icon">🔖</span>
        <span>
          <strong>加入書籤</strong>
          <small>收藏心儀商品與穿搭靈感</small>
        </span>
      </button>
      <button type="button" class="quick-action-item" @click="triggerQuickAction('go-ai')">
        <span class="quick-action-icon">✨</span>
        <span>
          <strong>AI 穿搭助手</strong>
          <small>情境場合與天氣靈感提案</small>
        </span>
      </button>
      <button type="button" class="quick-action-item" @click="triggerQuickAction('go-tryon')">
        <span class="quick-action-icon">🪞</span>
        <span>
          <strong>虛擬試穿</strong>
          <small>AI 模特兒與單品換裝模擬</small>
        </span>
      </button>
      <button type="button" class="quick-action-item" @click="triggerQuickAction('go-stats')">
        <span class="quick-action-icon">▥</span>
        <span>
          <strong>衣櫥統計</strong>
          <small>色系分佈、品牌與冷宮報告</small>
        </span>
      </button>
    </div>

    <nav class="bottom-nav" aria-label="手機版導覽">
      <router-link to="/explore">
        <span>✦</span>探索
      </router-link>
      <router-link to="/">
        <span>⌂</span>首頁
      </router-link>
      <div class="quick-action-wrap">
        <button
          type="button"
          :class="['quick-action-trigger', { open: isQuickMenuOpen }]"
          aria-label="快速選單"
          @click="isQuickMenuOpen = !isQuickMenuOpen"
        >
          ＋
        </button>
      </div>
      <router-link to="/closet">
        <span>▦</span>衣櫥
      </router-link>
      <router-link to="/profile">
        <span>◯</span>我的
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useBookmarksStore } from '@/stores/bookmarks';

const appStore = useAppStore();
const bookmarksStore = useBookmarksStore();
const route = useRoute();
const router = useRouter();

const isQuickMenuOpen = ref(false);

const triggerQuickAction = (action) => {
  isQuickMenuOpen.value = false;
  if (action === 'add-item') {
    if (route.path === '/closet') {
      appStore.editingItemId = null;
      appStore.isItemFormOpen = true;
    } else {
      router.push({ path: '/closet', query: { quick: 'add-item' } });
    }
  } else if (action === 'add-ootd') {
    if (route.path === '/explore') {
      appStore.isOotdFormOpen = true;
    } else {
      router.push({ path: '/explore', query: { quick: 'add-ootd' } });
    }
  } else if (action === 'add-sos') {
    if (route.path === '/sos') {
      appStore.isSosFormOpen = true;
    } else {
      router.push({ path: '/sos', query: { quick: 'add-sos' } });
    }
  } else if (action === 'add-bookmark') {
    if (route.path === '/bookmarks') {
      bookmarksStore.openCreateForm();
    } else {
      router.push({ path: '/bookmarks', query: { quick: 'add-bookmark' } });
    }
  } else if (action === 'go-ai') {
    router.push('/ai');
  } else if (action === 'go-tryon') {
    router.push('/tryon');
  } else if (action === 'go-stats') {
    router.push('/stats');
  }
};

watch(
  () => route.query.quick,
  (action) => {
    if (!action) return;
    if (action === 'add-item') {
      appStore.editingItemId = null;
      appStore.isItemFormOpen = true;
    } else if (action === 'add-ootd') {
      appStore.isOotdFormOpen = true;
    } else if (action === 'add-sos') {
      appStore.isSosFormOpen = true;
    } else if (action === 'add-bookmark') {
      bookmarksStore.openCreateForm();
    }
  },
  { immediate: true }
);
</script>
