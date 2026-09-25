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
    const initialLikes = post.likes;
    const initialLiked = post.liked;

    ootdStore.toggleLike(post.id);

    expect(post.liked).toBe(!initialLiked);
    expect(post.likes).toBe(initialLiked ? initialLikes - 1 : initialLikes + 1);
  });

  it('should toggle save status of a post', () => {
    const appStore = useAppStore();
    const ootdStore = useOotdStore();

    const post = appStore.ootdPosts[0];
    const initialSaved = post.saved;

    ootdStore.toggleSave(post.id);
    expect(post.saved).toBe(!initialSaved);
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
