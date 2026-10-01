<template>
  <aside :class="['sidebar', { collapsed: appStore.isSidebarCollapsed }]">
    <div class="brand-row">
      <img class="brand" :src="brandLogo" alt="OOTie" />
      <button
        type="button"
        class="sidebar-toggle"
        @click="appStore.toggleSidebar()"
        :aria-label="appStore.isSidebarCollapsed ? '展開側欄' : '收合側欄'"
        :aria-expanded="!appStore.isSidebarCollapsed"
      >
        <span class="toggle-icon">
          <svg v-if="appStore.isSidebarCollapsed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="m9.5 5 7 7-7 7" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="m14.5 5-7 7 7 7" />
          </svg>
        </span>
      </button>
    </div>
    <nav class="nav" aria-label="主選單">
      <router-link to="/explore" title="探索">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z" />
          </svg>
        </span><span class="nav-text">探索</span>
      </router-link>
      <router-link to="/" title="首頁">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="m3 10.5 9-7.5 9 7.5V21h-6v-6H9v6H3z" />
          </svg>
        </span><span class="nav-text">首頁</span>
      </router-link>
      <router-link to="/closet" title="我的衣櫥">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M5 3h14a1 1 0 0 1 1 1v16H4V4a1 1 0 0 1 1-1Z" />
            <path d="M12 4v16m-3.5-9v.01m7 0v.01" />
          </svg>
        </span><span class="nav-text">我的衣櫥</span>
      </router-link>
      <router-link to="/bookmarks" title="書籤">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M6 3h12v18l-6-4-6 4V3Z" />
          </svg>
        </span><span class="nav-text">書籤</span>
      </router-link>
      <router-link to="/stats" title="衣櫥統計">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M5 20v-8h3v8m3 0V5h3v15m3 0V9h3v11M3 20h18" />
          </svg>
        </span><span class="nav-text">衣櫥統計</span>
      </router-link>
      <router-link to="/sos" title="穿搭求救">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M20.8 8.8c0 4.1-8.8 10.2-8.8 10.2S3.2 12.9 3.2 8.8A4.3 4.3 0 0 1 12 6.7a4.3 4.3 0 0 1 8.8 2.1Z" />
          </svg>
        </span><span class="nav-text">穿搭求救</span>
      </router-link>
      <router-link to="/ai" title="AI 助手">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="m8 3 1.4 4.6L14 9l-4.6 1.4L8 15l-1.4-4.6L2 9l4.6-1.4L8 3Zm10 9 1.1 3.2L22 16l-2.9.8L18 20l-.9-3.2L14 16l3.1-.8L18 12Z" />
          </svg>
        </span><span class="nav-text">AI 助手</span>
      </router-link>
      <router-link to="/tryon" title="虛擬試穿">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M8 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M12 16v4m-3 1h6" />
          </svg>
        </span><span class="nav-text">虛擬試穿</span>
      </router-link>
      <router-link to="/profile" title="個人檔案">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
        </span><span class="nav-text">個人檔案</span>
      </router-link>
    </nav>
    <div class="sidebar-footer" v-if="!appStore.isSidebarCollapsed">
      你的衣櫥，是每天選擇穿搭的<br />專屬空間。
    </div>
  </aside>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import brandLogo from '@/assets/brand/OOTie_Logo.png';

const appStore = useAppStore();
</script>
