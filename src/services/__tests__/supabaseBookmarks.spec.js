import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchBookmarksFromSupabase,
  insertBookmarkToSupabase,
  updateBookmarkInSupabase,
  deleteBookmarkFromSupabase,
  deleteBatchBookmarksFromSupabase,
  supabase
} from '../supabase';

const authUserId = '00000000-0000-4000-8000-000000000001';
const validBookmarkUuid = '00000000-0000-4000-8000-000000000099';

describe('Supabase Bookmarks Service - Failure Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchBookmarksFromSupabase', () => {
    it('returns null when Supabase select query returns an error', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } })
      };
      vi.spyOn(supabase, 'from').mockReturnValue(query);

      const result = await fetchBookmarksFromSupabase();
      expect(result).toBeNull();
    });

    it('catches and returns null when Supabase query throws', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });
      vi.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Network failure');
      });

      const result = await fetchBookmarksFromSupabase();
      expect(result).toBeNull();
    });
  });

  describe('insertBookmarkToSupabase', () => {
    it('returns null when Supabase insert returns an error', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const query = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert violation' } })
      };
      vi.spyOn(supabase, 'from').mockReturnValue(query);

      const result = await insertBookmarkToSupabase({
        title: 'Test Fail Bookmark',
        product_url: 'https://example.com'
      });
      expect(result).toBeNull();
    });

    it('catches and returns null when insert throws an exception', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });
      vi.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Fatal socket error');
      });

      const result = await insertBookmarkToSupabase({
        title: 'Test Throw Bookmark'
      });
      expect(result).toBeNull();
    });
  });

  describe('updateBookmarkInSupabase', () => {
    it('returns null when Supabase update returns an error', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const query = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } })
      };
      vi.spyOn(supabase, 'from').mockReturnValue(query);

      const result = await updateBookmarkInSupabase(validBookmarkUuid, {
        title: 'New Title'
      });
      expect(result).toBeNull();
    });

    it('catches and returns null when update throws an exception', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });
      vi.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Connection refused');
      });

      const result = await updateBookmarkInSupabase(validBookmarkUuid, {
        title: 'New Title'
      });
      expect(result).toBeNull();
    });
  });

  describe('deleteBookmarkFromSupabase', () => {
    it('returns false when Supabase delete returns an error', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const query = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn()
      };
      query.eq.mockReturnValueOnce(query).mockResolvedValueOnce({ error: { message: 'Delete constraint' } });
      vi.spyOn(supabase, 'from').mockReturnValue(query);

      const result = await deleteBookmarkFromSupabase(validBookmarkUuid);
      expect(result).toBe(false);
    });

    it('catches and returns false when delete throws an exception', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });
      vi.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Delete timeout');
      });

      const result = await deleteBookmarkFromSupabase(validBookmarkUuid);
      expect(result).toBe(false);
    });
  });

  describe('deleteBatchBookmarksFromSupabase', () => {
    it('returns false when Supabase batch delete returns an error', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const query = {
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Batch delete error' } })
      };
      vi.spyOn(supabase, 'from').mockReturnValue(query);

      const result = await deleteBatchBookmarksFromSupabase([validBookmarkUuid]);
      expect(result).toBe(false);
    });

    it('catches and returns false when batch delete throws an exception', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });
      vi.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Batch delete aborted');
      });

      const result = await deleteBatchBookmarksFromSupabase([validBookmarkUuid]);
      expect(result).toBe(false);
    });
  });
});
