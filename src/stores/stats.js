import { defineStore } from 'pinia';
import { useAppStore } from './app';
import { useClosetStore } from './closet';
import { labels, getColorFamilyForPrimaryColor } from '@/constants';
import {
  fetchClosetStatsFromSupabase,
  fetchBrandStatsFromSupabase,
  fetchTopWornItemsFromSupabase,
  fetchCostPerWearRankingFromSupabase,
  fetchDisusedItemsFromSupabase
} from '@/services/supabase';

export const useStatsStore = defineStore('stats', () => {
  const appStore = useAppStore();
  const closetStore = useClosetStore();

  const colorFamilyMap = {
    '無彩色系': '無彩色系', '白色': '無彩色系', '黑色': '無彩色系', '炭灰色': '無彩色系', '米白色': '無彩色系', '白色系': '無彩色系', '黑色系': '無彩色系', '灰色系': '無彩色系',
    '大地色系': '大地色系', '卡其色': '大地色系', '奶茶色': '大地色系', '棕色': '大地色系', '米色': '大地色系', '棕色系': '大地色系', '米色系': '大地色系',
    '清甜暖色系': '清甜暖色系', '暖橙色': '清甜暖色系', '奶油黃': '清甜暖色系', '櫻花粉': '清甜暖色系', '芥末黃': '清甜暖色系',
    '藍綠冷色系': '藍綠冷色系', '丹寧藍': '藍綠冷色系', '天藍色': '藍綠冷色系', '軍綠色': '藍綠冷色系', '酪梨綠': '藍綠冷色系', '藍色系': '藍綠冷色系',
    '紫紅神秘系': '紫紅神秘系', '酒紅色': '紫紅神秘系', '薰衣草紫': '紫紅神秘系', '玫瑰紅': '紫紅神秘系', '葡萄紫': '紫紅神秘系'
  };

  const aggregateLocalClosetStats = () => {
    const visibleItems = appStore.items.filter((item) => item.hidden !== true && item.hidden !== 'true');
    const groupBy = (field, includeColor) => {
      return Object.values(
        visibleItems.reduce((groups, item) => {
          let value = item[field];
          if (field === 'secondary_color') {
            value = colorFamilyMap[String(item[field] || '').trim()] || getColorFamilyForPrimaryColor(item.primary_color) || '未分類';
          }
          const groupValue = value || '未分類';
          if (!groups[groupValue]) {
            groups[groupValue] = {
              [field === 'primary_color' ? 'color' : field]: groupValue,
              count: 0
            };
          }
          groups[groupValue].count += 1;
          if (includeColor && !groups[groupValue].color_hex) {
            groups[groupValue].color_hex = item.color_hex || '#D8D2C8';
          }
          return groups;
        }, {})
      );
    };

    return {
      colorStats: groupBy('primary_color', true),
      colorFamilyStats: groupBy('secondary_color', false),
      styleStats: groupBy('style', false),
      categoryStats: groupBy('category', false)
    };
  };

  const getClosetStats = async () => {
    const remote = await fetchClosetStatsFromSupabase();
    if (remote && ['colorStats', 'colorFamilyStats', 'styleStats', 'categoryStats'].every((key) => Array.isArray(remote[key]))) {
      const hasStats = Object.values(remote).some((entries) => entries.some((entry) => Number(entry.count) > 0));
      if (hasStats) return remote;
    }
    return aggregateLocalClosetStats();
  };

  const getBrandStats = async () => {
    const remote = await fetchBrandStatsFromSupabase();
    if (Array.isArray(remote) && remote.length > 0) {
      return remote.map((row) => ({
        brand: row.brand || '未分類',
        count: Number(row.item_count || 0),
        totalWearCount: Number(row.total_wear_count || 0)
      }));
    }

    const groups = {};
    appStore.items
      .filter((item) => item.hidden !== true && item.hidden !== 'true')
      .forEach((item) => {
        const displayBrand = String(item.brand || '').trim();
        const brandKey = displayBrand.toLowerCase() || '未分類';
        if (!groups[brandKey]) {
          groups[brandKey] = { brand: displayBrand || '未分類', count: 0, totalWearCount: 0 };
        }
        groups[brandKey].count += 1;
        groups[brandKey].totalWearCount += Number(item.wear_count || 0);
      });

    return Object.values(groups)
      .sort((a, b) => b.count - a.count || b.totalWearCount - a.totalWearCount)
      .slice(0, 10);
  };

  const getTopWornItems = async () => {
    const remote = await fetchTopWornItemsFromSupabase();
    if (Array.isArray(remote) && remote.length > 0) {
      return remote.map((row) => ({
        id: row.id,
        name: row.name || '',
        name_zh: row.name_zh || '',
        photo: row.photo || '',
        wear_count: Number(row.wear_count || 0)
      }));
    }

    return [...appStore.items]
      .filter((item) => item.hidden !== true && item.hidden !== 'true')
      .sort((a, b) => Number(b.wear_count || 0) - Number(a.wear_count || 0));
  };

  const getCostPerWearRanking = async () => {
    const remote = await fetchCostPerWearRankingFromSupabase();
    if (Array.isArray(remote) && remote.length > 0) {
      return remote.map((row) => ({
        id: row.id,
        name: row.name || '',
        name_zh: row.name_zh || '',
        photo: row.photo || '',
        price: Number(row.price),
        wear_count: Number(row.wear_count || 0),
        cost_per_wear: Number(row.cost_per_wear)
      }));
    }

    return [...appStore.items]
      .filter((item) => item.hidden !== true && item.hidden !== 'true' && closetStore.calculateCostPerWear(item) !== null)
      .sort((a, b) => (closetStore.calculateCostPerWear(a) || 0) - (closetStore.calculateCostPerWear(b) || 0))
      .map((item) => ({
        ...item,
        cost_per_wear: closetStore.calculateCostPerWear(item)
      }));
  };

  const getDisusedRanking = async () => {
    const remote = await fetchDisusedItemsFromSupabase();
    if (Array.isArray(remote) && remote.length > 0) {
      return remote.map((row) => ({
        id: row.id,
        name: row.name || '',
        name_zh: row.name_zh || '',
        photo: row.photo || '',
        wear_count: Number(row.wear_count || 0),
        last_worn: row.last_worn || '',
        notes: appStore.items.find((item) => item.id === row.id)?.notes || ''
      }));
    }

    return closetStore.disusedItems;
  };

  const getYearlySummary = (year) => {
    const targetYear = Number(year);
    const visibleItems = appStore.items.filter((item) => item.hidden !== true && item.hidden !== 'true');

    const purchasedInYear = visibleItems.filter((item) => {
      if (!item.purchase_date) return false;
      const d = new Date(item.purchase_date);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === targetYear;
    });

    const wornInYear = visibleItems.filter((item) => {
      if (!item.last_worn) return false;
      const d = new Date(item.last_worn);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === targetYear;
    });

    // 1. 年度最愛顏色
    const colorCounts = {};
    const colorWearSums = {};
    purchasedInYear.forEach((item) => {
      const c = String(item.primary_color || '').trim();
      if (!c) return;
      colorCounts[c] = (colorCounts[c] || 0) + 1;
      colorWearSums[c] = (colorWearSums[c] || 0) + Number(item.wear_count || 0);
    });
    const topColorEntry = Object.entries(colorCounts).sort(
      (a, b) => b[1] - a[1] || (colorWearSums[b[0]] || 0) - (colorWearSums[a[0]] || 0)
    )[0];
    const topColor = topColorEntry ? { name: topColorEntry[0], count: topColorEntry[1] } : null;

    // 2. 年度最愛風格
    const styleCounts = {};
    purchasedInYear.forEach((item) => {
      const s = String(item.style || '').trim();
      if (!s) return;
      styleCounts[s] = (styleCounts[s] || 0) + 1;
    });
    const topStyleEntry = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0];
    const topStyle = topStyleEntry ? { name: labels[topStyleEntry[0]] || topStyleEntry[0], count: topStyleEntry[1] } : null;

    // 3. 年度最常穿單品
    const mostWornItem = [...wornInYear].sort((a, b) => Number(b.wear_count || 0) - Number(a.wear_count || 0))[0] || null;

    // 4. 年度最愛品牌
    const brandCounts = {};
    purchasedInYear.forEach((item) => {
      const b = String(item.brand || '').trim();
      if (!b) return;
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    });
    const topBrandEntry = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0];
    const topBrand = topBrandEntry ? { name: topBrandEntry[0], count: topBrandEntry[1] } : null;

    return {
      year: targetYear,
      totalPurchased: purchasedInYear.length,
      topColor,
      topStyle,
      mostWornItem: mostWornItem
        ? {
            name: mostWornItem.name_zh || mostWornItem.name || '未命名單品',
            wearCount: Number(mostWornItem.wear_count || 0)
          }
        : null,
      topBrand
    };
  };

  return {
    getClosetStats,
    getBrandStats,
    getTopWornItems,
    getCostPerWearRanking,
    getDisusedRanking,
    getYearlySummary
  };
});
