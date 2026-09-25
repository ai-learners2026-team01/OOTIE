<template>
  <div v-if="appStore.isNotificationOpen" class="modal-backdrop open" @click.self="close">
    <section class="modal notification-modal">
      <button class="modal-close" aria-label="關閉" @click="close">×</button>
      <p class="eyebrow">Community</p>
      <h2>通知</h2>

      <div class="notification-list">
        <button
          v-for="notification in appStore.notifications"
          :key="notification.id"
          type="button"
          :class="['notification-item', { unread: !notification.read }]"
          @click="navigate(notification.target)"
        >
          {{ notification.text }}
          <span class="notification-time">{{ notification.time }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const router = useRouter();

const close = () => {
  appStore.isNotificationOpen = false;
};

const navigate = (target) => {
  close();
  const route = target ? `/${target}` : '/profile';
  router.push(route);
};
</script>
