<template>
  <section class="page active" id="profilePage">
    <div class="profile-top-bar" v-if="!isSelf">
      <router-link to="/explore" class="back-link">← 返回探索</router-link>
    </div>

    <p class="eyebrow">{{ isSelf ? '你的 OOTie 空間' : '衣友個人檔案' }}</p>
    <h1>{{ isSelf ? '個人檔案' : targetProfile.name }}</h1>

    <div class="profile-header">
      <div class="profile-avatar" :class="{ 'has-image': targetProfile.avatar_url }">
        <img
          v-if="targetProfile.avatar_url"
          :src="targetProfile.avatar_url"
          :alt="`${targetProfile.name} 的大頭貼`"
        />
        <template v-else>{{ targetProfile.initials }}</template>
      </div>
      <div class="profile-copy">
        <h2>{{ targetProfile.name }}</h2>
        <p class="handle">{{ targetProfile.username }}</p>
        <p class="bio">{{ targetProfile.bio }}</p>
      </div>
      <div class="profile-actions">
        <template v-if="isSelf">
          <button class="secondary" @click="openEditProfile">編輯資料</button>
          <button class="primary" @click="openOotdForm">＋ 發布 OOTD</button>
        </template>
        <template v-else>
          <button
            :class="['primary', { secondary: isFollowingTarget }]"
            @click="toggleFollowTarget"
          >
            {{ isFollowingTarget ? '已追蹤' : '＋ 追蹤' }}
          </button>
          <router-link
            class="secondary profile-closet-link"
            :to="{ path: '/closet', query: { user: targetProfile.username } }"
          >
            查看衣櫥
          </router-link>
        </template>
      </div>
    </div>

    <div class="profile-stats">
      <div class="profile-stat">
        <strong>{{ targetProfile.hearts }}</strong>
        <span>收到的 Hearts</span>
      </div>
      <div class="profile-stat">
        <strong>{{ targetProfile.helped }}</strong>
        <span>幫助衣友</span>
      </div>
      <div class="profile-stat">
        <strong>{{ targetProfile.likes }}</strong>
        <span>貼文獲得讚數</span>
      </div>
    </div>

    <section class="profile-ootd">
      <div class="profile-ootd-heading">
        <h2>{{ isSelf ? '我的 OOTD' : `${targetProfile.username} 的 OOTD` }}</h2>
        <span class="eyebrow">穿搭紀錄</span>
      </div>

      <div v-if="userPosts.length" class="ootd-grid">
        <article v-for="post in userPosts" :key="post.id" class="ootd-card">
          <router-link :to="`/ootd/${post.id}`" class="ootd-card-link">
            <img class="ootd-photo" :src="post.image" :alt="`${post.username} 的 OOTD`" />
          </router-link>
          <div class="ootd-body">
            <p class="ootd-caption">{{ post.caption }}</p>
            <div v-if="post.hashtags && post.hashtags.length" class="ootd-tags">
              {{ post.hashtags.join('　') }}
            </div>
            <p class="ootd-items">
              {{ post.wearing && post.wearing.length ? `穿搭單品：${post.wearing.join('、')}` : '尚未標註衣櫥單品' }}
            </p>
            <p v-if="post.created_at || post.createdAt" class="ootd-date">
              {{ formatDate(post.created_at || post.createdAt) }}
            </p>
            <div class="ootd-actions">
              <button
                :class="['ootd-action', { liked: post.liked }]"
                type="button"
                @click="ootdStore.toggleLike(post.id)"
              >
                {{ post.liked ? '👍' : '👍🏻' }} {{ post.likes }}
              </button>
              <button type="button" class="ootd-action" @click="openComments(post.id)">
                🗨 {{ post.commentList?.length ?? post.comments ?? 0 }}
              </button>
              <button type="button" class="ootd-action" @click="shareOotd(post.id)">分享連結</button>
              <template v-if="isSelf">
                <button type="button" class="ootd-action" @click="editOotd(post.id)">編輯</button>
                <button type="button" class="ootd-action ootd-delete-action" @click="deleteOotd(post.id)">
                  刪除
                </button>
              </template>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="profile-ootd-empty">
        {{ isSelf ? '你發布的 OOTD 會顯示在這裡。' : '此使用者尚未發布 OOTD。' }}
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useOotdStore } from '@/stores/ootd';
import { fetchProfileFromSupabase, fetchPublicClosetFromSupabase } from '@/services/supabase';

const appStore = useAppStore();
const authStore = useAuthStore();
const ootdStore = useOotdStore();
const route = useRoute();
const publicProfileHearts = ref(0);
let heartsLoadRequest = 0;

