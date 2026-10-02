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
const profileId = '00000000-0000-4000-8000-000000000055';
const validBookmarkUuid = '00000000-0000-4000-8000-000000000099';

describe('Supabase Bookmarks Service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful CRUD Scenarios', () => {
    it('fetches bookmarks for authenticated profile', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: profileId }, error: null })
      };
      const bookmarksQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: validBookmarkUuid, title: 'Item 1', owner_id: profileId }],
          error: null
        })
      };

      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        if (table === 'ootie_bookmarks') return bookmarksQuery;
        return {};
      });

      const result = await fetchBookmarksFromSupabase();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(validBookmarkUuid);
    });

    it('inserts a new bookmark with profile-ID ownership and returns persisted row', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: profileId }, error: null })
      };
      const insertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: validBookmarkUuid, title: 'New Dress', owner_id: profileId },
          error: null
        })
      };

      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        if (table === 'ootie_bookmarks') return insertQuery;
        return {};
      });

      const result = await insertBookmarkToSupabase({
        title: 'New Dress',
        product_url: 'https://example.com/dress'
      });
      expect(result).not.toBeNull();
      expect(result.id).toBe(validBookmarkUuid);
      expect(result.owner_id).toBe(profileId);
    });
    it('updates a bookmark and returns actual persisted row', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: profileId }, error: null })
      };
      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: validBookmarkUuid, title: 'Updated Dress', owner_id: profileId },
          error: null
        })
      };

      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        if (table === 'ootie_bookmarks') return updateQuery;
        return {};
      });

      const result = await updateBookmarkInSupabase(validBookmarkUuid, { title: 'Updated Dress' });
      expect(result).not.toBeNull();
      expect(result.title).toBe('Updated Dress');
    });

    it('deletes a single bookmark and verifies returned ID', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: profileId }, error: null })
      };
      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [{ id: validBookmarkUuid }], error: null })
      };

      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        if (table === 'ootie_bookmarks') return deleteQuery;
        return {};
      });

      const result = await deleteBookmarkFromSupabase(validBookmarkUuid);
      expect(result).toBe(true);
    });

    it('batch deletes bookmarks and verifies success', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: profileId }, error: null })
      };
      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [{ id: validBookmarkUuid }], error: null })
      };

      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        if (table === 'ootie_bookmarks') return deleteQuery;
        return {};
      });

      const result = await deleteBatchBookmarksFromSupabase([validBookmarkUuid]);
      expect(result).toBe(true);
    });
  });

  describe('Profile Provisioning & Concurrency', () => {
    it('creates on-demand profile safely when profile is missing', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId, user_metadata: { full_name: 'Test Tester' } } },
        error: null
      });

      let profileLookupCount = 0;
      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(async () => {
          profileLookupCount++;
          if (profileLookupCount === 1) return { data: null, error: null };
          return { data: { id: profileId }, error: null };
        }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: profileId }, error: null })
      };

      const bookmarksQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        if (table === 'ootie_bookmarks') return bookmarksQuery;
        return {};
      });

      const result = await fetchBookmarksFromSupabase();
      expect(result).toEqual([]);
      expect(profileQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: authUserId,
          name: 'Test Tester'
        })
      );
    });

    it('handles concurrent profile creation conflict via bounded retry', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId, user_metadata: { full_name: 'Concurrent User' } } },
        error: null
      });

      let lookupCall = 0;
      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(async () => {
          lookupCall++;
          if (lookupCall === 1) return { data: null, error: null };
          return { data: { id: profileId }, error: null };
        }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } })
      };

      const bookmarksQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        if (table === 'ootie_bookmarks') return bookmarksQuery;
        return {};
      });

      const result = await fetchBookmarksFromSupabase();
      expect(result).toEqual([]);
      expect(lookupCall).toBe(2);
    });

    it('returns null when user is unauthenticated', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await fetchBookmarksFromSupabase();
      expect(result).toBeNull();
    });
  });

  describe('Zero-Row and Error Scenarios', () => {
    it('returns null when Supabase select query returns an error', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: profileId }, error: null })
      };
      const bookmarksQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } })
      };
      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        return bookmarksQuery;
      });

      const result = await fetchBookmarksFromSupabase();
      expect(result).toBeNull();
    });

    it('returns null when update affects zero rows', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: profileId }, error: null })
      };
      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      };
      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        return updateQuery;
      });

      const result = await updateBookmarkInSupabase(validBookmarkUuid, { title: 'New Title' });
      expect(result).toBeNull();
    });

    it('returns false when delete affects zero rows', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: profileId }, error: null })
      };
      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      };
      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        return deleteQuery;
      });

      const result = await deleteBookmarkFromSupabase(validBookmarkUuid);
      expect(result).toBe(false);
    });

    it('returns false when delete returns unexpected ID', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: profileId }, error: null })
      };
      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [{ id: 'other-uuid' }], error: null })
      };
      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        return deleteQuery;
      });

      const result = await deleteBookmarkFromSupabase(validBookmarkUuid);
      expect(result).toBe(false);
    });

    it('returns false when batch delete affects zero rows', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: authUserId } },
        error: null
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: profileId }, error: null })
      };
      const deleteQuery = {
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      };
      vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'ootie_profiles') return profileQuery;
        return deleteQuery;
      });

      const result = await deleteBatchBookmarksFromSupabase([validBookmarkUuid]);
      expect(result).toBe(false);
    });
  });
});
