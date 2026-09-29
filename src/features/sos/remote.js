import { asArray } from './domain';

const isUuid = value => typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// Profile and owner IDs share the Supabase Auth UUID.
export async function readRemoteSos() {
  const services = await import('@/services/supabase');
  const fetchSosPostsFromSupabase = services.fetchSosPostsFromSupabase;
  const fetchOutfitSuggestionsFromSupabase = services.fetchOutfitSuggestionsFromSupabase;
  let fetchSosProfilesFromSupabase;
  let fetchSosClothingItemsFromSupabase;
  try { fetchSosProfilesFromSupabase = services.fetchSosProfilesFromSupabase; } catch { fetchSosProfilesFromSupabase = null; }
  try { fetchSosClothingItemsFromSupabase = services.fetchSosClothingItemsFromSupabase; } catch { fetchSosClothingItemsFromSupabase = null; }
  const optionalRead = fn => typeof fn === 'function' ? fn() : Promise.resolve([]);
  const [posts, suggestions, profiles, items] = await Promise.all([
    fetchSosPostsFromSupabase(),
    fetchOutfitSuggestionsFromSupabase(),
    optionalRead(fetchSosProfilesFromSupabase),
    optionalRead(fetchSosClothingItemsFromSupabase)
  ]);
  if (!Array.isArray(posts) || !Array.isArray(suggestions) || !Array.isArray(profiles) || !Array.isArray(items)) {
    throw new Error('REMOTE_READ_FAILED');
  }
  const profileById = new Map(profiles.filter(p => p?.id).map(profile => [profile.id, profile]));
  const profileFor = id => profileById.get(id) || null;
  return {
    profiles: profiles.filter(p => p?.id),
    items: items.filter(item => item?.id && item?.owner_id),
    sosPosts: posts.filter(p => p?.id).map(p => ({
      ...p,
      sender_id: p.owner_id || p.owner_profile_id || p.sender_id || (isUuid(p.closet_owner_id) ? p.closet_owner_id : null),
      auth_user_id: profileFor(p.owner_id || p.owner_profile_id || p.sender_id || p.closet_owner_id)?.id || null,
      username: p.username || profileFor(p.owner_id || p.owner_profile_id || p.sender_id || p.closet_owner_id)?.username || '衣友',
      initials: p.initials || profileFor(p.owner_id || p.owner_profile_id || p.sender_id || p.closet_owner_id)?.initials || '衣友',
      title: p.title || '穿搭求救',
      status: ['OPEN', 'CLOSED'].includes(p.status) ? p.status : 'UNKNOWN',
      vibes: asArray(p.vibes), closet_item_ids: Array.isArray(p.closet_item_ids) ? p.closet_item_ids : null,
      adopted_suggestion_id: p.picked_suggestion_id || p.adopted_suggestion_id || null
    })),
    outfitSuggestions: suggestions.filter(s => s?.id).map(s => ({
      ...s,
      responder_id: s.owner_id || s.responder_profile_id || s.responder_id || (isUuid(s.user_id) ? s.user_id : null),
      auth_user_id: profileFor(s.owner_id || s.responder_profile_id || s.responder_id || s.user_id)?.id || null,
      username: s.username || profileFor(s.owner_id || s.responder_profile_id || s.responder_id || s.user_id)?.username || '衣友',
      item_ids: asArray(s.item_ids)
    }))
  };
}