onMounted(() => {
  if (appStore.normalizeUsername(appStore.profile.username) === '@demo') {
    ootdStore.seedDemoWardrobePosts();
  }
  appStore.loadRemoteAvatar();
  ootdStore.loadRemotePosts();
});

const isSelf = computed(() => {
  if (!authStore.isLoggedIn) return false;
  const queryUser = route.query.user;
  if (!queryUser) return true;
  return appStore.normalizeUsername(queryUser) === appStore.normalizeUsername(appStore.profile.username);
});

const loadProfileHearts = async () => {
  const requestId = ++heartsLoadRequest;
  if (isSelf.value) {
    const remoteProfile = await fetchProfileFromSupabase();
    if (requestId !== heartsLoadRequest) return;
    const virtualHearts = appStore.items.reduce(
      (total, item) => total + (Number(item.virtual_heart_count) || 0),
      0
    );
    appStore.profile.hearts = remoteProfile
      ? (Number(remoteProfile.hearts) || 0) + virtualHearts
      : appStore.items.reduce((total, item) => total + (Number(item.heart_count) || 0), 0);
    return;
  }

  publicProfileHearts.value = 0;
  const username = route.query.user;
  if (!username) return;
  const result = await fetchPublicClosetFromSupabase(username);
  if (requestId !== heartsLoadRequest) return;
  publicProfileHearts.value = result.status === 'public' ? Number(result.profile.hearts) || 0 : 0;
};

watch([isSelf, () => route.query.user], loadProfileHearts, { immediate: true });

const userPosts = computed(() => {
  let posts;
  if (isSelf.value) {
    posts = appStore.ootdPosts.filter(
      (p) => p.username === appStore.profile.username || p.user_id === appStore.profile.user_id
    );
  } else {
    const queryUser = appStore.normalizeUsername(route.query.user);
    posts = appStore.ootdPosts.filter(
      (p) => appStore.normalizeUsername(p.username) === queryUser
    );
  }

  return posts.slice().sort((a, b) => {
    const aDate = new Date(a.created_at || a.createdAt || 0).getTime();
    const bDate = new Date(b.created_at || b.createdAt || 0).getTime();
    return (Number.isFinite(bDate) ? bDate : 0) - (Number.isFinite(aDate) ? aDate : 0);
  });
});

const totalUserPostLikes = computed(() => {
  return userPosts.value.reduce((acc, p) => acc + (Number(p.likes) || 0), 0);
});

const isFollowingTarget = computed(() => {
  if (isSelf.value) return false;
  return appStore.isFollowingUser(targetProfile.value.username);
});

const toggleFollowTarget = () => {
  if (isSelf.value) return;
  const username = targetProfile.value.username;
  const nextState = !isFollowingTarget.value;
  appStore.setFollowingUser(username, nextState);
  appStore.showToast(nextState ? `已開始追蹤 ${username}` : `已取消追蹤 ${username}`);
};

const targetProfile = computed(() => {
  if (isSelf.value) {
    return {
      ...appStore.profile,
      likes: totalUserPostLikes.value
    };
  }
  const queryUser = appStore.normalizeUsername(route.query.user);
  const matchedPosts = appStore.ootdPosts.filter(
    (p) => appStore.normalizeUsername(p.username) === queryUser
  );

  const samplePost = matchedPosts[0];
  const initials = samplePost ? samplePost.initials : queryUser.replace('@', '').substring(0, 2).toUpperCase();
  const name = samplePost ? samplePost.username : queryUser;
  const totalLikes = totalUserPostLikes.value;

  return {
    name,
    username: queryUser,
    initials,
    avatar_url: '',
    bio: '用衣櫥記錄日常，與衣友分享穿搭靈感。',
    hearts: publicProfileHearts.value,
    helped: Math.round(matchedPosts.length * 2),
    likes: totalLikes,
    public_closet: true
  };
});

const formatDate = (val) => {
  if (!val) return '';
  const date = new Date(val);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('zh-TW');
};

const openEditProfile = () => {
  appStore.isProfileEditOpen = true;
};

const openOotdForm = () => {
  ootdStore.editingPostId = null;
  appStore.isOotdFormOpen = true;
};

const editOotd = (postId) => {
  ootdStore.editingPostId = postId;
  appStore.isOotdFormOpen = true;
};

const deleteOotd = async (postId) => {
  if (confirm('確定要刪除這篇 OOTD 嗎？')) {
    await ootdStore.deletePost(postId);
  }
};

const shareOotd = (postId) => {
  ootdStore.sharePost(postId);
};

const openComments = (postId) => {
  appStore.activeCommentPostId = postId;
  appStore.isCommentOpen = true;
};

</script>

