<template>
  <header class="topbar">
    <div class="mobile-brand">OOTie</div>
    <div class="top-actions">
      <button class="icon-button" aria-label="通知" @click="openNotifications">
        ♧
        <span
          v-if="unreadCount > 0"
          class="notification-badge"
        >{{ unreadCount }}</span>
      </button>
      <div class="avatar" :class="{ 'has-image': appStore.profile.avatar_url }">
        <img v-if="appStore.profile.avatar_url" :src="appStore.profile.avatar_url" :alt="`${appStore.profile.name} 的大頭貼`" />
        <template v-else>{{ appStore.profile.initials }}</template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

const unreadCount = computed(() => {
  return appStore.notifications.filter((n) => !n.read).length;
});

const openNotifications = () => {
  appStore.notifications.forEach((n) => (n.read = true));
  appStore.isNotificationOpen = true;
};
</script>
