<template>
  <nav class="bottom-nav" aria-label="手機版導覽">
    <router-link to="/">
      <span>⌂</span>首頁
    </router-link>
    <router-link to="/closet">
      <span>▦</span>衣櫥
    </router-link>
    <button class="add" aria-label="新增單品" @click="openAddForm">
      +
    </button>
    <router-link to="/sos">
      <span>♡</span>求救
    </router-link>
    <router-link to="/profile">
      <span>◯</span>我的
    </router-link>
  </nav>
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

const openAddForm = () => {
  appStore.editingItemId = null;
  appStore.isItemFormOpen = true;
};
</script>
