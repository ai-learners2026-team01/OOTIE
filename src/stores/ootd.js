import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAppStore } from './app';
import {
  fetchProfileOotdPosts,
  insertOotdPost,
  updateOotdPost,
  deleteOotdPost
} from '@/services/supabase';

const demoWardrobePostSpecs = [
  { itemId: '1', likes: 24, caption: '藍色印花襯衫，讓日常多一點清爽層次。', hashtags: ['#日常穿搭', '#藍色系'], comments: ['這個藍色很耐看！', '版型看起來好舒服。', '配牛仔褲一定很適合。', '印花細節好好看。', '想看更多襯衫搭配。', '清爽又有精神。'] },
  { itemId: '2', likes: 20, caption: '直筒牛仔褲是衣櫥裡最可靠的日常夥伴。', hashtags: ['#丹寧日常', '#衣櫥單品'], comments: ['這種版型真的百搭。', '牛仔褲的洗色很好看。', '日常出門就靠它。', '搭襯衫很俐落。', '簡單穿就很好看。'] },
  { itemId: '3', likes: 18, caption: '柔軟的白色圓領上衣，留給舒服的一天。', hashtags: ['#簡約穿搭', '#白色系'], comments: ['白色上衣永遠不嫌多。', '看起來很柔軟！', '喜歡這種乾淨感。', '配長褲也很適合。', '舒服又好搭。'] },
  { itemId: '4', likes: 17, caption: '棕色拉鍊外套，替簡單穿搭加上一點俐落感。', hashtags: ['#外套穿搭', '#棕色系'], comments: ['棕色很有秋天感。', '外套細節很帥氣。', '這件搭黑色也會好看。', '很適合微涼天氣。'] },
  { itemId: '5', likes: 15, caption: '紫色平口洋裝，讓聚會穿搭多一點亮點。', hashtags: ['#洋裝日常', '#派對穿搭'], comments: ['這個紫色好顯眼！', '版型很有氣質。', '配簡單飾品就很完整。', '很適合約會穿。'] },
  { itemId: '6', likes: 13, caption: '黑色菱格肩背包，低調收好出門需要的小物。', hashtags: ['#包款分享', '#經典單品'], comments: ['菱格紋好經典。', '黑色包包真的很實用。', '尺寸看起來剛剛好。'] },
  { itemId: '7', likes: 11, caption: '衣架上的外套各有個性，換個層次就像換一種心情。', hashtags: ['#外套收藏', '#穿搭靈感'], comments: ['每件看起來都很有特色。', '衣架陳列好有質感。', '想看這些外套的搭配。'] },
  { itemId: '8', likes: 10, caption: '藍色腰帶長版大衣，把俐落線條留給涼爽的日子。', hashtags: ['#大衣穿搭', '#季節層次'], comments: ['長版剪裁很有氣勢。', '腰帶設計好加分。'] }
];

const demoCommentUsers = ['@ella', '@minji', '@rachel', '@mika', '@nora', '@sofia', '@jules', '@hayley'];

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

  const seedDemoWardrobePosts = () => {
    if (appStore.normalizeUsername(appStore.profile.username) !== '@demo') return 0;

    let createdCount = 0;
    demoWardrobePostSpecs.forEach((spec, postIndex) => {
      const item = appStore.items.find((entry) => String(entry.id) === spec.itemId);
      if (!item) return;

      const existingPost = appStore.ootdPosts.find(
        (post) => String(post.demoWardrobeItemId) === spec.itemId
      );
      const postDate = new Date(Date.now() - postIndex * 24 * 60 * 60 * 1000).toISOString();
      if (existingPost) {
        if (existingPost.demoWardrobeDateVersion !== 1) {
          existingPost.created_at = postDate;
          existingPost.demoWardrobeDateVersion = 1;
        }
        return;
      }

      const commentList = spec.comments.map((text, commentIndex) => ({
        id: `demo-wardrobe-${spec.itemId}-comment-${commentIndex + 1}`,
        user: demoCommentUsers[(postIndex + commentIndex) % demoCommentUsers.length],
        text
      }));
      appStore.ootdPosts.unshift({
        id: `demo-wardrobe-post-${spec.itemId}`,
        username: appStore.profile.username,
        user_id: appStore.profile.user_id,
        initials: appStore.profile.initials,
        image: item.photo,
        caption: spec.caption,
        wearing: [item.name_zh || item.name],
        item_ids: [item.id],
        hashtags: spec.hashtags,
        likes: spec.likes,
        comments: commentList.length,
        liked: false,
        saved: false,
        following: true,
        commentList,
        demoWardrobeItemId: spec.itemId,
        isVirtualEngagement: true,
        demoWardrobeDateVersion: 1,
        created_at: postDate
      });
      createdCount += 1;
    });
    return createdCount;
  };

  const toggleLike = (postId) => {
    const post = appStore.ootdPosts.find((item) => String(item.id) === String(postId));
    if (!post) return;
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
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
    seedDemoWardrobePosts,
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

