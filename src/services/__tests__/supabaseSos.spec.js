import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  insertOutfitSuggestionToSupabase,
  insertSosPostToSupabase,
  supabase
} from '../supabase';

const authUserId = '00000000-0000-4000-8000-000000000001';
const profileId = '00000000-0000-4000-8000-000000000002';
const postId = '00000000-0000-4000-8000-000000000003';
const itemId = '00000000-0000-4000-8000-000000000004';

function mockProfileAndInsert(insertedRow) {
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
    select: vi.fn().mockResolvedValue({ data: [insertedRow], error: null })
  };
  vi.spyOn(supabase, 'from')
    .mockReturnValueOnce(profileQuery)
    .mockReturnValueOnce(insertQuery);
  return { profileQuery, insertQuery };
}

afterEach(() => vi.restoreAllMocks());

describe('Supabase SOS writes', () => {
  it('inserts posts with ootie_profiles.id in legacy user_id columns', async () => {
    const insertedRow = { id: postId, user_id: profileId, closet_owner_id: profileId };
    const { profileQuery, insertQuery } = mockProfileAndInsert(insertedRow);

    const result = await insertSosPostToSupabase({
      id: postId,
      title: '聚餐穿搭',
      details: '想找一套舒服的搭配',
      occasion: '聚餐',
      weather: '涼爽',
      when_label: '今晚',
      vibes: ['Relaxed'],
      closet_item_ids: [itemId, 'not-a-uuid']
    });

    expect(profileQuery.eq).toHaveBeenCalledWith('user_id', authUserId);
    expect(insertQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: profileId,
      closet_owner_id: profileId,
      closet_item_ids: [itemId]
    }));
    expect(insertQuery.insert.mock.calls[0][0]).not.toHaveProperty('owner_id');
    expect(result).toEqual(insertedRow);
  });

  it('inserts outfit suggestions with ootie_profiles.id in user_id', async () => {
    const insertedRow = { id: postId, sos_id: postId, user_id: profileId };
    const { profileQuery, insertQuery } = mockProfileAndInsert(insertedRow);

    const result = await insertOutfitSuggestionToSupabase({
      id: postId,
      sos_id: postId,
      item_ids: [itemId],
      message: '搭配建議'
    });

    expect(profileQuery.eq).toHaveBeenCalledWith('user_id', authUserId);
    expect(insertQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      sos_id: postId,
      user_id: profileId,
      item_ids: [itemId]
    }));
    expect(insertQuery.insert.mock.calls[0][0]).not.toHaveProperty('owner_id');
    expect(result).toEqual(insertedRow);
  });
});