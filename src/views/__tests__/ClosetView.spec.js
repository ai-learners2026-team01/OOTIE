import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ClosetView from '../ClosetView.vue';
import { useAppStore } from '@/stores/app';

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/closet', component: ClosetView }]
});

describe('ClosetView.vue Integration Test', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
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
});
