import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAppStore } from './app';
import {
  DISUSED_DAYS_THRESHOLD,
  DISUSED_WEAR_COUNT_THRESHOLD,
  getColorFamilyForPrimaryColor,
  colorHexValues,
  labels
} from '@/constants';
import { markItemClearanceInSupabase, deleteItemFromSupabase } from '@/services/supabase';

export const useClosetStore = defineStore('closet', () => {
  const appStore = useAppStore();

  const activeCategory = ref('All');
  const searchQuery = ref('');
  const colorFamilyFilter = ref('');
  const colorFilter = ref('');
  const seasonFilter = ref('');
  const styleFilter = ref('');

  const normalizeFilterValue = (value) => {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  };

  const matchesFilterValue = (itemValue, selectedValue) => {
    if (!selectedValue) return true;
    const itemKey = normalizeFilterValue(itemValue);
    const selectedKey = normalizeFilterValue(selectedValue);
    if (itemKey === selectedKey) return true;
    return normalizeFilterValue(labels[itemValue]) === selectedKey || normalizeFilterValue(labels[selectedValue]) === itemKey;
  };

  const calculateCostPerWear = (item) => {
    const price = Number(item?.price);
    const wearCount = Number(item?.wear_count || 0);
    if (!Number.isFinite(price) || price <= 0 || wearCount <= 0) return null;
    return Math.round(price / wearCount);
  };

  const getDaysSinceLastWorn = (lastWorn) => {
    if (!lastWorn) return null;
    const wornDate = new Date(lastWorn);
    if (Number.isNaN(wornDate.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - wornDate.getTime()) / 86400000));
  };

  const isDisusedItem = (item) => {
    if (item.hidden === true || item.hidden === 'true') return false;
    const wearCount = Number(item.wear_count || 0);
    const daysSinceLastWorn = getDaysSinceLastWorn(item.last_worn);
    return (
      (daysSinceLastWorn !== null && daysSinceLastWorn > DISUSED_DAYS_THRESHOLD) ||
      wearCount < DISUSED_WEAR_COUNT_THRESHOLD ||
      (!item.last_worn && wearCount === 0)
    );
  };

  const disusedItems = computed(() => {
    return appStore.items
      .filter(isDisusedItem)
      .sort((a, b) => {
        const aDays = getDaysSinceLastWorn(a.last_worn);
        const bDays = getDaysSinceLastWorn(b.last_worn);
        if (aDays === null && bDays !== null) return -1;
        if (aDays !== null && bDays === null) return 1;
        return (bDays || 0) - (aDays || 0);
      });
  });

  const filteredItems = computed(() => {
    const query = normalizeFilterValue(searchQuery.value);
    const color = colorFilter.value;
    const colorFamily = colorFamilyFilter.value;
    const season = seasonFilter.value;
    const style = styleFilter.value;
    const cat = activeCategory.value;

    return appStore.items.filter((item) => {
      if (item.hidden === true || item.hidden === 'true') return false;
      const searchable = normalizeFilterValue(`${item.name} ${item.name_zh || ''} ${item.brand || ''} ${item.category}`);
      return (
        (!query || searchable.includes(query)) &&
        (cat === 'All' || matchesFilterValue(item.category, cat)) &&
        matchesFilterValue(item.secondary_color, colorFamily) &&
        matchesFilterValue(item.primary_color, color) &&
        matchesFilterValue(item.season, season) &&
        matchesFilterValue(item.style, style)
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

  const markItemForClearance = async (id) => {
    const item = appStore.items.find((entry) => entry.id === id);
    if (!item || String(item.notes || '').includes('[待出清]')) return;
    item.notes = `${item.notes ? `${item.notes.trim()} ` : ''}[待出清]`;
    await markItemClearanceInSupabase(id, item.notes);
    appStore.showToast('已標記為考慮出清');
  };

  const addItem = (itemData) => {
    const primaryColor = itemData.primary_color || '白色';
    const secondaryColor = itemData.secondary_color || getColorFamilyForPrimaryColor(primaryColor) || '無彩色系';
    const colorHex = colorHexValues[primaryColor] || itemData.color_hex || '#D8D2C8';
    const rawPrice = itemData.price !== undefined && itemData.price !== null && itemData.price !== '' ? Number(itemData.price) : null;

    const newItem = {
      ...itemData,
      id: crypto.randomUUID(),
      owner_id: 'profile-01',
      name: itemData.name || itemData.name_zh || '未命名單品',
      name_zh: itemData.name_zh || itemData.name || '未命名單品',
      brand: itemData.brand || '',
      category: itemData.category || 'Tops',
      shape: itemData.shape || '',
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      color_hex: colorHex,
      style: itemData.style || 'Casual',
      season: itemData.season || 'All year',
      price: rawPrice,
      wear_count: Number(itemData.wear_count || 0),
      last_worn: itemData.last_worn || '',
      purchase_date: itemData.purchase_date || new Date().toISOString().slice(0, 10),
      favorite: itemData.favorite || false,
      hidden: false,
      notes: itemData.notes || '',
      created_at: new Date().toISOString(),
      photo: itemData.photo || 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=85'
    };
    appStore.items.unshift(newItem);
    appStore.showToast('已加入衣櫥');
    return newItem;
  };

  const updateItem = (id, itemData) => {
    const target = appStore.items.find((item) => item.id === id);
    if (target) {
      const primaryColor = itemData.primary_color || target.primary_color;
      const secondaryColor = itemData.secondary_color || getColorFamilyForPrimaryColor(primaryColor) || target.secondary_color;
      const colorHex = colorHexValues[primaryColor] || itemData.color_hex || target.color_hex;
      const rawPrice = itemData.price !== undefined && itemData.price !== null && itemData.price !== '' ? Number(itemData.price) : null;

      Object.assign(target, {
        ...itemData,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        color_hex: colorHex,
        price: rawPrice
      });
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
      deleteItemFromSupabase(id).catch((e) => console.warn('Supabase delete failed:', e));
    }
  };

  const clearFilters = () => {
    activeCategory.value = 'All';
    searchQuery.value = '';
    colorFamilyFilter.value = '';
    colorFilter.value = '';
    seasonFilter.value = '';
    styleFilter.value = '';
  };

  return {
    activeCategory,
    searchQuery,
    colorFamilyFilter,
    colorFilter,
    seasonFilter,
    styleFilter,
    filteredItems,
    disusedItems,
    getDaysSinceLastWorn,
    isDisusedItem,
    calculateCostPerWear,
    markItemForClearance,
    toggleFavorite,
    addItem,
    updateItem,
    deleteItem,
    clearFilters
  };
});

