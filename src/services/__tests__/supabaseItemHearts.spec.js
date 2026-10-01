import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchItemHeartStats, toggleItemHeart, supabase } from '../supabase';

const itemId = '00000000-0000-4000-8000-000000000020';
const userId = '00000000-0000-4000-8000-000000000001';

describe('Supabase item hearts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('reuses a stable visitor identity for anonymous heart actions', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: null
    });
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: [{ item_id: itemId, heart_count: 2, liked_by_viewer: true }],
      error: null
    });

    await fetchItemHeartStats([itemId]);
    await fetchItemHeartStats([itemId]);

    const firstVisitorId = rpcSpy.mock.calls[0][1].p_actor_id;
    expect(firstVisitorId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(rpcSpy.mock.calls[1][1].p_actor_id).toBe(firstVisitorId);
    expect(localStorage.getItem('ootie-item-heart-visitor-v1')).toBe(firstVisitorId);
  });

  it('uses the authenticated user id when an account is signed in', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: userId } },
      error: null
    });
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: { liked: true, heart_count: 3 },
      error: null
    });

    const result = await toggleItemHeart(itemId);

    expect(result).toEqual({ liked: true, heart_count: 3 });
    expect(rpcSpy).toHaveBeenCalledWith('toggle_ootie_item_heart', {
      p_item_id: itemId,
      p_actor_id: userId
    });
  });

  it('does not send local fixture ids to Supabase', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc');

    expect(await toggleItemHeart('1')).toBeNull();
    expect(await fetchItemHeartStats(['1'])).toEqual([]);
    expect(rpcSpy).not.toHaveBeenCalled();
  });
});