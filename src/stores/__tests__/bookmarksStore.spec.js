import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBookmarksStore } from '../bookmarks';
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
  });

  it('should initialize with default bookmarks', () => {
    const store = useBookmarksStore();
    expect(store.bookmarks.length).toBeGreaterThan(0);
    expect(store.bookmarks[0]).toHaveProperty('title');
    expect(store.bookmarks[0]).toHaveProperty('product_url');
  });

  it('should not restore stale app-state bookmarks over an explicitly empty cache', () => {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem('weary-app-state-v1', JSON.stringify({
      bookmarks: [{ id: 'stale-bookmark', title: 'Stale bookmark' }]
    }));

    const store = useBookmarksStore();

    expect(store.bookmarks).toEqual([]);
  });

  it('should clear stale local bookmarks when the remote account has none', async () => {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify([
      { id: 'stale-bookmark', title: 'Stale bookmark' }
    ]));
    const store = useBookmarksStore();
    vi.mocked(fetchBookmarksFromSupabase).mockResolvedValue([]);

    await store.fetchRemoteBookmarks();

    expect(store.bookmarks).toEqual([]);
    expect(JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY))).toEqual([]);
  });

  it('should add a new bookmark and persist to localStorage', async () => {
    const store = useBookmarksStore();
    const initialCount = store.bookmarks.length;

    const newBookmark = await store.addBookmark({
      title: 'Silk Slip Dress',
      product_url: 'https://example.com/dress',
      price: '2800',
      currency: 'TWD',
      brand: 'Zara',
      color: 'Black',
      size: 'S'
    });

    expect(store.bookmarks.length).toBe(initialCount + 1);
    expect(store.bookmarks[0].title).toBe('Silk Slip Dress');
    expect(store.bookmarks[0].price).toBe('2800');

    const saved = JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY));
    expect(saved).toBeTruthy();
    expect(saved.some((b) => b.title === 'Silk Slip Dress')).toBe(true);
  });

  it('should update an existing bookmark', async () => {
    const store = useBookmarksStore();
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
    expect(updated.notes).toBe('New note');
  });

  it('should delete a bookmark', async () => {
    const store = useBookmarksStore();
    const initialCount = store.bookmarks.length;
    const targetId = store.bookmarks[0].id;

    await store.deleteBookmark(targetId);

    expect(store.bookmarks.length).toBe(initialCount - 1);
    expect(store.bookmarks.some((b) => b.id === targetId)).toBe(false);
  });

  it('should batch delete selected bookmarks', async () => {
    const store = useBookmarksStore();
    const initialCount = store.bookmarks.length;
    const idsToDelete = [store.bookmarks[0].id, store.bookmarks[1].id];

    store.selectedBookmarkIds = [...idsToDelete];
    const deletedCount = await store.deleteSelectedBookmarks();

    expect(deletedCount).toBe(2);
    expect(store.bookmarks.length).toBe(initialCount - 2);
    expect(store.selectedBookmarkIds.length).toBe(0);
    expect(store.isManagerMode).toBe(false);
  });

  it('should detect duplicate bookmarks with matching url, variant, color, and size', () => {
    const store = useBookmarksStore();
    const first = store.bookmarks[0];

    const duplicate = store.findDuplicateBookmark(
      first.product_url,
      first.variant_name,
      first.color,
      first.size
    );

    expect(duplicate).toBeTruthy();
    expect(duplicate.id).toBe(first.id);

    // Should return null if excluded by same ID
    const excluded = store.findDuplicateBookmark(
      first.product_url,
      first.variant_name,
      first.color,
      first.size,
      first.id
    );
    expect(excluded).toBeFalsy();
  });

  describe('Supabase Error & Failure Scenarios', () => {
    it('should keep existing local bookmarks intact when remote fetch fails or rejects', async () => {
      const store = useBookmarksStore();
      const initialBookmarks = [...store.bookmarks];
      vi.mocked(fetchBookmarksFromSupabase).mockRejectedValue(new Error('Network error'));

      await expect(store.fetchRemoteBookmarks()).resolves.not.toThrow();

      expect(store.bookmarks).toEqual(initialBookmarks);
    });

    it('should throw and not add bookmark locally when Supabase insert fails or rejects', async () => {
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
      const saved = JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY));
      expect(saved).toBeNull();
    });

    it('should throw and not add bookmark locally when Supabase insert rejects', async () => {
      const store = useBookmarksStore();
      const initialCount = store.bookmarks.length;
      vi.mocked(insertBookmarkToSupabase).mockRejectedValue(new Error('Supabase insert failed'));

      await expect(store.addBookmark({
        title: 'Offline Fallback Jacket',
        product_url: 'https://example.com/jacket',
        price: '3200',
        brand: 'Uniqlo'
      })).rejects.toThrow();

      expect(store.bookmarks.length).toBe(initialCount);
      const saved = JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY));
      expect(saved).toBeNull();
    });

    it('should preserve locally updated bookmark when Supabase update fails or rejects', async () => {
      const store = useBookmarksStore();
      const targetId = store.bookmarks[0].id;
      vi.mocked(updateBookmarkInSupabase).mockRejectedValue(new Error('Supabase update failed'));

      await store.updateBookmark(targetId, {
        title: 'Local Only Update',
        price: '999'
      });

      const updated = store.bookmarks.find((b) => b.id === targetId);
      expect(updated.title).toBe('Local Only Update');
      expect(updated.price).toBe('999');

      const saved = JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY));
      expect(saved.find((b) => b.id === targetId)?.title).toBe('Local Only Update');
    });

    it('should preserve locally deleted bookmark when Supabase delete fails or rejects', async () => {
      const store = useBookmarksStore();
      const initialCount = store.bookmarks.length;
      const targetId = store.bookmarks[0].id;
      vi.mocked(deleteBookmarkFromSupabase).mockRejectedValue(new Error('Supabase delete failed'));

      await store.deleteBookmark(targetId);

      expect(store.bookmarks.length).toBe(initialCount - 1);
      expect(store.bookmarks.some((b) => b.id === targetId)).toBe(false);

      const saved = JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY));
      expect(saved.some((b) => b.id === targetId)).toBe(false);
    });

    it('should preserve locally batch-deleted bookmarks when Supabase batch delete fails or rejects', async () => {
      const store = useBookmarksStore();
      const initialCount = store.bookmarks.length;
      const idsToDelete = [store.bookmarks[0].id, store.bookmarks[1].id];
      store.selectedBookmarkIds = [...idsToDelete];
      vi.mocked(deleteBatchBookmarksFromSupabase).mockRejectedValue(new Error('Batch delete failed'));

      const deletedCount = await store.deleteSelectedBookmarks();

      expect(deletedCount).toBe(2);
      expect(store.bookmarks.length).toBe(initialCount - 2);
      expect(store.selectedBookmarkIds.length).toBe(0);

      const saved = JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY));
      expect(saved.some((b) => idsToDelete.includes(b.id))).toBe(false);
    });
  });
});
