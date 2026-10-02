import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import { useBookmarksStore } from '../bookmarks';
import { useAuthStore } from '@/stores/auth';
import { BOOKMARKS_STORAGE_KEY } from '@/constants';
import {
  fetchBookmarksFromSupabase,
  insertBookmarkToSupabase,
  updateBookmarkInSupabase,
  deleteBookmarkFromSupabase,
  deleteBatchBookmarksFromSupabase
} from '@/services/supabase';

vi.mock('@/services/supabase', () => ({
  fetchBookmarksFromSupabase: vi.fn(),
  insertBookmarkToSupabase: vi.fn(),
  updateBookmarkInSupabase: vi.fn(),
  deleteBookmarkFromSupabase: vi.fn(),
  deleteBatchBookmarksFromSupabase: vi.fn(),
  uploadBookmarkImageToStorage: vi.fn()
}));

const userA = { id: '00000000-0000-4000-8000-000000000001', email: 'a@example.com' };
const userB = { id: '00000000-0000-4000-8000-000000000002', email: 'b@example.com' };

describe('Bookmarks Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(fetchBookmarksFromSupabase).mockResolvedValue(null);
    vi.mocked(insertBookmarkToSupabase).mockImplementation(async (payload) => ({
      id: '00000000-0000-4000-8000-000000000088',
      ...payload
    }));
    vi.mocked(updateBookmarkInSupabase).mockImplementation(async (id, payload) => ({
      ...payload,
      id
    }));
    vi.mocked(deleteBookmarkFromSupabase).mockResolvedValue(true);
    vi.mocked(deleteBatchBookmarksFromSupabase).mockResolvedValue(true);
  });

  it('should initialize with default bookmarks for guest', () => {
    const store = useBookmarksStore();
    expect(store.bookmarks.length).toBeGreaterThan(0);
    expect(store.bookmarks[0]).toHaveProperty('title');
    expect(store.bookmarks[0]).toHaveProperty('product_url');
  });

  it('should not restore stale app-state bookmarks over an explicitly empty guest cache', () => {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem('weary-app-state-v1', JSON.stringify({
      bookmarks: [{ id: 'stale-bookmark', title: 'Stale bookmark' }]
    }));

    const store = useBookmarksStore();
    expect(store.bookmarks).toEqual([]);
  });

  it('should clear stale local bookmarks when the remote account returns empty list', async () => {
    const authStore = useAuthStore();
    authStore.user = userA;
    const store = useBookmarksStore();
    store.bookmarks = [{ id: '00000000-0000-4000-8000-000000000001', title: 'Stale bookmark' }];
    vi.mocked(fetchBookmarksFromSupabase).mockResolvedValue([]);

    await store.fetchRemoteBookmarks();

    expect(store.bookmarks).toEqual([]);
    expect(JSON.parse(localStorage.getItem(`${BOOKMARKS_STORAGE_KEY}_${userA.id}`))).toEqual([]);
  });

  it('should add a new bookmark and persist to localStorage', async () => {
    const authStore = useAuthStore();
    authStore.user = userA;
    const store = useBookmarksStore();

    const newBookmark = await store.addBookmark({
      title: 'Silk Slip Dress',
      product_url: 'https://example.com/dress',
      price: '2800',
      currency: 'TWD',
      brand: 'Zara',
      color: 'Black',
      size: 'S'
    });

    expect(store.bookmarks.length).toBe(1);
    expect(store.bookmarks[0].title).toBe('Silk Slip Dress');
    expect(store.bookmarks[0].price).toBe('2800');

    const saved = JSON.parse(localStorage.getItem(`${BOOKMARKS_STORAGE_KEY}_${userA.id}`));
    expect(saved).toBeTruthy();
    expect(saved.some((b) => b.title === 'Silk Slip Dress')).toBe(true);
  });

  it('should update an existing bookmark', async () => {
    const authStore = useAuthStore();
    authStore.user = userA;
    const store = useBookmarksStore();
    store.bookmarks = [{
      id: '00000000-0000-4000-8000-000000000010',
      title: 'Original Title',
      price: '3000',
      currency: 'TWD'
    }];
    const targetId = store.bookmarks[0].id;

    await store.updateBookmark(targetId, {
      title: 'Updated Cardigan Title',
      price: '4500',
      currency: 'TWD',
      notes: 'New note'
    });

    const updated = store.bookmarks.find((b) => b.id === targetId);
    expect(updated.title).toBe('Updated Cardigan Title');
    expect(updated.price).toBe('4500');

    const saved = JSON.parse(localStorage.getItem(`${BOOKMARKS_STORAGE_KEY}_${userA.id}`));
    expect(saved.find((b) => b.id === targetId)?.title).toBe('Updated Cardigan Title');
  });

  it('should delete a bookmark', async () => {
    const authStore = useAuthStore();
    authStore.user = userA;
    const store = useBookmarksStore();
    store.bookmarks = [
      { id: '00000000-0000-4000-8000-000000000010', title: 'Cardigan' },
      { id: '00000000-0000-4000-8000-000000000020', title: 'Jeans' }
    ];

    await store.deleteBookmark('00000000-0000-4000-8000-000000000010');

    expect(store.bookmarks.length).toBe(1);
    expect(store.bookmarks[0].id).toBe('00000000-0000-4000-8000-000000000020');
  });

  it('should batch delete selected bookmarks', async () => {
    const authStore = useAuthStore();
    authStore.user = userA;
    const store = useBookmarksStore();
    store.bookmarks = [
      { id: '00000000-0000-4000-8000-000000000010', title: 'Cardigan' },
      { id: '00000000-0000-4000-8000-000000000020', title: 'Jeans' }
    ];
    store.selectedBookmarkIds = ['00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000020'];

    const deletedCount = await store.deleteSelectedBookmarks();

    expect(deletedCount).toBe(2);
    expect(store.bookmarks.length).toBe(0);
    expect(store.selectedBookmarkIds.length).toBe(0);
    expect(store.isManagerMode).toBe(false);
  });

  it('should detect duplicate bookmarks with matching url, variant, color, and size', () => {
    const store = useBookmarksStore();
    store.bookmarks = [{
      id: '00000000-0000-4000-8000-000000000010',
      product_url: 'https://example.com/item-1',
      variant_name: 'Regular',
      color: 'Blue',
      size: 'M'
    }];
    const first = store.bookmarks[0];

    const duplicate = store.findDuplicateBookmark(
      first.product_url,
      first.variant_name,
      first.color,
      first.size
    );

    expect(duplicate).toBeTruthy();
    expect(duplicate.id).toBe(first.id);
  });

  describe('Supabase Error & Failure Scenarios', () => {
    it('should keep existing local bookmarks intact when remote fetch fails or rejects', async () => {
      const store = useBookmarksStore();
      const initialBookmarks = [...store.bookmarks];
      vi.mocked(fetchBookmarksFromSupabase).mockRejectedValue(new Error('Network error'));

      const res = await store.fetchRemoteBookmarks();
      expect(res).toBeNull();
      expect(store.bookmarks).toEqual(initialBookmarks);
    });

    it('should throw and not add bookmark locally when Supabase insert fails or rejects', async () => {
      const authStore = useAuthStore();
      authStore.user = userA;
      const store = useBookmarksStore();
      const initialCount = store.bookmarks.length;
      vi.mocked(insertBookmarkToSupabase).mockResolvedValue(null);

      await expect(store.addBookmark({
        title: 'Offline Fallback Jacket',
        product_url: 'https://example.com/jacket',
        price: '3200',
        brand: 'Uniqlo'
      })).rejects.toThrow('儲存書籤失敗');

      expect(store.bookmarks.length).toBe(initialCount);
      const saved = localStorage.getItem(`${BOOKMARKS_STORAGE_KEY}_${userA.id}`);
      expect(saved).toBeNull();
    });

    it('should throw and not update bookmark locally when Supabase update fails or rejects', async () => {
      const authStore = useAuthStore();
      authStore.user = userA;
      const store = useBookmarksStore();
      const initialBookmark = {
        id: '00000000-0000-4000-8000-000000000010',
        title: 'Initial Title',
        price: '1000'
      };
      store.bookmarks = [{ ...initialBookmark }];
      vi.mocked(updateBookmarkInSupabase).mockRejectedValue(new Error('Supabase update failed'));

      await expect(store.updateBookmark('00000000-0000-4000-8000-000000000010', {
        title: 'Mutated Title',
        price: '9999'
      })).rejects.toThrow('Supabase update failed');

      expect(store.bookmarks[0].title).toBe('Initial Title');
      expect(store.bookmarks[0].price).toBe('1000');
    });

    it('should throw and not delete bookmark locally when Supabase delete fails or rejects', async () => {
      const authStore = useAuthStore();
      authStore.user = userA;
      const store = useBookmarksStore();
      store.bookmarks = [{
        id: '00000000-0000-4000-8000-000000000010',
        title: 'Initial Title'
      }];
      vi.mocked(deleteBookmarkFromSupabase).mockResolvedValue(false);

      await expect(store.deleteBookmark('00000000-0000-4000-8000-000000000010')).rejects.toThrow('刪除書籤失敗');

      expect(store.bookmarks.length).toBe(1);
    });

    it('should throw and preserve selection when batch delete fails or rejects', async () => {
      const authStore = useAuthStore();
      authStore.user = userA;
      const store = useBookmarksStore();
      store.bookmarks = [
        { id: '00000000-0000-4000-8000-000000000010', title: 'Item 1' },
        { id: '00000000-0000-4000-8000-000000000020', title: 'Item 2' }
      ];
      store.selectedBookmarkIds = ['00000000-0000-4000-8000-000000000010'];
      vi.mocked(deleteBatchBookmarksFromSupabase).mockResolvedValue(false);

      await expect(store.deleteSelectedBookmarks()).rejects.toThrow('批次刪除書籤失敗');

      expect(store.bookmarks.length).toBe(2);
      expect(store.selectedBookmarkIds).toEqual(['00000000-0000-4000-8000-000000000010']);
    });
  });

  describe('Demo Mode Bookmark Flow & Persistence', () => {
    it('supports complete demo lifecycle: create -> reload store -> edit -> batch delete -> reload remains deleted with zero Supabase calls', async () => {
      const authStore = useAuthStore();
      authStore.loginWithDemo('demo@ootie.com', 'Demo User');

      const store = useBookmarksStore();
      expect(store.bookmarks).toEqual([]);

      // 1. Create bookmark in Demo mode
      const created = await store.addBookmark({
        title: 'Demo Dress',
        product_url: 'https://example.com/demo-dress',
        price: '1990',
        image_url: 'https://images.example.com/dress.jpg'
      });

      expect(created).toBeTruthy();
      expect(created.id).toContain('bookmark-demo-');
      expect(created.title).toBe('Demo Dress');
      expect(store.bookmarks.length).toBe(1);

      // 2. Reload store / simulate session restoration
      const reloadedStore = useBookmarksStore();
      expect(reloadedStore.bookmarks.length).toBe(1);
      expect(reloadedStore.bookmarks[0].title).toBe('Demo Dress');

      // 3. Edit bookmark
      const targetId = reloadedStore.bookmarks[0].id;
      await reloadedStore.updateBookmark(targetId, {
        title: 'Updated Demo Dress'
      });
      expect(reloadedStore.bookmarks[0].title).toBe('Updated Demo Dress');

      // 4. Batch delete
      reloadedStore.selectedBookmarkIds = [targetId];
      const deletedCount = await reloadedStore.deleteSelectedBookmarks();
      expect(deletedCount).toBe(1);
      expect(reloadedStore.bookmarks.length).toBe(0);

      // 5. Reload remains deleted
      const finalStore = useBookmarksStore();
      expect(finalStore.bookmarks).toEqual([]);

      // Assert zero Supabase network calls occurred for Demo operations
      expect(insertBookmarkToSupabase).not.toHaveBeenCalled();
      expect(updateBookmarkInSupabase).not.toHaveBeenCalled();
      expect(deleteBookmarkFromSupabase).not.toHaveBeenCalled();
      expect(deleteBatchBookmarksFromSupabase).not.toHaveBeenCalled();
    });
  });
});
