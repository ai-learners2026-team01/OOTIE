<template>
  <section class="page active" id="profilePage">
    <p class="eyebrow">你的 OOTie 空間</p>
    <h1>個人檔案</h1>

    <div class="profile-header">
      <div class="profile-avatar">{{ appStore.profile.initials }}</div>
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
          <img class="ootd-photo" :src="post.image" alt="我的 OOTD" />
          <div class="ootd-body">
            <p class="ootd-caption">{{ post.caption }}</p>
            <div class="ootd-tags">{{ post.hashtags.join('　') }}</div>
            <div class="ootd-actions">
              <span class="ootd-action">♥ {{ post.likes }}</span>
              <span class="ootd-action">♡ {{ post.comments }}</span>
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
import { computed } from 'vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

const userPosts = computed(() => {
  return appStore.ootdPosts.filter((p) => p.username === appStore.profile.username);
});

const openEditProfile = () => {
  appStore.isProfileEditOpen = true;
};

const openOotdForm = () => {
  appStore.isOotdFormOpen = true;
};

const togglePublicCloset = () => {
  appStore.profile.public_closet = !appStore.profile.public_closet;
  appStore.showToast(appStore.profile.public_closet ? '衣櫥已公開' : '衣櫥已設為私人');
};
</script>
