import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AiView from '../AiView.vue';
import { useAppStore } from '@/stores/app';

vi.mock('@/services/fal', () => ({
  hasFalConfig: vi.fn(() => false),
  callFalOutfitApi: vi.fn(),
  callFalTryOnApi: vi.fn()
}));

describe('AiView.vue Integration Test', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('renders page header and setup panel', () => {
    const wrapper = mount(AiView);

    expect(wrapper.text()).toContain('AI Style Assistant');
    expect(wrapper.text()).toContain('設定穿搭需求');
    expect(wrapper.find('.range-input').exists()).toBe(true);
  });

  it('allows selecting occasion, weather, and vibe options', async () => {
    const wrapper = mount(AiView);

    const occasionChips = wrapper.findAll('.field-group:nth-child(1) .chip-btn');
    const dateBtn = occasionChips.find(btn => btn.text().includes('約會'));
    if (dateBtn) {
      await dateBtn.trigger('click');
      expect(dateBtn.classes()).toContain('active');
    }

    const weatherChips = wrapper.findAll('.field-group:nth-child(2) .chip-btn');
    const rainBtn = weatherChips.find(btn => btn.text().includes('下雨天'));
    if (rainBtn) {
      await rainBtn.trigger('click');
      expect(rainBtn.classes()).toContain('active');
    }
  });

  it('generates outfit recommendations when clicking generate button', async () => {
    const appStore = useAppStore();
    appStore.items = [
      { id: '1', name: '針織衫', name_zh: '針織衫', category: 'Tops', photo: 'test1.jpg' },
      { id: '2', name: '西裝褲', name_zh: '西裝褲', category: 'Bottoms', photo: 'test2.jpg' }
    ];

    const wrapper = mount(AiView);
    const generateBtn = wrapper.find('.generate-btn');

    await generateBtn.trigger('click');
    await flushPromises();

    const resultCards = wrapper.findAll('.result-card');
    expect(resultCards.length).toBeGreaterThan(0);
    expect(wrapper.find('.ai-history-section').text()).toContain('歷史生成紀錄 (1)');
  });

  it('clears history when clicking clear history button', async () => {
    const wrapper = mount(AiView);
    const generateBtn = wrapper.find('.generate-btn');

    await generateBtn.trigger('click');
    await flushPromises();
    expect(wrapper.findAll('.history-card').length).toBe(1);

    const clearBtn = wrapper.find('.btn-text-danger');
    await clearBtn.trigger('click');

    expect(wrapper.findAll('.history-card').length).toBe(0);
    expect(wrapper.text()).toContain('尚未生成過 AI 組合');
  });
});
