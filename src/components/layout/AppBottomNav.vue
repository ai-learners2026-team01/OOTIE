<template>
  <div class="bottom-nav-wrapper">
    <div v-if="isQuickMenuOpen" class="quick-action-backdrop" @click="isQuickMenuOpen = false"></div>
    <div :class="['quick-action-menu', { open: isQuickMenuOpen }]">
      <button
        type="button"
        :class="['quick-action-item', { active: route.path === '/sos' }]"
        @click="triggerQuickAction('go-sos')"
      >
        <span class="quick-action-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M20.8 8.8c0 4.1-8.8 10.2-8.8 10.2S3.2 12.9 3.2 8.8A4.3 4.3 0 0 1 12 6.7a4.3 4.3 0 0 1 8.8 2.1Z" />
          </svg>
        </span>
        <span class="quick-action-label">穿搭求救</span>
      </button>
      <button
        type="button"
        :class="['quick-action-item', { active: route.path === '/bookmarks' }]"
        @click="triggerQuickAction('go-bookmarks')"
      >
        <span class="quick-action-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M6 3h12v18l-6-4-6 4V3Z" />
          </svg>
        </span>
        <span class="quick-action-label">書籤</span>
      </button>
      <button
        type="button"
        :class="['quick-action-item', { active: route.path === '/ai' }]"
        @click="triggerQuickAction('go-ai')"
      >
        <span class="quick-action-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="m8 3 1.4 4.6L14 9l-4.6 1.4L8 15l-1.4-4.6L2 9l4.6-1.4L8 3Zm10 9 1.1 3.2L22 16l-2.9.8L18 20l-.9-3.2L14 16l3.1-.8L18 12Z" />
          </svg>
        </span>
        <span class="quick-action-label">AI 助手</span>
      </button>
      <button
        type="button"
        :class="['quick-action-item', { active: route.path === '/tryon' }]"
        @click="triggerQuickAction('go-tryon')"
      >
        <span class="quick-action-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M8 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M12 16v4m-3 1h6" />
          </svg>
        </span>
        <span class="quick-action-label">虛擬試穿</span>
      </button>
      <button
        type="button"
        :class="['quick-action-item', { active: route.path === '/stats' }]"
        @click="triggerQuickAction('go-stats')"
      >
        <span class="quick-action-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M5 20v-8h3v8m3 0V5h3v15m3 0V9h3v11M3 20h18" />
          </svg>
        </span>
        <span class="quick-action-label">衣櫥統計</span>
      </button>
    </div>

    <nav class="bottom-nav" aria-label="手機版導覽">
      <router-link to="/explore">
        <span class="mobile-nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z" />
          </svg>
        </span>探索
      </router-link>
      <router-link to="/">
        <span class="mobile-nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="m3 10.5 9-7.5 9 7.5V21h-6v-6H9v6H3z" />
          </svg>
        </span>首頁
      </router-link>
      <div class="quick-action-wrap">
        <button
          type="button"
          :class="['quick-action-trigger', { open: isQuickMenuOpen }]"
          aria-label="快速選單"
          @click="isQuickMenuOpen = !isQuickMenuOpen"
        >
          <svg v-if="!isQuickMenuOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M12 5v14m-7-7h14" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <router-link to="/closet">
        <span class="mobile-nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M5 3h14a1 1 0 0 1 1 1v16H4V4a1 1 0 0 1 1-1Z" />
            <path d="M12 4v16m-3.5-9v.01m7 0v.01" />
          </svg>
        </span>衣櫥
      </router-link>
      <router-link to="/profile">
        <span class="mobile-nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
        </span>個人
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const isQuickMenuOpen = ref(false);

const triggerQuickAction = (action) => {
  isQuickMenuOpen.value = false;
  if (action === 'go-sos') {
    router.push('/sos');
  } else if (action === 'go-bookmarks') {
    router.push('/bookmarks');
  } else if (action === 'go-ai') {
    router.push('/ai');
  } else if (action === 'go-tryon') {
    router.push('/tryon');
  } else if (action === 'go-stats') {
    router.push('/stats');
  }
};
</script>
