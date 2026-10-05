import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../HomeView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/closet', component: { template: '<div>Closet</div>' } },
    { path: '/sos', component: { template: '<div>SOS</div>' } },
    { path: '/explore', component: { template: '<div>Explore</div>' } }
  ]
});

describe('HomeView.vue Integration Test', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    setActivePinia(createPinia());
    router.push('/');
    await router.isReady();
  });

  it('renders welcome text and occasion recommendation panel', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('今天想穿什麼？');
    expect(wrapper.text()).toContain('OOTie 為你挑了一套');
    expect(wrapper.find('.occasion-row').exists()).toBe(true);
  });

  it('shows the correct greeting at each time boundary', () => {
    vi.useFakeTimers();

    const greetings = [
      [3, '晚上好'],
      [4, '日安'],
      [7, '日安'],
      [8, '早安'],
      [11, '早安'],
      [12, '午安'],
      [13, '下午好'],
      [16, '下午好'],
      [17, '晚上好']
    ];

    greetings.forEach(([hour, greeting]) => {
      vi.setSystemTime(new Date(2026, 9, 5, hour));
      const wrapper = mount(HomeView, {
        global: {
          plugins: [router]
        }
      });

      expect(wrapper.find('.home-header-row .eyebrow').text()).toContain(greeting);
      wrapper.unmount();
    });
  });

  it('switches recommended occasion when occasion button clicked', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    });

    const occasionButtons = wrapper.findAll('.occasion');
    expect(occasionButtons.length).toBeGreaterThan(0);

    // Click "上班"
    const workBtn = occasionButtons.find((b) => b.text() === '上班');
    await workBtn.trigger('click');

    expect(wrapper.find('.recommendation h3').text()).toBe('工作日的俐落一套');
  });
});
