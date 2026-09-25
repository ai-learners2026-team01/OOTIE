import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../app';
import { useClosetStore } from '../closet';

describe('Closet Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('should filter items by category', () => {
    const closetStore = useClosetStore();
    expect(closetStore.filteredItems.length).toBeGreaterThan(0);

    closetStore.activeCategory = 'Tops';
    expect(closetStore.filteredItems.every((item) => item.category === 'Tops')).toBe(true);

    closetStore.activeCategory = 'Shoes';
    expect(closetStore.filteredItems.every((item) => item.category === 'Shoes')).toBe(true);
  });

  it('should filter items by search query and options', () => {
    const closetStore = useClosetStore();

    closetStore.searchQuery = '襯衫';
    expect(closetStore.filteredItems.length).toBeGreaterThan(0);
    expect(closetStore.filteredItems.every((i) => (i.name + i.name_zh).includes('襯衫'))).toBe(true);

    closetStore.clearFilters();
    closetStore.colorFilter = 'White';
    expect(closetStore.filteredItems.every((i) => i.primary_color === 'White')).toBe(true);
  });

  it('should toggle favorite status of an item', () => {
    const appStore = useAppStore();
    const closetStore = useClosetStore();

    const targetItem = appStore.items[0];
    const initialFavorite = targetItem.favorite;

    closetStore.toggleFavorite(targetItem.id);
    expect(targetItem.favorite).toBe(!initialFavorite);

    closetStore.toggleFavorite(targetItem.id);
    expect(targetItem.favorite).toBe(initialFavorite);
  });

  it('should add a new item to closet', () => {
    const appStore = useAppStore();
    const closetStore = useClosetStore();

    const initialCount = appStore.items.length;
    const newItem = {
      name: 'Silk Scarf',
      name_zh: '絲巾',
      category: 'Accessories',
      primary_color: 'Beige',
      style: 'Chic',
      season: 'Spring / Summer',
      photo: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3'
    };

    closetStore.addItem(newItem);

    expect(appStore.items.length).toBe(initialCount + 1);
    expect(appStore.items[0].name).toBe('Silk Scarf');
    expect(appStore.items[0].category).toBe('Accessories');
  });

  it('should update an existing item', () => {
    const appStore = useAppStore();
    const closetStore = useClosetStore();

    const targetId = appStore.items[0].id;
    closetStore.updateItem(targetId, { name_zh: '改名的襯衫', brand: 'Uniqlo U' });

    const updated = appStore.items.find((i) => i.id === targetId);
    expect(updated.name_zh).toBe('改名的襯衫');
    expect(updated.brand).toBe('Uniqlo U');
  });

  it('should prompt confirmation and delete item', () => {
    const appStore = useAppStore();
    const closetStore = useClosetStore();

    // Mock confirm dialog
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const initialCount = appStore.items.length;
    const targetId = appStore.items[0].id;

    closetStore.deleteItem(targetId);

    expect(appStore.items.length).toBe(initialCount - 1);
    expect(appStore.items.find((i) => i.id === targetId)).toBeUndefined();
  });
});
