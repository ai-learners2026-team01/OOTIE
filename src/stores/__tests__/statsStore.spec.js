import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../app';
import { useAuthStore } from '../auth';
import { useClosetStore } from '../closet';
import { useStatsStore } from '../stats';
import * as supabaseService from '@/services/supabase';

describe('Stats Store & Aizhen Features', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('should calculate closet stats distributions', async () => {
    const statsStore = useStatsStore();
    const stats = await statsStore.getClosetStats();

    expect(stats).toHaveProperty('colorStats');
    expect(stats).toHaveProperty('colorFamilyStats');
    expect(stats).toHaveProperty('styleStats');
    expect(stats).toHaveProperty('categoryStats');
    expect(stats.colorStats.length).toBeGreaterThan(0);
    expect(stats.categoryStats.length).toBeGreaterThan(0);
  });

  it('should calculate brand statistics correctly', async () => {
    const statsStore = useStatsStore();
    const brandStats = await statsStore.getBrandStats();

    expect(Array.isArray(brandStats)).toBe(true);
    expect(brandStats.length).toBeGreaterThan(0);
    expect(brandStats[0]).toHaveProperty('brand');
    expect(brandStats[0]).toHaveProperty('count');
    expect(brandStats[0]).toHaveProperty('totalWearCount');
  });

  it('should rank top worn items in descending wear count', async () => {
    const statsStore = useStatsStore();
    const topWorn = await statsStore.getTopWornItems();

    expect(topWorn.length).toBeGreaterThan(0);
    for (let i = 0; i < topWorn.length - 1; i++) {
      expect(topWorn[i].wear_count).toBeGreaterThanOrEqual(topWorn[i + 1].wear_count);
    }
  });

  it('should calculate Cost Per Wear (CPW) ranking', async () => {
    const closetStore = useClosetStore();
    const statsStore = useStatsStore();

    const sampleItem = { price: 2000, wear_count: 10 };
    expect(closetStore.calculateCostPerWear(sampleItem)).toBe(200);

    const zeroWearItem = { price: 2000, wear_count: 0 };
    expect(closetStore.calculateCostPerWear(zeroWearItem)).toBeNull();

    const ranking = await statsStore.getCostPerWearRanking();
    expect(ranking.length).toBeGreaterThan(0);
    for (let i = 0; i < ranking.length - 1; i++) {
      expect(ranking[i].cost_per_wear).toBeLessThanOrEqual(ranking[i + 1].cost_per_wear);
    }
  });

  it('ranks authenticated cost-per-wear items using ootie_clothing_items.wear_count', async () => {
    const authStore = useAuthStore();
    authStore.user = { id: 'user-1' };
    authStore.session = { access_token: 'real-access-token', user: authStore.user };
    vi.spyOn(supabaseService, 'fetchLegacyClosetFromSupabase').mockResolvedValue({
      status: 'success',
      items: [
        { id: 'worn-30', name: 'Often worn item', price: 1200, wear_count: 30, photo: 'photo-a' },
        { id: 'worn-4', name: 'Rarely worn item', price: 1000, wear_count: 4, photo: 'photo-b' },
        { id: 'unworn', name: 'Unworn item', price: 500, wear_count: 0, photo: 'photo-c' }
      ]
    });
    const statsStore = useStatsStore();

    const ranking = await statsStore.getCostPerWearRanking();

    expect(ranking).toEqual([
      expect.objectContaining({ id: 'worn-30', wear_count: 30, cost_per_wear: 40 }),
      expect.objectContaining({ id: 'worn-4', wear_count: 4, cost_per_wear: 250 })
    ]);
    expect(supabaseService.fetchLegacyClosetFromSupabase).toHaveBeenCalledOnce();
  });

  it('should detect disused items and mark for clearance', async () => {
    const appStore = useAppStore();
    const closetStore = useClosetStore();

    expect(closetStore.disusedItems.length).toBeGreaterThan(0);

    const targetItem = closetStore.disusedItems[0];
    await closetStore.markItemForClearance(targetItem.id);

    const updatedItem = appStore.items.find((i) => i.id === targetItem.id);
    expect(updatedItem.notes).toContain('[待出清]');
  });

  it('should generate yearly summary report', () => {
    const statsStore = useStatsStore();
    const summary = statsStore.getYearlySummary(2026);

    expect(summary).toHaveProperty('year', 2026);
    expect(summary).toHaveProperty('totalPurchased');
    expect(summary).toHaveProperty('topColor');
    expect(summary).toHaveProperty('topStyle');
    expect(summary).toHaveProperty('topBrand');
  });
});
