import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAuthenticatedUserId, insertBookmarkToSupabase, supabase } from '../supabase';

const authUserId = '00000000-0000-4000-8000-000000000001';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Supabase Auth identity', () => {
  it('uses the authenticated UUID instead of a caller-provided demo owner', async () => {
    const response = { id: '00000000-0000-4000-8000-000000000010', owner_id: authUserId };
    const query = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: response, error: null })
    };
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: authUserId } },
      error: null
    });
    vi.spyOn(supabase, 'from').mockReturnValue(query);

    await insertBookmarkToSupabase({
      owner_id: 'profile-01',
      title: 'Test bookmark',
      product_url: 'https://example.test/item'
    });

    expect(query.insert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ owner_id: authUserId })
    ]));
  });

  it('does not write private rows without an authenticated UUID', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' }
    });
    const fromSpy = vi.spyOn(supabase, 'from');

    await expect(insertBookmarkToSupabase({ title: 'Guest bookmark' })).resolves.toBeNull();
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it('returns only the Auth UUID as the current remote identity', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: authUserId } },
      error: null
    });

    await expect(getAuthenticatedUserId()).resolves.toBe(authUserId);
  });
});