import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../app';
import { useOotdStore } from '../ootd';
import { STORAGE_KEY, defaultItems, defaultOotdPosts, exploreDemoOotdPosts } from '@/constants';

describe('OOTD Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('should filter posts by feed tab and search query', () => {
    const ootdStore = useOotdStore();

    ootdStore.activeFeedTab = 'following';
    expect(ootdStore.filteredPosts.every((p) => p.following)).toBe(true);

    ootdStore.activeFeedTab = 'for-you';
    ootdStore.searchQuery = '秋天';
    expect(ootdStore.filteredPosts.every((p) => p.caption.includes('秋天') || p.hashtags.some((h) => h.includes('秋天')))).toBe(true);
  });

  it('excludes the current user from both Explore feeds and includes nine new demo posts', () => {
    const appStore = useAppStore();
    const ootdStore = useOotdStore();
    appStore.ootdPosts.unshift({
      id: 'own-post',
      username: appStore.profile.username,
      user_id: appStore.profile.user_id,
      following: true,
      image: 'https://images.unsplash.com/photo-same-image?auto=format&fit=crop&w=800&q=85',
      caption: '自己的 OOTD',
      hashtags: [],
      wearing: []
    });
    appStore.ootdPosts.unshift({
      id: 'same-image-other-user-post',
      username: '@other',
      following: true,
      image: 'https://images.unsplash.com/photo-same-image?auto=format&fit=crop&w=1200&q=90',
      caption: '使用相同來源圖片的他人貼文',
      hashtags: [],
      wearing: []
    });

    expect(exploreDemoOotdPosts).toHaveLength(9);
    for (const feed of ['for-you', 'following']) {
      ootdStore.activeFeedTab = feed;
      expect(ootdStore.filteredPosts.some((post) => post.id === 'own-post')).toBe(false);
      expect(ootdStore.filteredPosts.some((post) => post.id === 'same-image-other-user-post')).toBe(false);
    }
  });

  it('provides five menswear, five womenswear, two sportswear, and two childrenswear posts with unique closet-safe images', () => {
    const categoryCounts = defaultOotdPosts.reduce((counts, post) => {
      counts[post.styleCategory] = (counts[post.styleCategory] || 0) + 1;
      return counts;
    }, {});
    const imagePaths = defaultOotdPosts.map((post) => new URL(post.image).pathname);
    const closetImagePaths = new Set(defaultItems.map((item) => new URL(item.photo).pathname));

    expect(categoryCounts).toEqual({
      '女性穿搭': 5,
      '男性穿搭': 5,
      '運動穿搭': 2,
      '兒童穿搭': 2
    });
    const littleLookPost = defaultOotdPosts.find((post) => post.id === 'post-14');
    expect(littleLookPost.caption).toContain('灰色長褲');
    expect(littleLookPost.wearing).toContain('灰色長褲');
    expect(littleLookPost.wearing).not.toContain('短褲');
    expect(new Set(imagePaths).size).toBe(14);
    expect(imagePaths.every((imagePath) => !closetImagePaths.has(imagePath))).toBe(true);
  });

  it('migrates nine demo Explore posts into existing saved app data once', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      profile: { username: '@owner', user_id: 'owner-01', initials: 'OW', hearts: 0 },
      ootdPosts: [
        { id: 'existing-post', username: '@owner', commentList: [] },
        {
          id: 'post-07',
          username: '@yuna',
          image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85',
          commentList: []
        }
      ]
    }));

    const appStore = useAppStore();
    const migratedPosts = appStore.ootdPosts.filter((post) => post.id.startsWith('post-0') || post.id.startsWith('post-1'));
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));

    expect(migratedPosts).toHaveLength(9);
    expect(appStore.ootdPosts.find((post) => post.id === 'post-07').image)
      .toBe(defaultOotdPosts.find((post) => post.id === 'post-07').image);
    expect(appStore.ootdPosts.find((post) => post.id === 'post-07').username).toBe('@ethan');
    expect(appStore.ootdPosts.find((post) => post.id === 'post-07').styleCategory).toBe('男性穿搭');
    expect(savedState.ootdDemoPostsSeeded).toBe(true);
    expect(savedState.exploreDemoImageVersion).toBe(1);
    expect(savedState.exploreDemoStyleVersion).toBe(4);
  });

  it('should toggle like status and update post likes', () => {
    const appStore = useAppStore();
    const ootdStore = useOotdStore();

    const post = appStore.ootdPosts[0];
    const initialProfileHearts = appStore.profile.hearts;
    const initialLikes = post.likes;
    const initialLiked = post.liked;

    ootdStore.toggleLike(post.id);

    expect(post.liked).toBe(!initialLiked);
    expect(post.likes).toBe(initialLiked ? initialLikes - 1 : initialLikes + 1);
    expect(appStore.profile.hearts).toBe(initialProfileHearts);
  });

  it('seeds eight demo wardrobe posts once with 128 likes and 32 virtual comments', () => {
    const appStore = useAppStore();
    const ootdStore = useOotdStore();
    appStore.profile.username = '@demo';
    appStore.profile.name = 'Demo User';
    appStore.profile.user_id = 'demo-user-01';

    expect(ootdStore.seedDemoWardrobePosts()).toBe(8);
    expect(ootdStore.seedDemoWardrobePosts()).toBe(0);

    const demoPosts = appStore.ootdPosts.filter((post) => post.isVirtualEngagement);
    expect(demoPosts).toHaveLength(8);
    expect(demoPosts.reduce((total, post) => total + post.likes, 0)).toBe(128);
    expect(demoPosts.reduce((total, post) => total + post.commentList.length, 0)).toBe(32);
    expect(demoPosts.every((post) => post.username === '@demo')).toBe(true);
    expect(demoPosts.every((post) => appStore.items.some((item) => item.photo === post.image))).toBe(true);

    demoPosts.forEach((post) => {
      post.created_at = '2026-10-01T00:00:00.000Z';
      delete post.demoWardrobeDateVersion;
    });
    expect(ootdStore.seedDemoWardrobePosts()).toBe(0);
    const migratedDates = demoPosts.map((post) => post.created_at);
    expect(new Set(migratedDates).size).toBe(8);

    expect(ootdStore.seedDemoWardrobePosts()).toBe(0);
    expect(demoPosts.map((post) => post.created_at)).toEqual(migratedDates);
  });

  it('should toggle save status of a post', () => {
    const appStore = useAppStore();
    const ootdStore = useOotdStore();

    const post = appStore.ootdPosts[0];
    const initialSaved = post.saved;

    ootdStore.toggleSave(post.id);
    expect(post.saved).toBe(!initialSaved);
  });

  it('builds a direct share URL for a post detail route', () => {
    const ootdStore = useOotdStore();

    expect(ootdStore.getShareUrl('post-01')).toBe(`${window.location.origin}/ootd/post-01`);
  });

  it('should add a comment to a post', () => {
    const appStore = useAppStore();
    const ootdStore = useOotdStore();

    const post = appStore.ootdPosts[0];
    const initialCommentsCount = post.comments;

    ootdStore.addComment(post.id, '非常優雅的配色！');

    expect(post.comments).toBe(initialCommentsCount + 1);
    expect(post.commentList.length).toBeGreaterThan(0);
    expect(post.commentList[post.commentList.length - 1].text).toBe('非常優雅的配色！');
    expect(post.commentList[post.commentList.length - 1].user).toBe(appStore.profile.username);
  });

  it('keeps seeded virtual comment counts aligned with comment list length', () => {
    const appStore = useAppStore();

    expect(appStore.ootdPosts.every((post) => post.comments === post.commentList.length)).toBe(true);
    expect(appStore.ootdPosts.find((post) => post.id === 'post-01').commentList.length).toBe(18);
  });

  it('allows a user to delete only their own comment and updates the count', () => {
    const appStore = useAppStore();
    const ootdStore = useOotdStore();
    const post = appStore.ootdPosts[0];

    ootdStore.addComment(post.id, '自己的留言');
    const ownComment = post.commentList.at(-1);
    const countAfterAdd = post.commentList.length;

    expect(ootdStore.deleteComment(post.id, ownComment.id)).toBe(true);
    expect(post.commentList).not.toContain(ownComment);
    expect(post.comments).toBe(countAfterAdd - 1);

    const otherUserComment = post.commentList.find((comment) => comment.user !== appStore.profile.username);
    expect(ootdStore.deleteComment(post.id, otherUserComment.id)).toBe(false);
    expect(post.commentList).toContain(otherUserComment);
  });

  it('should create a new OOTD post', () => {
    const appStore = useAppStore();
    const ootdStore = useOotdStore();

    const initialPostsCount = appStore.ootdPosts.length;

    ootdStore.createPost({
      image: 'data:image/png;base64,sample',
      caption: '今日出遊穿搭',
      hashtags: '#weekend #dailylook',
      selectedItemIds: [appStore.items[0].id]
    });

    expect(appStore.ootdPosts.length).toBe(initialPostsCount + 1);
    const newest = appStore.ootdPosts[0];
    expect(newest.caption).toBe('今日出遊穿搭');
    expect(newest.hashtags).toEqual(['#weekend', '#dailylook']);
    expect(newest.username).toBe(appStore.profile.username);
  });

  it('should update an existing OOTD post', async () => {
    const appStore = useAppStore();
    const ootdStore = useOotdStore();

    const targetPost = appStore.ootdPosts[0];
    const postId = targetPost.id;

    await ootdStore.updatePost(postId, {
      image: 'data:image/png;base64,updated',
      caption: '修改後的穿搭心得',
      hashtags: '#updated',
      selectedItemIds: []
    });

    expect(targetPost.caption).toBe('修改後的穿搭心得');
    expect(targetPost.image).toBe('data:image/png;base64,updated');
    expect(targetPost.hashtags).toEqual(['#updated']);
  });

  it('should delete an OOTD post', async () => {
    const appStore = useAppStore();
    const ootdStore = useOotdStore();

    const initialCount = appStore.ootdPosts.length;
    const postId = appStore.ootdPosts[0].id;

    await ootdStore.deletePost(postId);

    expect(appStore.ootdPosts.length).toBe(initialCount - 1);
    expect(appStore.ootdPosts.find((p) => p.id === postId)).toBeUndefined();
  });
});
