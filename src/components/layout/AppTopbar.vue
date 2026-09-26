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

      <!-- Auth State Indicator -->
      <button v-if="!authStore.isLoggedIn" class="btn-primary auth-btn-sm" @click="authStore.openAuthModal('login')">
        登入 / 註冊
      </button>

      <div v-else class="avatar-group">
        <div class="avatar" :class="{ 'has-image': appStore.profile.avatar_url }">
          <img v-if="appStore.profile.avatar_url" :src="appStore.profile.avatar_url" :alt="`${appStore.profile.name} 的大頭貼`" />
          <template v-else>{{ appStore.profile.initials }}</template>
        </div>
        <button class="btn-text-muted" @click="authStore.logout">登出</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const appStore = useAppStore();
const authStore = useAuthStore();

const unreadCount = computed(() => {
  return appStore.notifications.filter((n) => !n.read).length;
});

const openNotifications = () => {
  appStore.notifications.forEach((n) => (n.read = true));
  appStore.isNotificationOpen = true;
};

onMounted(() => {
  authStore.initAuth();
});
</script>

<style scoped>
.auth-btn-sm {
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 20px;
}

.avatar-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-text-muted {
  background: none;
  border: none;
  color: var(--text-muted, #a0a0a5);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 4px 8px;
}
.btn-text-muted:hover {
  color: #fff;
}
</style>
