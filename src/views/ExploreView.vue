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
          class="ootd-card clickable"
          :style="{ animationDelay: `${index * 45}ms` }"
          @click="openLightbox(post)"
        >
          <img
            class="ootd-photo"
            :src="post.image"
            :alt="`${post.username} 的穿搭`"
            role="button"
            tabindex="0"
          />
          <div class="ootd-body">
            <div class="ootd-user">
              <div class="ootd-user-info" role="button" tabindex="0" @click.stop="goToProfile(post.username)">
                <div class="ootd-avatar">{{ post.initials }}</div>
                <div>
                  <strong class="user-link-text">{{ post.username }}</strong>
                  <span>今日分享</span>
                </div>
              </div>
              <button
                v-if="post.username !== appStore.profile.username"
                type="button"
                :class="['btn-follow-chip', { following: appStore.isFollowingUser(post.username) }]"
                @click.stop="handleToggleFollow(post.username)"
              >
                {{ appStore.isFollowingUser(post.username) ? '已追蹤' : '＋ 追蹤' }}
              </button>
            </div>
            <p class="ootd-caption">{{ post.caption }}</p>
            <div class="ootd-tags">{{ (post.hashtags || []).join('　') }}</div>
            <div class="ootd-actions">
              <button
                :class="['ootd-action', { liked: post.liked }]"
                @click.stop="ootdStore.toggleLike(post.id)"
              >
                {{ post.liked ? '👍' : '👍🏻' }} {{ post.likes }}
              </button>
              <button class="ootd-action" @click.stop="openComments(post.id)">
                🗨 {{ post.commentList?.length ?? post.comments ?? 0 }}
              </button>
              <button class="ootd-action" @click.stop="ootdStore.sharePost(post.id)">
                ↗ 分享
              </button>
            </div>
          </div>
        </article>
      </template>

      <div v-else class="explore-empty">
        找不到符合的穿搭，換個關鍵字試試看吧。
      </div>
    </div>

    <!-- 貼文放大燈箱彈窗 (方案 A) -->
    <div
      v-if="activeLightboxPost"
      class="modal-backdrop open lightbox-backdrop"
      @click.self="activeLightboxPost = null"
    >
      <div class="modal ootd-lightbox-modal">
        <button class="modal-close" aria-label="關閉" @click="activeLightboxPost = null">×</button>
        <div class="lightbox-layout">
          <div class="lightbox-image-wrap" @click.self="activeLightboxPost = null">
            <img
              :src="activeLightboxPost.image"
              :alt="`${activeLightboxPost.username} 的穿搭大圖`"
              class="lightbox-zoom-img"
            />
          </div>
          <div class="lightbox-details">
            <div class="ootd-user">
              <div class="ootd-user-info" role="button" tabindex="0" @click="goToProfile(activeLightboxPost.username)">
                <div class="ootd-avatar">{{ activeLightboxPost.initials }}</div>
                <div>
                  <strong class="user-link-text">{{ activeLightboxPost.username }}</strong>
                  <span>今日分享</span>
                </div>
              </div>
              <button
                v-if="activeLightboxPost.username !== appStore.profile.username"
                type="button"
                :class="['btn-follow-chip', { following: appStore.isFollowingUser(activeLightboxPost.username) }]"
                @click.stop="handleToggleFollow(activeLightboxPost.username)"
              >
                {{ appStore.isFollowingUser(activeLightboxPost.username) ? '已追蹤' : '＋ 追蹤' }}
              </button>
            </div>

            <p class="lightbox-caption">{{ activeLightboxPost.caption }}</p>

            <div
              v-if="activeLightboxPost.wearing && activeLightboxPost.wearing.length"
              class="lightbox-wearing"
            >
              <span class="wearing-title">穿搭單品：</span>
              <span>{{ activeLightboxPost.wearing.join('、') }}</span>
            </div>

            <div
              v-if="activeLightboxPost.hashtags && activeLightboxPost.hashtags.length"
              class="ootd-tags"
            >
              {{ activeLightboxPost.hashtags.join('　') }}
            </div>

            <section class="lightbox-comments" aria-label="貼文留言">
              <h3>留言 {{ activeLightboxPost.commentList?.length ?? activeLightboxPost.comments ?? 0 }}</h3>
              <div class="lightbox-comment-list">
                <div
                  v-for="comment in activeLightboxPost.commentList || []"
                  :key="comment.id"
                  class="lightbox-comment"
                >
                  <button class="comment-user-link" type="button" @click="goToProfile(comment.user)">
                    {{ comment.user }}
                  </button>
                  <span>{{ comment.text }}</span>
                  <button
                    v-if="isOwnComment(comment)"
                    type="button"
                    class="comment-delete-action"
                    aria-label="刪除我的留言"
                    @click="deleteLightboxComment(comment)"
                  >刪除</button>
                </div>
                <p v-if="!activeLightboxPost.commentList?.length" class="lightbox-comment-empty">
                  還沒有留言，成為第一個留言的人吧。
                </p>
              </div>
              <form class="lightbox-comment-form" @submit.prevent="submitLightboxComment">
                <input
                  ref="lightboxCommentInput"
                  v-model="lightboxCommentText"
                  aria-label="輸入留言"
                  placeholder="寫下你的想法"
                />
                <button type="submit" class="primary">送出</button>
              </form>
            </section>

            <div class="lightbox-actions">
              <button
                :class="['ootd-action', { liked: activeLightboxPost.liked }]"
                @click="ootdStore.toggleLike(activeLightboxPost.id)"
              >
                {{ activeLightboxPost.liked ? '👍' : '👍🏻' }} {{ activeLightboxPost.likes }}
              </button>
              <button class="ootd-action" @click="openComments(activeLightboxPost.id)">
                🗨 {{ activeLightboxPost.commentList?.length ?? activeLightboxPost.comments ?? 0 }}
              </button>
              <button class="ootd-action" @click="ootdStore.sharePost(activeLightboxPost.id)">
                ↗ 分享
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useOotdStore } from '@/stores/ootd';

