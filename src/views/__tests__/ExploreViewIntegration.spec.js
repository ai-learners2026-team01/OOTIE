import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import ExploreView from '../ExploreView.vue';
import CommentModal from '@/components/modal/CommentModal.vue';
import OotdDetailView from '../OotdDetailView.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

describe('ExploreView & OOTD Features Integration', () => {
  let router;
  let pinia;

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);
    localStorage.clear();

    const authStore = useAuthStore();
    authStore.user = { id: 'user-01', email: 'test@example.com' };

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/explore', component: ExploreView },
        { path: '/profile', component: { template: '<div>Profile Page</div>' } },
        { path: '/ootd/:id', component: OotdDetailView }
      ]
    });

    await router.push('/explore');
    await router.isReady();
  });

  it('1. Clicking on a post card opens the enlarged Lightbox modal (方案 A)', async () => {
    const wrapper = mount(ExploreView, {
      global: { plugins: [pinia, router] }
    });

    // Initial state: no lightbox open
    expect(wrapper.find('.ootd-lightbox-modal').exists()).toBe(false);

    // Click on the first post card
    const firstCard = wrapper.find('.ootd-card');
    expect(firstCard.exists()).toBe(true);
    await firstCard.trigger('click');

    // Lightbox modal is now open with enlarged image
    expect(wrapper.find('.ootd-lightbox-modal').exists()).toBe(true);
    expect(wrapper.find('.lightbox-zoom-img').exists()).toBe(true);
    expect(wrapper.find('.lightbox-caption').text()).toContain('一件外套');

    // Close lightbox modal
    const closeBtn = wrapper.find('.ootd-lightbox-modal .modal-close');
    await closeBtn.trigger('click');
    expect(wrapper.find('.ootd-lightbox-modal').exists()).toBe(false);
  });

  it('2. Follow button on post card toggles following status', async () => {
    const appStore = useAppStore();
    const wrapper = mount(ExploreView, {
      global: { plugins: [pinia, router] }
    });

    // @sofia is not followed by default in defaultOotdPosts
    const cards = wrapper.findAll('.ootd-card');
    const sofiaCard = cards.find((c) => c.text().includes('@sofia'));
    expect(sofiaCard).toBeTruthy();

    const followBtn = sofiaCard.find('.btn-follow-chip');
    expect(followBtn.exists()).toBe(true);
    expect(followBtn.text()).toBe('＋ 追蹤');

    // Click follow button
    await followBtn.trigger('click');

    expect(appStore.isFollowingUser('@sofia')).toBe(true);
    expect(followBtn.text()).toBe('已追蹤');
  });

  it('replaces post save controls with share and displays the actual comment count', async () => {
    const appStore = useAppStore();
    const wrapper = mount(ExploreView, {
      global: { plugins: [pinia, router] }
    });

    const firstCard = wrapper.find('.ootd-card');
    const firstPost = appStore.ootdPosts.find((post) => post.id === 'post-01');
    expect(firstCard.find('.ootd-actions').text()).toContain('分享');
    expect(firstCard.find('.ootd-actions').text()).not.toContain('收藏');
    expect(firstCard.find('.ootd-actions').text()).toContain(`🗨 ${firstPost.commentList.length}`);
    expect(firstPost.comments).toBe(firstPost.commentList.length);
  });

  it('3. CommentModal allows clicking on username to navigate to that user profile', async () => {
    const appStore = useAppStore();
    appStore.activeCommentPostId = 'post-01';
    appStore.isCommentOpen = true;

    const wrapper = mount(CommentModal, {
      global: { plugins: [pinia, router] }
    });

    const userLinks = wrapper.findAll('.comment-user-link');
    expect(userLinks.length).toBeGreaterThan(0);

    // Click on commenter username
    await userLinks[0].trigger('click');
    await flushPromises();

    // Comment modal closed and routed to user's profile
    expect(appStore.isCommentOpen).toBe(false);
    expect(router.currentRoute.value.path).toBe('/profile');
    expect(router.currentRoute.value.query.user).toBe('@ella');
  });

  it('shows delete only for the current user comment and removes it with count sync', async () => {
    const appStore = useAppStore();
    const post = appStore.ootdPosts[0];
    appStore.activeCommentPostId = post.id;
    appStore.isCommentOpen = true;

    const wrapper = mount(CommentModal, {
      global: { plugins: [pinia, router] }
    });

    const oldCount = post.commentList.length;
    const ownCommentsBefore = post.commentList.filter(
      (comment) => appStore.normalizeUsername(comment.user) === appStore.normalizeUsername(appStore.profile.username)
    ).length;
    expect(wrapper.findAll('.comment-delete-action')).toHaveLength(ownCommentsBefore);

    post.commentList.push({ id: 'own-test-comment', user: appStore.profile.username, text: '要刪除的留言' });
    post.comments = post.commentList.length;
    await wrapper.vm.$nextTick();

    const deleteButtons = wrapper.findAll('.comment-delete-action');
    expect(deleteButtons).toHaveLength(ownCommentsBefore + 1);
    const deleteButton = deleteButtons.at(-1);
    expect(deleteButton.exists()).toBe(true);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await deleteButton.trigger('click');

    expect(post.comments).toBe(oldCount);
    expect(post.commentList.some((comment) => comment.id === 'own-test-comment')).toBe(false);
    vi.restoreAllMocks();
  });

  it('4. OotdDetailView navigates to specific post author profile when clicking 查看個人主頁', async () => {
    const appStore = useAppStore();
    // Test post by @minji (not Hayley)
    const targetPost = appStore.ootdPosts.find((p) => p.username === '@minji');

    await router.push(`/ootd/${targetPost.id}`);
    await router.isReady();

    const wrapper = mount(OotdDetailView, {
      global: { plugins: [pinia, router] }
    });

    await flushPromises();

    const profileLink = wrapper.find('.ootd-actions .secondary');
    expect(profileLink.exists()).toBe(true);
    expect(profileLink.text()).toContain('查看 @minji 的個人主頁');

    await profileLink.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/profile');
    expect(router.currentRoute.value.query.user).toBe('@minji');
  });
});
