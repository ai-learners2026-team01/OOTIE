<template>
  <div v-if="appStore.isNotificationOpen" class="modal-backdrop open" @click.self="close">
    <section class="modal notification-modal">
      <button class="modal-close" aria-label="關閉" @click="close">×</button>
      <p class="eyebrow">Community</p>
      <h2>通知</h2>

      <div class="notification-list">
        <div
          v-for="notification in appStore.notifications"
          :key="notification.id"
          :class="['notification-item', { unread: !notification.read }]"
          @click="handleNotificationClick(notification, $event)"
        >
          <span v-html="formatNotificationText(notification)"></span>
          <span class="notification-time">{{ notification.time }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const router = useRouter();

// Mark all notifications read when opened
watch(
  () => appStore.isNotificationOpen,
  (isOpen) => {
    if (isOpen && appStore.notifications) {
      appStore.notifications.forEach((n) => {
        n.read = true;
      });
    }
  }
);

const close = () => {
  appStore.isNotificationOpen = false;
};

const formatNotificationText = (notification) => {
  if (!notification || !notification.text) return '';
  // Wrap @username in clickable span
  return notification.text.replace(/(@[a-zA-Z0-9_-]+)/g, '<span class="notification-user-link" data-user="$1">$1</span>');
};

const handleNotificationClick = (notification, event) => {
  // Check if clicked element was a user link
  const userLink = event.target.closest('.notification-user-link');
  if (userLink && userLink.dataset.user) {
    event.stopPropagation();
    close();
    router.push({ path: '/profile', query: { user: userLink.dataset.user } });
    return;
  }

  close();

  if (notification.type === 'follow' && notification.userId) {
    router.push({ path: '/profile', query: { user: notification.userId } });
    return;
  }

  if (notification.postId) {
    const post = appStore.ootdPosts.find((p) => String(p.id) === String(notification.postId));
    if (!post) {
      appStore.showToast('找不到這則通知對應的貼文');
      return;
    }
    appStore.activeCommentPostId = post.id;
    appStore.highlightedCommentId = notification.commentId || null;
    appStore.isCommentOpen = true;
    router.push({ path: '/explore', query: { post: post.id, comment: notification.commentId } });
    return;
  }

  if (notification.sosId) {
    // SOS owns lookup/error handling and reply positioning, including reloads.
    router.push({ path: '/sos', query: { sos: String(notification.sosId), suggestion: notification.suggestionId || undefined, comment: notification.commentId || undefined } });
    return;
  }

  const target = notification.target ? `/${notification.target}` : '/profile';
  router.push(target);
};
</script>
