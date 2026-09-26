<template>
  <aside :class="['sidebar', { collapsed: appStore.isSidebarCollapsed }]">
    <div class="brand-row">
      <div class="brand">OOTie</div>
      <button
        type="button"
        class="sidebar-toggle"
        @click="appStore.toggleSidebar()"
        :aria-label="appStore.isSidebarCollapsed ? '展開側欄' : '收合側欄'"
        :aria-expanded="!appStore.isSidebarCollapsed"
      >
        <span class="toggle-icon">{{ appStore.isSidebarCollapsed ? '❯' : '❮' }}</span>
      </button>
    </div>
    <nav class="nav" aria-label="主選單">
      <router-link to="/" title="首頁">
        <span class="nav-icon">⌂</span><span class="nav-text">首頁</span>
      </router-link>
      <router-link to="/explore" title="探索">
        <span class="nav-icon">✦</span><span class="nav-text">探索</span>
      </router-link>
      <router-link to="/closet" title="我的衣櫥">
        <span class="nav-icon">▦</span><span class="nav-text">我的衣櫥</span>
      </router-link>
      <router-link to="/bookmarks" title="書籤">
        <span class="nav-icon">🔖</span><span class="nav-text">書籤</span>
      </router-link>
      <router-link to="/stats" title="衣櫥統計">
        <span class="nav-icon">▥</span><span class="nav-text">衣櫥統計</span>
      </router-link>
      <router-link to="/sos" title="穿搭求救">
        <span class="nav-icon">♡</span><span class="nav-text">穿搭求救</span>
      </router-link>
      <router-link to="/ai" title="AI 助手">
        <span class="nav-icon">✨</span><span class="nav-text">AI 助手</span>
      </router-link>
      <router-link to="/tryon" title="虛擬試穿">
        <span class="nav-icon">🪞</span><span class="nav-text">虛擬試穿</span>
      </router-link>
      <router-link to="/profile" title="個人檔案">
        <span class="nav-icon">◯</span><span class="nav-text">個人檔案</span>
      </router-link>
    </nav>
    <div class="sidebar-footer" v-if="!appStore.isSidebarCollapsed">
      你的衣櫥，是每天選擇穿搭的<br />專屬空間。
    </div>
  </aside>
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
</script>
