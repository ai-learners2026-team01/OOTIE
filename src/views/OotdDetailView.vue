<template>
  <section class="page active" id="sharedOotdPage">
    <div class="shared-ootd-header">
      <router-link to="/profile" class="text-link">← 返回個人檔案</router-link>
    </div>

    <div v-if="loading" class="profile-ootd-empty">
      正在載入這篇 OOTD...
    </div>

    <div v-else-if="!post" class="profile-ootd-empty">
      {{ errorMessage || '找不到這篇 OOTD。' }}
    </div>

    <article v-else class="ootd-card detail-card">
      <img class="ootd-photo" :src="post.image" alt="OOTD 穿搭照片" />
      <div class="ootd-body">
        <p class="eyebrow">OOTD 分享</p>
        <h2>{{ post.caption || '今日的穿搭' }}</h2>
        <div v-if="post.hashtags && post.hashtags.length" class="ootd-tags">
          {{ post.hashtags.join('　') }}
        </div>
        <p class="ootd-items">
          {{ post.wearing && post.wearing.length ? `穿搭單品：${post.wearing.join('、')}` : '尚未標註衣櫥單品' }}
        </p>
        <p v-if="post.created_at || post.createdAt" class="ootd-date">
          發布於 {{ formatDate(post.created_at || post.createdAt) }}
        </p>
        <div class="ootd-actions">
          <button type="button" class="primary" @click="sharePost">分享連結</button>
          <router-link to="/profile" class="secondary">查看個人主頁</router-link>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useOotdStore } from '@/stores/ootd';
import { supabase } from '@/services/supabase';

const route = useRoute();
const appStore = useAppStore();
const ootdStore = useOotdStore();

const post = ref(null);
const loading = ref(true);
const errorMessage = ref('');

const formatDate = (val) => {
  if (!val) return '';
  const date = new Date(val);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('zh-TW');
};

const loadPost = async () => {
  const postId = route.params.id;
  if (!postId) {
    loading.value = false;
    errorMessage.value = '缺少貼文識別 ID。';
    return;
  }

  // 1. First check local store
  const localPost = appStore.ootdPosts.find((p) => String(p.id) === String(postId));
  if (localPost) {
    post.value = localPost;
    loading.value = false;
    return;
  }

  // 2. Try fetching from Supabase
  try {
    const { data, error } = await supabase
      .from('ootie_ootd_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (error || !data) {
      errorMessage.value = '找不到這篇 OOTD，或目前沒有讀取權限。';
    } else {
      post.value = {
        id: String(data.id),
        image: data.image,
        caption: data.caption,
        wearing: Array.isArray(data.wearing) ? data.wearing : [],
        hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
        created_at: data.created_at
      };
    }
  } catch (err) {
    errorMessage.value = '讀取 OOTD 失敗。';
  } finally {
    loading.value = false;
  }
};

const sharePost = () => {
  if (post.value) {
    ootdStore.sharePost(post.value.id);
  }
};

onMounted(() => {
  loadPost();
});
</script>

<style scoped>
.shared-ootd-header {
  margin-bottom: 20px;
}
.detail-card {
  max-width: 640px;
  margin: 0 auto;
}
</style>
