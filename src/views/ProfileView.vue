<template>
  <section class="page active" id="profilePage">
    <p class="eyebrow">你的 OOTie 空間</p>
    <h1>個人檔案</h1>

    <div class="profile-header">
      <div class="profile-avatar" :class="{ 'has-image': appStore.profile.avatar_url }">
        <img
          v-if="appStore.profile.avatar_url"
          :src="appStore.profile.avatar_url"
          :alt="`${appStore.profile.name} 的大頭貼`"
        />
        <template v-else>{{ appStore.profile.initials }}</template>
      </div>
      <div class="profile-copy">
        <h2>{{ appStore.profile.name }}</h2>
        <p class="handle">{{ appStore.profile.username }}</p>
        <p class="bio">{{ appStore.profile.bio }}</p>
      </div>
      <div class="profile-actions">
        <button class="secondary" @click="openEditProfile">編輯資料</button>
        <button class="primary" @click="openOotdForm">＋ 發布 OOTD</button>
      </div>
    </div>

    <div class="profile-stats">
      <div class="profile-stat">
        <strong>{{ appStore.profile.hearts }}</strong>
        <span>收到的 Hearts</span>
      </div>
      <div class="profile-stat">
        <strong>{{ appStore.profile.helped }}</strong>
        <span>幫助衣友</span>
      </div>
      <div class="profile-stat">
        <strong>{{ appStore.profile.likes }}</strong>
        <span>貼文獲得讚數</span>
      </div>
    </div>

    <section class="profile-settings">
      <h2>衣櫥設定</h2>
      <div class="setting-row">
        <div>
          <strong>公開我的衣櫥</strong>
          <p>讓衣友可以查看你的單品並提供穿搭建議。</p>
        </div>
        <button
          :class="['switch', { on: appStore.profile.public_closet }]"
          :aria-pressed="appStore.profile.public_closet"
          aria-label="切換公開衣櫥"
          @click="togglePublicCloset"
        ></button>
      </div>
    </section>

    <section class="profile-ootd">
      <div class="profile-ootd-heading">
        <h2>我的 OOTD</h2>
        <span class="eyebrow">穿搭紀錄</span>
      </div>

      <div v-if="userPosts.length" class="ootd-grid">
        <article v-for="post in userPosts" :key="post.id" class="ootd-card">
          <router-link :to="`/ootd/${post.id}`" class="ootd-card-link">
            <img class="ootd-photo" :src="post.image" alt="我的 OOTD" />
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
              <button type="button" class="ootd-action" @click="shareOotd(post.id)">分享連結</button>
              <button type="button" class="ootd-action" @click="editOotd(post.id)">編輯</button>
              <button type="button" class="ootd-action ootd-delete-action" @click="deleteOotd(post.id)">
                刪除
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="profile-ootd-empty">
        你發布的 OOTD 會顯示在這裡。
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/app';
import { useOotdStore } from '@/stores/ootd';

const appStore = useAppStore();
const ootdStore = useOotdStore();

onMounted(() => {
  appStore.loadRemoteAvatar();
  ootdStore.loadRemotePosts();
});

const userPosts = computed(() => {
  return appStore.ootdPosts.filter(
    (p) => p.username === appStore.profile.username || p.user_id === appStore.profile.user_id
  );
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

const togglePublicCloset = () => {
  appStore.profile.public_closet = !appStore.profile.public_closet;
  appStore.showToast(appStore.profile.public_closet ? '衣櫥已公開' : '衣櫥已設為私人');
};
</script>