const appStore = useAppStore();
const ootdStore = useOotdStore();
const route = useRoute();
const router = useRouter();

const activeLightboxPost = ref(null);
const lightboxCommentText = ref('');
const lightboxCommentInput = ref(null);

const openLightbox = (post) => {
  activeLightboxPost.value = post;
  lightboxCommentText.value = '';
};

const handleToggleFollow = (username) => {
  const nextState = !appStore.isFollowingUser(username);
  appStore.setFollowingUser(username, nextState);
  appStore.showToast(nextState ? `已開始追蹤 ${username}` : `已取消追蹤 ${username}`);
};

const openComments = (postId) => {
  const post = appStore.ootdPosts.find((item) => String(item.id) === String(postId));
  if (!post) return;
  activeLightboxPost.value = post;
  lightboxCommentText.value = '';
  nextTick(() => lightboxCommentInput.value?.focus());
};

const submitLightboxComment = () => {
  if (!lightboxCommentText.value.trim() || !activeLightboxPost.value) return;
  ootdStore.addComment(activeLightboxPost.value.id, lightboxCommentText.value);
  lightboxCommentText.value = '';
};

const isOwnComment = (comment) => {
  return appStore.normalizeUsername(comment.user) === appStore.normalizeUsername(appStore.profile.username);
};

const deleteLightboxComment = (comment) => {
  if (!activeLightboxPost.value || !isOwnComment(comment)) return;
  if (confirm('確定要刪除這則留言嗎？')) {
    ootdStore.deleteComment(activeLightboxPost.value.id, comment.id);
  }
};

const goToProfile = (username) => {
  activeLightboxPost.value = null;
  appStore.isCommentOpen = false;
  router.push({ path: '/profile', query: { user: username } });
};

const handleKeydown = (e) => {
  if (e.key === 'Escape' && activeLightboxPost.value) {
    activeLightboxPost.value = null;
  }
};

const checkDeepLink = () => {
  const postId = route.query.post;
  const commentId = route.query.comment;
  if (postId) {
    const post = appStore.ootdPosts.find((p) => String(p.id) === String(postId));
    if (post) {
      if (commentId) {
        appStore.activeCommentPostId = post.id;
        appStore.highlightedCommentId = commentId || null;
        appStore.isCommentOpen = true;
      } else {
        activeLightboxPost.value = post;
      }
    }
  }
};

onMounted(() => {
  checkDeepLink();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

watch(
  () => route.query,
  () => {
    checkDeepLink();
  }
);
</script>
