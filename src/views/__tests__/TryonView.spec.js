import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TryonView from '../TryonView.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

vi.mock('@/services/fal', () => ({
  hasFalConfig: vi.fn(() => false),
  callFalOutfitApi: vi.fn(),
  callFalTryOnApi: vi.fn()
}));

describe('TryonView.vue Integration Test', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('renders page header, image-only model cards, and no mirror icon in empty preview', () => {
    const wrapper = mount(TryonView);

    expect(wrapper.find('h1').text()).toBe('虛擬試穿');
    expect(wrapper.text()).toContain('Virtual Try-On');
    expect(wrapper.text()).toContain('1. 選擇試穿模特兒');

    // Model cards have images and aria-labels, but no text spans
    const modelCards = wrapper.findAll('.model-card');
    expect(modelCards.length).toBeGreaterThan(0);
    expect(modelCards[0].find('img').exists()).toBe(true);
    expect(modelCards[0].find('span').exists()).toBe(false);
    expect(modelCards[0].attributes('aria-label')).toBeTruthy();

    // Empty preview has text but NO mirror icon
    const emptyPreview = wrapper.find('.empty-preview');
    expect(emptyPreview.exists()).toBe(true);
    expect(emptyPreview.text()).toContain('選取模特兒與服飾後，點擊「開始 AI 試穿預覽」即可生成模擬圖！');
    expect(emptyPreview.find('.placeholder-icon').exists()).toBe(false);
    expect(emptyPreview.text()).not.toContain('🪞');
  });

  it('opens clothing picker dialog, toggles items, confirms and removes selection', async () => {
    const appStore = useAppStore();
    appStore.items = [
      { id: '1', name: '針織外套', name_zh: '針織外套', photo: 'knit.jpg' },
      { id: '2', name: '牛仔長褲', name_zh: '牛仔長褲', photo: 'jeans.jpg' }
    ];

    const wrapper = mount(TryonView);
    await flushPromises();

    // Initially selected item 1 on mount
    expect(wrapper.findAll('.selected-cloth-card').length).toBe(1);

    // Open clothing picker
    const openBtn = wrapper.find('.btn-select-clothes');
    await openBtn.trigger('click');
    expect(wrapper.find('.clothes-picker-dialog').exists()).toBe(true);

    // Dialog has clothes options with images only
    const pickerCards = wrapper.findAll('.clothes-picker-dialog .cloth-card');
    expect(pickerCards.length).toBe(2);
    expect(pickerCards[0].find('img').exists()).toBe(true);
    expect(pickerCards[0].find('span').exists()).toBe(false);

    // Toggle second item
    await pickerCards[1].trigger('click');

    // Confirm selection
    const confirmBtn = wrapper.find('.clothes-picker-dialog .btn-primary');
    await confirmBtn.trigger('click');
    await flushPromises();

    // Dialog closed and 2 items selected on page
    expect(wrapper.find('.clothes-picker-dialog').exists()).toBe(false);
    expect(wrapper.findAll('.selected-cloth-card').length).toBe(2);
    expect(wrapper.text()).toContain('已選擇 2 件衣服');

    // Remove one item via remove button
    const removeBtns = wrapper.findAll('.remove-cloth-btn');
    await removeBtns[0].trigger('click');
    await flushPromises();
    expect(wrapper.findAll('.selected-cloth-card').length).toBe(1);

    // Remove remaining item -> empty state hint appears
    await wrapper.find('.remove-cloth-btn').trigger('click');
    await flushPromises();
    expect(wrapper.findAll('.selected-cloth-card').length).toBe(0);
    expect(wrapper.find('.empty-clothes-hint').exists()).toBe(true);
    expect(wrapper.find('.start-tryon-btn').attributes('disabled')).toBeDefined();
  });

  it('discards draft changes on picker cancel', async () => {
    const appStore = useAppStore();
    appStore.items = [
      { id: '1', name: '針織外套', name_zh: '針織外套', photo: 'knit.jpg' },
      { id: '2', name: '牛仔長褲', name_zh: '牛仔長褲', photo: 'jeans.jpg' }
    ];

    const wrapper = mount(TryonView);
    await flushPromises();
    expect(wrapper.findAll('.selected-cloth-card').length).toBe(1);

    // Open picker
    await wrapper.find('.btn-select-clothes').trigger('click');

    // Toggle second item
    const pickerCards = wrapper.findAll('.clothes-picker-dialog .cloth-card');
    await pickerCards[1].trigger('click');

    // Cancel selection
    const cancelBtn = wrapper.find('.clothes-picker-dialog .btn-ghost');
    await cancelBtn.trigger('click');
    await flushPromises();

    // Dialog closed and selection remains 1 item
    expect(wrapper.find('.clothes-picker-dialog').exists()).toBe(false);
    expect(wrapper.findAll('.selected-cloth-card').length).toBe(1);
  });

  it('triggers auth modal if guest tries to start try-on without login', async () => {
    const authStore = useAuthStore();
    const appStore = useAppStore();
    appStore.items = [
      { id: '1', name: '針織外套', name_zh: '針織外套', photo: 'test.jpg' }
    ];

    const wrapper = mount(TryonView);
    await flushPromises();

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
    await flushPromises();

    // Start try-on
    const startBtn = wrapper.find('.start-tryon-btn');
    await startBtn.trigger('click');
    await flushPromises();

    // Verify result is displayed
    expect(wrapper.find('.result-display').exists()).toBe(true);
    expect(wrapper.text()).toContain('我的 輕鬆 穿搭試穿');

    // Save to history
    const saveBtns = wrapper.findAll('.result-actions .btn-secondary');
    const saveHistoryBtn = saveBtns.find((b) => b.text().includes('儲存至畫廊'));
    expect(saveHistoryBtn).toBeTruthy();
    await saveHistoryBtn.trigger('click');

    expect(wrapper.findAll('.gallery-card').length).toBe(1);
    expect(wrapper.find('.tryon-history-section').text()).toContain('歷史試穿畫廊 (1)');
  });

  it('opens OOTD modal when clicking post to OOTD', async () => {
    const authStore = useAuthStore();
    const appStore = useAppStore();
    authStore.user = { id: 'user-01', email: 'ming@example.com' };
    appStore.items = [
      { id: 'item-1', name: '丹寧襯衫', name_zh: '丹寧襯衫', photo: 'denim.jpg' }
    ];

    const wrapper = mount(TryonView);
    await flushPromises();

    const startBtn = wrapper.find('.start-tryon-btn');
    await startBtn.trigger('click');
    await flushPromises();

    const postBtn = wrapper.find('.result-actions .btn-primary');
    await postBtn.trigger('click');

    expect(appStore.isOotdFormOpen).toBe(true);
  });
});
