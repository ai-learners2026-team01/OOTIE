import { describe, it, expect, beforeEach } from 'vitest';
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
