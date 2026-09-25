import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAppStore } from './app';

export const useOotdStore = defineStore('ootd', () => {
  const appStore = useAppStore();

  const activeFeedTab = ref('for-you');
  const searchQuery = ref('');

  const filteredPosts = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    const feed = activeFeedTab.value;
    return appStore.ootdPosts.filter((post) => {
      const matchFeed = feed === 'for-you' || post.following;
      const searchable = `${post.username} ${post.caption} ${post.hashtags.join(' ')} ${post.wearing.join(' ')}`.toLowerCase();
      const matchQuery = !query || searchable.includes(query);
      return matchFeed && matchQuery;
    });
  });

  const toggleLike = (postId) => {
    const post = appStore.ootdPosts.find((item) => item.id === postId);
    if (!post) return;
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    if (post.liked && post.username === appStore.profile.username) {
      appStore.profile.hearts += 1;
      appStore.addNotification('你的穿搭收到了一個 Heart。', 'explore');
    }
  };

  const toggleSave = (postId) => {
    const post = appStore.ootdPosts.find((item) => item.id === postId);
    if (!post) return;
    post.saved = !post.saved;
    appStore.showToast(post.saved ? '已收藏這篇穿搭' : '已取消收藏');
  };

  const addComment = (postId, text) => {
    const post = appStore.ootdPosts.find((item) => item.id === postId);
    if (!post || !text.trim()) return;
    post.commentList.push({ user: appStore.profile.username, text: text.trim() });
    post.comments += 1;
    if (post.username === appStore.profile.username) {
      appStore.addNotification(`${appStore.profile.username} 的貼文有了新留言。`, 'explore');
    }
    appStore.showToast('留言已送出');
  };

  const createPost = ({ image, caption, hashtags, selectedItemIds }) => {
    const selectedItems = selectedItemIds.map((id) => appStore.items.find((item) => item.id === id)).filter(Boolean);
    const formattedHashtags = hashtags.split(/\s+/).filter(Boolean).map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

    appStore.ootdPosts.unshift({
      id: `post-${Date.now()}`,
      username: appStore.profile.username,
      initials: appStore.profile.initials,
      image,
      caption: caption.trim(),
      wearing: selectedItems.map((item) => item.name_zh || item.name),
      hashtags: formattedHashtags,
      likes: 0,
      comments: 0,
      liked: false,
      saved: false,
      following: true,
      commentList: []
    });

    appStore.addNotification('你的 OOTD 已成功發布。', 'explore');
    appStore.showToast('OOTD 已發布');
  };

  return {
    activeFeedTab,
    searchQuery,
    filteredPosts,
    toggleLike,
    toggleSave,
    addComment,
    createPost
  };
});
