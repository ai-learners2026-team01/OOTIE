import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../app';
import { useOotdStore } from '../ootd';

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
