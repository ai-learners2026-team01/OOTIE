<template>
  <SosDialog v-if="sos.isInboxOpen" title="SOS 互動通知" @close="sos.isInboxOpen = false">
    <p class="eyebrow">Style SOS</p><h2>互動通知</h2>
    <p class="sos-note">{{ sos.actorProfile.username }} 的求救、留言與搭配動態</p>
    <p v-if="!sos.notifications.length" class="sos-empty-note">目前沒有新動態。衣友回覆或採納搭配後，會在這裡通知你。</p>
    <ul v-else class="sos-notice-list">
      <li v-for="notice in sos.notifications" :key="notice.id">
        <button type="button" :class="{ unread: !notice.read }" @click="openNotice(notice)">
          <strong>{{ notice.text }}</strong><span>{{ formatTime(notice.created_at) }} · 查看求救 →</span>
        </button>
      </li>
    </ul>
    <p v-if="sos.lastError" class="sos-error" role="alert">{{ sos.lastError }}</p>
  </SosDialog>
</template>
<script setup>
import { useRouter, useRoute } from 'vue-router';
import { useSosStore } from '@/stores/sos';
import { useAppStore } from '@/stores/app';
import SosDialog from './SosDialog.vue';
import { formatTime } from '../presentation';
const sos = useSosStore();
const app = useAppStore();
const router = useRouter();
const route = useRoute();
function openNotice(notice) {
  const post = sos.sosPosts.find(p => p.id === notice.sosId);
  if (!post) { app.showToast('這筆求救已無法查看。'); return; }
  sos.markNotificationRead(notice.id);
  sos.isInboxOpen = false;
  router.push({ path: '/sos', query: { ...route.query, sos: post.id, suggestion: notice.suggestionId || undefined, comment: notice.commentId || undefined } });
  // Clicking the same link twice should still reopen the detail.
  app.activeSosDetailId = post.id; app.isSosDetailOpen = true;
  sos.highlightedSuggestionId = notice.suggestionId; sos.highlightedCommentId = notice.commentId;
}
</script>
<style scoped>
.sos-notice-list { list-style: none; padding: 0; margin: 20px 0; display: grid; gap: 10px; }
.sos-notice-list button { width: 100%; text-align: left; padding: 17px; background: #faf9f6; border: 1px solid var(--line); border-radius: 12px; cursor: pointer; }
.sos-notice-list button.unread { border-left: 4px solid var(--sage-dark); background: #f1f4ec; }
.sos-notice-list strong { display: block; font-size: 14px; font-weight: 500; }
.sos-notice-list span { display: block; margin-top: 7px; color: var(--muted); font-size: 11px; }
</style>
