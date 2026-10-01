import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAppStore } from './app';
import {
  fetchProfileOotdPosts,
  insertOotdPost,
  updateOotdPost,
  deleteOotdPost
} from '@/services/supabase';

export const useOotdStore = defineStore('ootd', () => {
  const appStore = useAppStore();

  const activeFeedTab = ref('for-you');
  const searchQuery = ref('');
  const editingPostId = ref(null);
  const prefillData = ref(null);

  const filteredPosts = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    const feed = activeFeedTab.value;
    return appStore.ootdPosts.filter((post) => {
      const isFollowing = post.following || appStore.isFollowingUser(post.username) || post.username === appStore.profile.username;
      const matchFeed = feed === 'for-you' || isFollowing;
      const searchable = `${post.username} ${post.caption} ${(post.hashtags || []).join(' ')} ${(post.wearing || []).join(' ')}`.toLowerCase();
      const matchQuery = !query || searchable.includes(query);
      return matchFeed && matchQuery;
    });
  });

  const loadRemotePosts = async () => {
    const remotePosts = await fetchProfileOotdPosts();
    if (remotePosts && Array.isArray(remotePosts) && remotePosts.length > 0) {
      // Merge or update local posts for current user
      remotePosts.forEach((remote) => {
        const index = appStore.ootdPosts.findIndex((p) => String(p.id) === String(remote.id));
        const formattedPost = {
          id: String(remote.id),
          username: appStore.profile.username,
          initials: appStore.profile.initials,
          image: remote.image,
          caption: remote.caption,
          wearing: Array.isArray(remote.wearing) ? remote.wearing : [],
          item_ids: Array.isArray(remote.item_ids) ? remote.item_ids : [],
          hashtags: Array.isArray(remote.hashtags) ? remote.hashtags : [],
          likes: remote.likes || 0,
          comments: remote.comments || 0,
          liked: false,
          saved: false,
          following: true,
          commentList: [],
          created_at: remote.created_at
        };
        if (index !== -1) {
          appStore.ootdPosts[index] = { ...appStore.ootdPosts[index], ...formattedPost };
        } else {
          appStore.ootdPosts.unshift(formattedPost);
        }
      });
    }
  };

  const toggleLike = (postId) => {
    const post = appStore.ootdPosts.find((item) => String(item.id) === String(postId));
    if (!post) return;
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    if (post.liked && post.username === appStore.profile.username) {
      appStore.profile.hearts += 1;
      appStore.addNotification('你的穿搭收到了一個 Heart。', 'explore', { type: 'post-like', postId: post.id });
    }
  };

  const toggleSave = (postId) => {
    const post = appStore.ootdPosts.find((item) => String(item.id) === String(postId));
    if (!post) return;
    post.saved = !post.saved;
    if (typeof post.saved_count === 'number') {
      post.saved_count += post.saved ? 1 : -1;
    }
    appStore.showToast(post.saved ? '已收藏這篇穿搭' : '已取消收藏');
  };

  const addComment = (postId, text) => {
    const post = appStore.ootdPosts.find((item) => String(item.id) === String(postId));
    if (!post || !text.trim()) return;
    if (!post.commentList) post.commentList = [];
    const commentId = `comment-${Date.now()}`;
    post.commentList.push({ id: commentId, user: appStore.profile.username, text: text.trim() });
    post.comments = post.commentList.length;
    if (post.username === appStore.profile.username) {
      appStore.addNotification(`${appStore.profile.username} 的貼文有了新留言。`, 'explore', { type: 'post-comment', postId: post.id, commentId });
    }
    appStore.showToast('留言已送出');
  };

  const deleteComment = (postId, commentId) => {
    const post = appStore.ootdPosts.find((item) => String(item.id) === String(postId));
    if (!post || !Array.isArray(post.commentList)) return false;

    const index = post.commentList.findIndex((comment) => String(comment.id) === String(commentId));
    if (index === -1) return false;
    const comment = post.commentList[index];
    if (appStore.normalizeUsername(comment.user) !== appStore.normalizeUsername(appStore.profile.username)) {
      return false;
    }

    post.commentList.splice(index, 1);
    post.comments = post.commentList.length;
    appStore.showToast('留言已刪除');
    return true;
  };

  const createPost = async ({ image, caption, hashtags, selectedItemIds }) => {
    const selectedItems = (selectedItemIds || [])
      .map((id) => appStore.items.find((item) => String(item.id) === String(id)))
      .filter(Boolean);
    const formattedHashtags = (hashtags || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

    const newPost = {
      id: `post-${Date.now()}`,
      username: appStore.profile.username,
      initials: appStore.profile.initials,
      image,
      caption: caption.trim(),
      wearing: selectedItems.map((item) => item.name_zh || item.name),
      item_ids: selectedItemIds || [],
      hashtags: formattedHashtags,
      likes: 0,
      comments: 0,
      liked: false,
      saved: false,
      following: true,
      commentList: [],
      created_at: new Date().toISOString()
    };

    appStore.ootdPosts.unshift(newPost);
    appStore.addNotification('你的 OOTD 已成功發布。', 'explore');
    appStore.showToast('OOTD 已發布');

    // Async sync to Supabase
    await insertOotdPost(newPost);
  };

  const updatePost = async (postId, { image, caption, hashtags, selectedItemIds }) => {
    const post = appStore.ootdPosts.find((item) => String(item.id) === String(postId));
    if (!post) return;

    const selectedItems = (selectedItemIds || [])
      .map((id) => appStore.items.find((item) => String(item.id) === String(id)))
      .filter(Boolean);
    const formattedHashtags = (hashtags || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

    post.image = image;
    post.caption = caption.trim();
    post.wearing = selectedItems.map((item) => item.name_zh || item.name);
    post.item_ids = selectedItemIds || [];
    post.hashtags = formattedHashtags;

    appStore.showToast('OOTD 修改已儲存');

    // Async sync to Supabase
    await updateOotdPost(postId, post);
  };

  const deletePost = async (postId) => {
    const index = appStore.ootdPosts.findIndex((item) => String(item.id) === String(postId));
    if (index === -1) return;

    appStore.ootdPosts.splice(index, 1);
    appStore.showToast('OOTD 已刪除');

    // Async sync to Supabase
    await deleteOotdPost(postId);
  };

  const getShareUrl = (postId) => {
    return `${window.location.origin}/ootd/${encodeURIComponent(postId)}`;
  };

  const sharePost = async (postId) => {
    const shareUrl = getShareUrl(postId);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'OOTie OOTD', text: '看看這套 OOTD', url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        appStore.showToast('貼文連結已複製');
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
        appStore.showToast('貼文連結已複製');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') appStore.showToast('無法分享貼文連結');
    }
  };

  return {
    activeFeedTab,
    searchQuery,
    editingPostId,
    prefillData,
    filteredPosts,
    loadRemotePosts,
    toggleLike,
    toggleSave,
    addComment,
    deleteComment,
    createPost,
    updatePost,
    deletePost,
    sharePost,
    getShareUrl
  };
});

