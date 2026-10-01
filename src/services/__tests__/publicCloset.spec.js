import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicClosetFromSupabase, supabase } from '../supabase';

describe('Public closet access', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not query clothing when the profile is hidden by RLS', async () => {
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
    };
    const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue(profileQuery);

    const result = await fetchPublicClosetFromSupabase('@private-user');

    expect(result).toEqual({ status: 'unavailable', profile: null, items: [] });
    expect(fromSpy).toHaveBeenCalledTimes(1);
    expect(fromSpy).toHaveBeenCalledWith('profiles');
  });

  it('fetches only visible items for a public profile', async () => {
    const profile = {
      id: '00000000-0000-4000-8000-000000000010',
      username: '@public-user',
      public_closet: true
    };
    const publicItems = [{ id: 'item-1', name: 'Public jacket', hidden: false }];
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null })
    };
    const itemsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: publicItems, error: null })
    };
    vi.spyOn(supabase, 'from').mockImplementation((table) => {
      return table === 'profiles' ? profileQuery : itemsQuery;
    });

    const result = await fetchPublicClosetFromSupabase('@public-user');

    expect(result).toEqual({ status: 'public', profile, items: publicItems });
    expect(profileQuery.eq).toHaveBeenCalledWith('username', '@public-user');
    expect(itemsQuery.eq).toHaveBeenCalledWith('owner_id', profile.id);
    expect(itemsQuery.eq).toHaveBeenCalledWith('hidden', false);
  });
});
