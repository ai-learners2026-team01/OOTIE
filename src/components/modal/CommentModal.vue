<template>
  <div v-if="appStore.isCommentOpen && targetPost" class="modal-backdrop open" @click.self="close">
    <section class="modal comment-modal">
      <button class="modal-close" aria-label="關閉" @click="close">×</button>
      <p class="eyebrow">OOTD Community</p>
      <h2>留言</h2>

      <div class="comment-list">
        <template v-if="targetPost.commentList.length">
          <div
            v-for="(comment, index) in targetPost.commentList"
            :key="index"
            class="comment-item"
          >
            <strong
              class="comment-user-link"
              role="button"
              tabindex="0"
              title="查看個人檔案"
              @click="goToUserProfile(comment.user)"
              @keydown.enter="goToUserProfile(comment.user)"
            >{{ comment.user }}</strong>{{ comment.text }}
          </div>
        </template>
        <p v-else class="notification-time">還沒有留言，成為第一個留言的人吧。</p>
      </div>

      <form class="comment-form" @submit.prevent="handleSubmit">
        <input
          v-model="commentText"
          required
          placeholder="寫下你的想法"
        />
        <button class="primary" type="submit">送出</button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useOotdStore } from '@/stores/ootd';

const appStore = useAppStore();
const ootdStore = useOotdStore();
const router = useRouter();

const commentText = ref('');

const targetPost = computed(() => {
  return appStore.ootdPosts.find((p) => p.id === appStore.activeCommentPostId);
});

const goToUserProfile = (username) => {
  close();
  router.push({ path: '/profile', query: { user: username } });
};

watch(
  () => appStore.isCommentOpen,
  (open) => {
    if (!open) return;
    commentText.value = '';
  }
);

const close = () => {
  appStore.isCommentOpen = false;
};

const handleSubmit = () => {
  if (!commentText.value.trim() || !targetPost.value) return;
  ootdStore.addComment(targetPost.value.id, commentText.value);
  commentText.value = '';
};
</script>
