import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLegacyClosetFromSupabase, supabase } from '../supabase';

describe('Legacy closet import', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps ootie_clothing_items.photo to the closet photo URL', async () => {
    const photo = 'https://example.com/closet-shirt.jpg';
    const query = {
      select: vi.fn().mockResolvedValue({
        data: [{ id: 'shirt-1', name: 'Blue shirt', photo }],
        error: null
      })
    };
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    });
    const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue(query);

    const result = await fetchLegacyClosetFromSupabase();

    expect(fromSpy).toHaveBeenCalledWith('ootie_clothing_items');
    expect(result.status).toBe('success');
    expect(result.items[0]).toMatchObject({
      id: 'shirt-1',
      name: 'Blue shirt',
      photo
    });
  });

  it('does not query the closet without an authenticated user', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: null
    });
    const fromSpy = vi.spyOn(supabase, 'from');

    const result = await fetchLegacyClosetFromSupabase();

    expect(result).toEqual({ status: 'unauthenticated', items: [] });
    expect(fromSpy).not.toHaveBeenCalled();
  });
});
