import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TryonView from '../TryonView.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

describe('TryonView.vue Integration Test', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('renders page header and model selection cards', () => {
    const wrapper = mount(TryonView);

    expect(wrapper.text()).toContain('Virtual Try-On');
    expect(wrapper.text()).toContain('1. 選擇模特兒身型');
    expect(wrapper.findAll('.model-card').length).toBeGreaterThan(0);
  });

  it('triggers auth modal if guest tries to start try-on without login', async () => {
    const authStore = useAuthStore();
    const appStore = useAppStore();
    appStore.items = [
      { id: '1', name: '針織外套', name_zh: '針織外套', photo: 'test.jpg' }
    ];

    const wrapper = mount(TryonView);

    // Select first garment item
    const firstCheckbox = wrapper.find('input[type="checkbox"]');
    if (firstCheckbox.exists()) {
      await firstCheckbox.setValue(true);
    }

    const startBtn = wrapper.find('.start-tryon-btn');
    await startBtn.trigger('click');

    // Should prompt login modal for guest
    expect(authStore.isAuthModalOpen).toBe(true);
  });

  it('generates try-on result and allows saving to history when logged in', async () => {
    const authStore = useAuthStore();
    const appStore = useAppStore();
    authStore.user = { id: 'user-01', email: 'ming@example.com' };
    appStore.items = [
      { id: 'item-1', name: '丹寧襯衫', name_zh: '丹寧襯衫', photo: 'denim.jpg' }
    ];

    const wrapper = mount(TryonView);

    // Select garment
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);

    // Start try-on
    const startBtn = wrapper.find('.start-tryon-btn');
    await startBtn.trigger('click');

    // Verify result is displayed
    expect(wrapper.find('.result-display').exists()).toBe(true);
    expect(wrapper.text()).toContain('我的 輕鬆 穿搭試穿');

    // Save to history
    const saveBtn = wrapper.find('.result-actions .btn-secondary');
    await saveBtn.trigger('click');

    expect(wrapper.findAll('.gallery-card').length).toBe(1);
    expect(wrapper.find('.tryon-history-section').text()).toContain('歷史試穿畫廊 (1)');
  });

  it('opens OOTD modal when clicking post to OOTD', async () => {
    const authStore = useAuthStore();
    const appStore = useAppStore();
    authStore.user = { id: 'user-01', email: 'ming@example.com' };

    const wrapper = mount(TryonView);
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);

    const startBtn = wrapper.find('.start-tryon-btn');
    await startBtn.trigger('click');

    const postBtn = wrapper.find('.result-actions .btn-primary');
    await postBtn.trigger('click');

    expect(appStore.isOotdFormOpen).toBe(true);
  });
});
