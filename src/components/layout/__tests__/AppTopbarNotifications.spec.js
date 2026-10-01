import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import AppTopbar from '../AppTopbar.vue';
import NotificationModal from '@/components/modal/NotificationModal.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }]
});

describe('AppTopbar notifications privacy', () => {
  let appStore;
  let authStore;
  let router;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    appStore = useAppStore();
    authStore = useAuthStore();
    router = createTestRouter();
    appStore.notifications = [{
      id: 'private-notification',
      text: 'A private notification',
      read: false,
      time: '剛剛'
    }];
    vi.spyOn(authStore, 'initAuth').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks guests to log in without showing counts or marking notifications read', async () => {
    authStore.user = null;
    const wrapper = mount(AppTopbar, { global: { plugins: [router] } });

    expect(wrapper.find('.notification-badge').exists()).toBe(false);
    await wrapper.find('[aria-label="通知"]').trigger('click');

    expect(authStore.isAuthModalOpen).toBe(true);
    expect(appStore.isNotificationOpen).toBe(false);
    expect(appStore.notifications[0].read).toBe(false);
  });

  it('hides notification contents from guests even if the modal state is already open', () => {
    authStore.user = null;
    appStore.isNotificationOpen = true;
    const wrapper = mount(NotificationModal, { global: { plugins: [router] } });

    expect(wrapper.find('.notification-modal').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('A private notification');
  });

  it('shows notifications to signed-in users and closes them on logout', async () => {
    authStore.user = { id: 'user-01' };
    const topbar = mount(AppTopbar, { global: { plugins: [router] } });
    const modal = mount(NotificationModal, { global: { plugins: [router] } });

    expect(topbar.find('.notification-badge').text()).toBe('1');
    await topbar.find('[aria-label="通知"]').trigger('click');
    await modal.vm.$nextTick();

    expect(appStore.isNotificationOpen).toBe(true);
    expect(appStore.notifications[0].read).toBe(true);
    expect(modal.text()).toContain('A private notification');

    authStore.user = null;
    await topbar.vm.$nextTick();

    expect(appStore.isNotificationOpen).toBe(false);
  });
});