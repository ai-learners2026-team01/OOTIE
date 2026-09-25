import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAppStore } from './app';

export const useClosetStore = defineStore('closet', () => {
  const appStore = useAppStore();

  const activeCategory = ref('All');
  const searchQuery = ref('');
  const colorFilter = ref('');
  const seasonFilter = ref('');
  const styleFilter = ref('');

  const filteredItems = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    const color = colorFilter.value;
    const season = seasonFilter.value;
    const style = styleFilter.value;
    const cat = activeCategory.value;

    return appStore.items.filter((item) => {
      const searchable = `${item.name} ${item.name_zh || ''} ${item.brand || ''} ${item.category}`.toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (cat === 'All' || item.category === cat) &&
        (!color || item.primary_color === color) &&
        (!season || item.season === season) &&
        (!style || item.style === style)
      );
    });
  });

  const toggleFavorite = (id) => {
    const item = appStore.items.find((entry) => entry.id === id);
    if (item) {
      item.favorite = !item.favorite;
      appStore.showToast(item.favorite ? '已加入收藏' : '已取消收藏');
    }
  };

  const addItem = (itemData) => {
    appStore.items.unshift({
      ...itemData,
      id: crypto.randomUUID(),
      owner_id: 'profile-01',
      name_zh: itemData.name_zh || '',
      secondary_color: itemData.secondary_color || '',
      color_hex: '#D8D2C8',
      wear_count: 0,
      last_worn: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      favorite: false,
      hidden: false,
      created_at: new Date().toISOString(),
      photo: itemData.photo || 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85'
    });
    appStore.showToast('已加入衣櫥');
  };

  const updateItem = (id, itemData) => {
    const target = appStore.items.find((item) => item.id === id);
    if (target) {
      Object.assign(target, itemData);
      appStore.showToast('衣櫥已更新');
    }
  };

  const deleteItem = (id) => {
    const target = appStore.items.find((item) => item.id === id);
    if (!target) return;
    if (confirm(`確定要將「${target.name_zh || target.name}」從衣櫥刪除嗎？`)) {
      appStore.items = appStore.items.filter((item) => item.id !== id);
      appStore.isDetailOpen = false;
      appStore.showToast('單品已從衣櫥移除');
    }
  };

  const clearFilters = () => {
    activeCategory.value = 'All';
    searchQuery.value = '';
    colorFilter.value = '';
    seasonFilter.value = '';
    styleFilter.value = '';
  };

  return {
    activeCategory,
    searchQuery,
    colorFilter,
    seasonFilter,
    styleFilter,
    filteredItems,
    toggleFavorite,
    addItem,
    updateItem,
    deleteItem,
    clearFilters
  };
});
