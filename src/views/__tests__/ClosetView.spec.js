import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ClosetView from '../ClosetView.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import * as supabaseService from '@/services/supabase';

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/closet', component: ClosetView }]
});

describe('ClosetView.vue Integration Test', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    useAuthStore().user = { id: 'user-01', email: 'test@example.com' };
    router.push('/closet');
    await router.isReady();
  });

  it('renders closet page title and item grid', () => {
    const wrapper = mount(ClosetView, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('我的衣櫥');
    expect(wrapper.find('.grid').exists()).toBe(true);
    expect(wrapper.findAll('.item-card').length).toBeGreaterThan(0);
  });

  it('filters items when category button is clicked', async () => {
    const wrapper = mount(ClosetView, {
      global: {
        plugins: [router]
      }
    });

    const categoryBtns = wrapper.findAll('.category');
    const topsBtn = categoryBtns.find((b) => b.text() === '上衣');

    await topsBtn.trigger('click');

    const cards = wrapper.findAll('.item-card');
    cards.forEach((card) => {
      expect(card.text()).toContain('上衣');
    });
  });

  it('opens item detail modal when an item image card is clicked', async () => {
    const appStore = useAppStore();
    const wrapper = mount(ClosetView, {
      global: {
        plugins: [router]
      }
    });

    const firstImageCard = wrapper.find('.item-image');
    await firstImageCard.trigger('click');

    expect(appStore.isDetailOpen).toBe(true);
    expect(appStore.selectedItemId).not.toBeNull();
  });

  it('triggers item form modal when add item button is clicked', async () => {
    const appStore = useAppStore();
    const wrapper = mount(ClosetView, {
      global: {
        plugins: [router]
      }
    });

    const addBtn = wrapper.find('.add-item-button');
    await addBtn.trigger('click');

    expect(appStore.isItemFormOpen).toBe(true);
    expect(appStore.editingItemId).toBeNull();
  });

  it('shows the public closet setting here and persists its change', async () => {
    const appStore = useAppStore();
    vi.spyOn(supabaseService, 'updatePublicClosetVisibility').mockResolvedValue(true);

    const wrapper = mount(ClosetView, {
      global: { plugins: [router] }
    });
    const initialVisibility = appStore.profile.public_closet;
    const toggle = wrapper.find('[aria-label="切換公開衣櫥"]');

    expect(toggle.exists()).toBe(true);
    expect(toggle.attributes('aria-pressed')).toBe(String(Boolean(initialVisibility)));
    expect(wrapper.text()).toContain(initialVisibility ? '已開啟（公開）' : '已關閉（私人）');
    await toggle.trigger('click');
    await wrapper.vm.$nextTick();

    expect(appStore.profile.public_closet).toBe(!initialVisibility);
    expect(supabaseService.updatePublicClosetVisibility).toHaveBeenCalledWith(!initialVisibility);
  });

  it('allows demo users to toggle locally and explains the preview limitation', async () => {
    const appStore = useAppStore();
    const authStore = useAuthStore();
    authStore.session = { access_token: 'demo-access-token' };
    vi.spyOn(supabaseService, 'updatePublicClosetVisibility');

    const wrapper = mount(ClosetView, {
      global: { plugins: [router] }
    });
    const initialVisibility = appStore.profile.public_closet;
    await wrapper.find('[aria-label="切換公開衣櫥"]').trigger('click');

    expect(appStore.profile.public_closet).toBe(!initialVisibility);
    expect(supabaseService.updatePublicClosetVisibility).not.toHaveBeenCalled();
    expect(appStore.toastMessage).toContain('僅供本機預覽');
  });

  it('does not show local closet items when a guest requests an unavailable public closet', async () => {
    const authStore = useAuthStore();
    authStore.user = null;
    vi.spyOn(supabaseService, 'fetchPublicClosetFromSupabase').mockResolvedValue({
      status: 'unavailable',
      profile: null,
      items: []
    });
    await router.push({ path: '/closet', query: { user: '@private-user' } });
    await router.isReady();

    const wrapper = mount(ClosetView, {
      global: { plugins: [router] }
    });
    await vi.waitFor(() => expect(wrapper.text()).toContain('此衣櫥未公開或不存在'));

    expect(wrapper.find('.item-card').exists()).toBe(false);
    expect(wrapper.find('[aria-label="切換公開衣櫥"]').exists()).toBe(false);
  });

  it('shows a fallback title when a guest opens the closet without an owner', async () => {
    const authStore = useAuthStore();
    authStore.user = null;
    expect(authStore.isLoggedIn).toBe(false);
    const guestRouter = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/closet', component: ClosetView }]
    });
    await guestRouter.push('/closet');
    await guestRouter.isReady();
    vi.spyOn(supabaseService, 'fetchPublicClosetFromSupabase').mockResolvedValue({
      status: 'unavailable',
      profile: null,
      items: []
    });

    const wrapper = mount(ClosetView, {
      global: { plugins: [guestRouter] }
    });

    expect(wrapper.find('h1').text()).toBe('公開衣櫥');
    expect(wrapper.find('h1').text()).not.toContain('的衣櫥');
  });
});
