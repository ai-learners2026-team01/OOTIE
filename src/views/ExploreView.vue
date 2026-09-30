<template>
  <section class="page active" id="explorePage">
    <p class="eyebrow">OOTD Community</p>
    <h1>探索</h1>
    <p class="intro">看看衣友今天怎麼穿，也找到下一套靈感。</p>

    <div class="explore-toolbar">
      <label class="explore-search">
        <span>⌕</span>
        <input
          v-model="ootdStore.searchQuery"
          type="search"
          placeholder="搜尋穿搭、風格、使用者"
          aria-label="搜尋穿搭、風格、使用者"
        />
      </label>
      <div class="feed-tabs">
        <button
          :class="['feed-tab', { active: ootdStore.activeFeedTab === 'for-you' }]"
          @click="ootdStore.activeFeedTab = 'for-you'"
        >
          為你推薦
        </button>
        <button
          :class="['feed-tab', { active: ootdStore.activeFeedTab === 'following' }]"
          @click="ootdStore.activeFeedTab = 'following'"
        >
          追蹤中
        </button>
      </div>
    </div>

    <div class="ootd-grid">
      <template v-if="ootdStore.filteredPosts.length">
        <article
          v-for="(post, index) in ootdStore.filteredPosts"
          :key="post.id"
          class="ootd-card"
          :style="{ animationDelay: `${index * 45}ms` }"
        >
          <img
            class="ootd-photo"
            :src="post.image"
            :alt="`${post.username} 的穿搭`"
            role="button"
            tabindex="0"
            @click="openComments(post.id)"
          />
          <div class="ootd-body">
            <div class="ootd-user" role="button" tabindex="0" @click="goToProfile(post.username)">
              <div class="ootd-avatar">{{ post.initials }}</div>
              <div>
                <strong class="user-link-text">{{ post.username }}</strong>
                <span>今日分享</span>
              </div>
            </div>
            <p class="ootd-caption">{{ post.caption }}</p>
            <div class="ootd-tags">{{ (post.hashtags || []).join('　') }}</div>
            <div class="ootd-actions">
              <button
                :class="['ootd-action', { liked: post.liked }]"
                @click="ootdStore.toggleLike(post.id)"
              >
                {{ post.liked ? '👍' : '👍🏻' }} {{ post.likes }}
              </button>
              <button class="ootd-action" @click="openComments(post.id)">
                🗨 {{ post.comments }}
              </button>
              <button
                :class="['ootd-action', { saved: post.saved }]"
                @click="ootdStore.toggleSave(post.id)"
              >
                {{ post.saved ? '▣ 已收藏' : '▢ 收藏' }}
              </button>
            </div>
          </div>
        </article>
      </template>

      <div v-else class="explore-empty">
        找不到符合的穿搭，換個關鍵字試試看吧。
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useOotdStore } from '@/stores/ootd';

const appStore = useAppStore();
const ootdStore = useOotdStore();
const route = useRoute();
const router = useRouter();

const openComments = (postId) => {
  appStore.activeCommentPostId = postId;
  appStore.isCommentOpen = true;
};

const goToProfile = (username) => {
  router.push({ path: '/profile', query: { user: username } });
};

const checkDeepLink = () => {
  const postId = route.query.post;
  const commentId = route.query.comment;
  if (postId) {
    const post = appStore.ootdPosts.find((p) => String(p.id) === String(postId));
    if (post) {
      appStore.activeCommentPostId = post.id;
      appStore.highlightedCommentId = commentId || null;
      appStore.isCommentOpen = true;
    }
  }
};

onMounted(() => {
  checkDeepLink();
});

watch(
  () => route.query,
  () => {
    checkDeepLink();
  }
);
</script>
