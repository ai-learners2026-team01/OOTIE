import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_your_key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const isUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const ITEM_HEART_VISITOR_ID_KEY = 'ootie-item-heart-visitor-v1';
let fallbackItemHeartVisitorId = null;

function getItemHeartVisitorId() {
  try {
    const savedId = localStorage.getItem(ITEM_HEART_VISITOR_ID_KEY);
    if (isUuid(savedId)) return savedId;
  } catch (err) {
    // Continue with an in-memory identity when storage is unavailable.
  }

  if (fallbackItemHeartVisitorId) return fallbackItemHeartVisitorId;
  fallbackItemHeartVisitorId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16);
      return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
    });
  try {
    localStorage.setItem(ITEM_HEART_VISITOR_ID_KEY, fallbackItemHeartVisitorId);
  } catch (err) {
    // Keep the generated identity in memory for this page session.
  }
  return fallbackItemHeartVisitorId;
}

async function getItemHeartActorId() {
  return (await getAuthenticatedUserId()) || getItemHeartVisitorId();
}

export async function getAuthenticatedUserId() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user?.id || null;
  } catch (err) {
    console.warn('Supabase auth user lookup failed:', err);
    return null;
  }
}

/**
 * Fetch avatar_url from profiles table for current user
 */
export async function fetchProfileAvatar() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Supabase fetch avatar error:', error);
      return null;
    }
    return data?.avatar_url || null;
  } catch (err) {
    console.error('Supabase fetch avatar failed:', err);
    return null;
  }
}

/**
 * Sync avatar_url to profiles table
 */
export async function syncProfileAvatar(avatarUrl) {
  if (!avatarUrl) return false;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return false;
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, avatar_url: avatarUrl }, { onConflict: 'id' });

    if (error) {
      console.error('Supabase profile avatar sync error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase profile avatar sync failed:', err);
    return false;
  }
}

/**
 * Fetch full profile from Supabase profiles table
 */
export async function fetchProfileFromSupabase() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Supabase fetch profile error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase fetch profile failed:', err);
    return null;
  }
}

/**
 * Upsert profile data to Supabase profiles table
 */
export async function upsertProfileToSupabase(profileData) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const payload = {
      id: userId,
      full_name: profileData.name || profileData.full_name || null,
      username: profileData.username || null,
      initials: profileData.initials || null,
      bio: profileData.bio || null,
      avatar_url: profileData.avatar_url || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Supabase profile upsert error:', error);
      return null;
    }
    return data?.[0] || payload;
  } catch (err) {
    console.error('Supabase profile upsert failed:', err);
    return null;
  }
}

/**
 * Fetch items from Supabase items table
 */
export async function fetchItemsFromSupabase() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase items fetch error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase items fetch failed:', err);
    return null;
  }
}

/**
 * Fetch a public profile's visible closet. RLS remains the authority for both
 * profile visibility and non-hidden clothing rows.
 */
export async function fetchPublicClosetFromSupabase(username) {
  const normalizedUsername = String(username || '').trim();
  if (!normalizedUsername) return { status: 'unavailable', profile: null, items: [] };

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, initials, avatar_url, bio, hearts, public_closet')
      .eq('username', normalizedUsername)
      .maybeSingle();

    // Private profiles are hidden by RLS and are intentionally indistinguishable
    // from missing profiles to visitors.
    if (profileError || !profile || !profile.public_closet) {
      return { status: 'unavailable', profile: null, items: [] };
    }

    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('owner_id', profile.id)
      .eq('hidden', false)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Supabase public closet fetch error:', itemsError);
      return { status: 'error', profile, items: [] };
    }

    return { status: 'public', profile, items: items || [] };
  } catch (err) {
    console.error('Supabase public closet fetch failed:', err);
    return { status: 'error', profile: null, items: [] };
  }
}

export async function fetchItemHeartStats(itemIds) {
  const validItemIds = [...new Set((itemIds || []).filter(isUuid))];
  if (!validItemIds.length) return [];

  try {
    const actorId = await getItemHeartActorId();
    const { data, error } = await supabase.rpc('get_ootie_item_heart_stats', {
      p_item_ids: validItemIds,
      p_actor_id: actorId
    });
    if (error) {
      console.error('Supabase item heart stats error:', error);
      return null;
    }
    return data || [];
  } catch (err) {
    console.error('Supabase item heart stats failed:', err);
    return null;
  }
}

export async function toggleItemHeart(itemId) {
  if (!isUuid(itemId)) return null;

  try {
    const actorId = await getItemHeartActorId();
    const { data, error } = await supabase.rpc('toggle_ootie_item_heart', {
      p_item_id: itemId,
      p_actor_id: actorId
    });
    if (error) {
      console.error('Supabase item heart update error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase item heart update failed:', err);
    return null;
  }
}

export async function updatePublicClosetVisibility(isPublic) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return false;

    const { data, error } = await supabase
      .from('profiles')
      .update({ public_closet: Boolean(isPublic) })
      .eq('id', userId)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      console.error('Supabase public closet update error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase public closet update failed:', err);
    return false;
  }
}

/**
 * Insert item into Supabase items table
 */
export async function insertItemToSupabase(itemData) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const itemUuid = isUuid(itemData.id) ? itemData.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);
    const payload = {
      owner_id: userId,
      name: itemData.name,
      name_zh: itemData.name_zh || itemData.name,
      brand: itemData.brand || '',
      category: itemData.category || 'Tops',
      shape: itemData.shape || '',
      primary_color: itemData.primaryColor || itemData.primary_color || '',
      secondary_color: itemData.secondaryColor || itemData.secondary_color || '',
      color_hex: itemData.colorHex || itemData.color_hex || '#000000',
      style: itemData.style || '',
      season: itemData.season || 'All',
      photo: itemData.photo || '',
      price: itemData.price !== undefined && itemData.price !== '' ? Number(itemData.price) : null,
      wear_count: itemData.wearCount || itemData.wear_count || 0,
      last_worn: itemData.last_worn || null,
      purchase_date: itemData.purchase_date || null,
      favorite: itemData.favorite || false,
      hidden: itemData.hidden || false,
      notes: itemData.notes || '',
      created_at: itemData.createdAt || new Date().toISOString()
    };
    if (itemUuid) payload.id = itemUuid;

    const { data, error } = await supabase
      .from('items')
      .insert(payload)
      .select();

    if (error) {
      console.error('Supabase item insert error:', error);
      return null;
    }
    return data?.[0] || payload;
  } catch (err) {
    console.error('Supabase item insert failed:', err);
    return null;
  }
}

/**
 * Delete item from Supabase items table
 */
export async function deleteItemFromSupabase(itemId) {
  if (!isUuid(itemId)) return true;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return false;
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('owner_id', userId);

    if (error) {
      console.error('Supabase item delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase item delete failed:', err);
    return false;
  }
}

/**
 * Fetch OOTD posts from Supabase ootie_ootd_posts table
 */
export async function fetchProfileOotdPosts() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('ootie_ootd_posts')
      .select('id, owner_id, image, caption, item_ids, wearing, hashtags, likes, comments, created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase OOTD fetch error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase OOTD fetch failed:', err);
    return null;
  }
}

/**
 * Insert new OOTD post to Supabase
 */
export async function insertOotdPost(postData) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const postUuid = isUuid(postData.id) ? postData.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);
    const payload = {
      owner_id: userId,
      image: postData.image,
      caption: postData.caption,
      item_ids: (postData.itemIds || postData.item_ids || []).filter(isUuid),
      wearing: postData.wearing || [],
      hashtags: postData.hashtags || [],
      likes: postData.likes || 0,
      comments: postData.comments || 0,
      created_at: postData.createdAt || new Date().toISOString()
    };
    if (postUuid) payload.id = postUuid;

    const { data, error } = await supabase
      .from('ootie_ootd_posts')
      .insert(payload)
      .select();

    if (error) {
      console.error('Supabase OOTD insert error:', error);
      return null;
    }
    return data?.[0] || payload;
  } catch (err) {
    console.error('Supabase OOTD insert failed:', err);
    return null;
  }
}

/**
 * Update OOTD post on Supabase
 */
export async function updateOotdPost(postId, postData) {
  if (!isUuid(postId)) return null;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const payload = {
      image: postData.image,
      caption: postData.caption,
      item_ids: (postData.itemIds || postData.item_ids || []).filter(isUuid),
      wearing: postData.wearing || [],
      hashtags: postData.hashtags || []
    };

    const { data, error } = await supabase
      .from('ootie_ootd_posts')
      .update(payload)
      .eq('id', postId)
      .eq('owner_id', userId)
      .select();

    if (error) {
      console.error('Supabase OOTD update error:', error);
      return null;
    }
    return data?.[0] || true;
  } catch (err) {
    console.error('Supabase OOTD update failed:', err);
    return null;
  }
}

/**
 * Delete OOTD post from Supabase
 */
export async function deleteOotdPost(postId) {
  if (!isUuid(postId)) return true;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return false;
    const { error } = await supabase
      .from('ootie_ootd_posts')
      .delete()
      .eq('id', postId)
      .eq('owner_id', userId);

    if (error) {
      console.error('Supabase OOTD delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase OOTD delete failed:', err);
    return false;
  }
}

/**
 * Fetch SOS posts from Supabase ootie_sos_posts
 */
export async function fetchSosPostsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('ootie_sos_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase SOS fetch error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase SOS fetch failed:', err);
    return null;
  }
}

/**
 * Read the profile and clothing rows needed to render public SOS clothing.
 * These helpers are read-only; SOS mutations stay behind the existing local
 * action layer until Auth/RLS ownership is verified.
 */
export async function fetchSosProfilesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('ootie_profiles')
      .select('*');
    if (error) {
      console.error('Supabase SOS profiles fetch error:', error);
      return null;
    }
    return data?.map((profile) => ({ ...profile, user_id: profile.user_id || profile.id })) || data;
  } catch (err) {
    console.error('Supabase SOS profiles fetch failed:', err);
    return null;
  }
}

export async function fetchSosClothingItemsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('ootie_clothing_items')
      .select('*');
    if (error) {
      console.error('Supabase SOS clothing fetch error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase SOS clothing fetch failed:', err);
    return null;
  }
}

async function getAuthenticatedSosProfileId() {
  const authUserId = await getAuthenticatedUserId();
  if (!authUserId) return null;
  try {
    const { data, error } = await supabase
      .from('ootie_profiles')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();
    if (error) {
      console.error('Supabase SOS profile lookup error:', error);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    console.error('Supabase SOS profile lookup failed:', err);
    return null;
  }
}

/**
 * Insert new SOS post to Supabase ootie_sos_posts
 */
export async function insertSosPostToSupabase(sosData) {
  try {
    const profileId = await getAuthenticatedSosProfileId();
    if (!profileId) return null;
    const postUuid = isUuid(sosData.id) ? sosData.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);
    const payload = {
      user_id: profileId,
      closet_owner_id: profileId,
      title: sosData.title,
      details: sosData.details,
      occasion: sosData.occasion,
      weather: sosData.weather,
      when_label: sosData.when_label,
      vibes: sosData.vibes || [],
      closet_item_ids: (sosData.closet_item_ids || []).filter(isUuid),
      status: sosData.status || 'OPEN',
      created_at: sosData.created_at || new Date().toISOString()
    };
    if (postUuid) payload.id = postUuid;

    const { data, error } = await supabase
      .from('ootie_sos_posts')
      .insert(payload)
      .select();

    if (error) {
      console.error('Supabase SOS insert error:', error);
      return null;
    }
    return data?.[0] || payload;
  } catch (err) {
    console.error('Supabase SOS insert failed:', err);
    return null;
  }
}

/**
 * Update SOS post status (OPEN / CLOSED)
 */
export async function updateSosStatusInSupabase(sosId, status) {
  if (!isUuid(sosId)) return true;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return false;
    const { data, error } = await supabase
      .from('ootie_sos_posts')
      .update({ status })
      .eq('id', sosId)
      .eq('owner_id', userId)
      .select();

    if (error) {
      console.error('Supabase SOS status update error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase SOS status update failed:', err);
    return false;
  }
}

/**
 * Update adopted (picked) suggestion ID on SOS post
 */
export async function updateAdoptedSuggestionInSupabase(sosId, suggestionId) {
  if (!isUuid(sosId)) return true;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return false;
    const { data, error } = await supabase
      .from('ootie_sos_posts')
      .update({ picked_suggestion_id: suggestionId })
      .eq('id', sosId)
      .eq('owner_id', userId)
      .select();

    if (error) {
      console.error('Supabase SOS adopt update error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase SOS adopt update failed:', err);
    return false;
  }
}

/**
 * Fetch outfit suggestions from Supabase ootie_outfit_suggestions
 */
export async function fetchOutfitSuggestionsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('ootie_outfit_suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase outfit suggestions fetch error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase outfit suggestions fetch failed:', err);
    return null;
  }
}

/**
 * Insert new outfit suggestion to Supabase ootie_outfit_suggestions
 */
export async function insertOutfitSuggestionToSupabase(suggestionData) {
  try {
    const profileId = await getAuthenticatedSosProfileId();
    if (!profileId) return null;
    const sugUuid = isUuid(suggestionData.id) ? suggestionData.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);
    const payload = {
      sos_id: suggestionData.sos_id,
      user_id: profileId,
      item_ids: (suggestionData.item_ids || []).filter(isUuid),
      message: suggestionData.message,
      hearts: suggestionData.hearts || 0,
      created_at: suggestionData.created_at || new Date().toISOString()
    };
    if (sugUuid) payload.id = sugUuid;

    const { data, error } = await supabase
      .from('ootie_outfit_suggestions')
      .insert(payload)
      .select();

    if (error) {
      console.error('Supabase suggestion insert error:', error);
      return null;
    }
    return data?.[0] || payload;
  } catch (err) {
    console.error('Supabase suggestion insert failed:', err);
    return null;
  }
}

/**
 * Fetch closet stats from Supabase RPC get_closet_stats
 */
export async function fetchClosetStatsFromSupabase() {
  try {
    const { data, error } = await supabase.rpc('get_closet_stats');
    if (error) {
      console.warn('Supabase get_closet_stats error:', error);
      return null;
    }
    const stats = typeof data === 'string' ? JSON.parse(data) : data;
    return stats;
  } catch (err) {
    console.warn('Supabase get_closet_stats failed:', err);
    return null;
  }
}

/**
 * Fetch brand stats from Supabase RPC get_brand_stats
 */
export async function fetchBrandStatsFromSupabase() {
  try {
    const { data, error } = await supabase.rpc('get_brand_stats');
    if (error) {
      console.warn('Supabase get_brand_stats error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase get_brand_stats failed:', err);
    return null;
  }
}

/**
 * Fetch top worn items from Supabase RPC get_top_worn_items
 */
export async function fetchTopWornItemsFromSupabase() {
  try {
    const { data, error } = await supabase.rpc('get_top_worn_items');
    if (error) {
      console.warn('Supabase get_top_worn_items error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase get_top_worn_items failed:', err);
    return null;
  }
}

/**
 * Fetch cost per wear ranking from Supabase RPC get_cost_per_wear_ranking
 */
export async function fetchCostPerWearRankingFromSupabase() {
  try {
    const { data, error } = await supabase.rpc('get_cost_per_wear_ranking');
    if (error) {
      console.warn('Supabase get_cost_per_wear_ranking error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase get_cost_per_wear_ranking failed:', err);
    return null;
  }
}

/**
 * Fetch disused items from Supabase RPC get_disused_items
 */
export async function fetchDisusedItemsFromSupabase() {
  try {
    const { data, error } = await supabase.rpc('get_disused_items');
    if (error) {
      console.warn('Supabase get_disused_items error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase get_disused_items failed:', err);
    return null;
  }
}

/**
 * Mark clearance note on Supabase
 */
export async function markItemClearanceInSupabase(itemId, notes) {
  if (!isUuid(itemId)) return true;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return false;
    const { error } = await supabase
      .from('items')
      .update({ notes })
      .eq('id', itemId)
      .eq('owner_id', userId);

    if (error) {
      console.warn('Supabase clearance note update failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase clearance note update exception:', err);
    return false;
  }
}

async function getAuthenticatedProfileId() {
  const authUserId = await getAuthenticatedUserId();
  if (!authUserId) return null;
  try {
    const { data, error } = await supabase
      .from('ootie_profiles')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();
    if (error) {
      console.warn('Supabase profile lookup error:', error);
      return null;
    }
    return data?.id || authUserId;
  } catch (err) {
    console.warn('Supabase profile lookup failed:', err);
    return authUserId;
  }
}

/**
 * Fetch bookmarks from Supabase ootie_bookmarks table
 */
export async function fetchBookmarksFromSupabase() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const profileId = await getAuthenticatedProfileId();
    let query = supabase.from('ootie_bookmarks').select('*');
    if (profileId && profileId !== userId) {
      query = query.or(`owner_id.eq.${profileId},owner_id.eq.${userId}`);
    } else {
      query = query.eq('owner_id', userId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase bookmarks fetch error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase bookmarks fetch failed:', err);
    return null;
  }
}

/**
 * Insert new bookmark to Supabase ootie_bookmarks
 */
export async function insertBookmarkToSupabase(bookmarkData) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const profileId = (await getAuthenticatedProfileId()) || userId;
    const itemUuid = isUuid(bookmarkData.id) ? bookmarkData.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);
    const payload = {
      owner_id: profileId,
      product_url: bookmarkData.product_url || '',
      title: bookmarkData.title,
      image_url: bookmarkData.image_url || '',
      image_storage_path: bookmarkData.image_storage_path || '',
      brand: bookmarkData.brand || '',
      price: bookmarkData.price || '',
      currency: bookmarkData.currency || 'TWD',
      variant_name: bookmarkData.variant_name || '',
      color: bookmarkData.color || '',
      size: bookmarkData.size || '',
      source_domain: bookmarkData.source_domain || '',
      notes: bookmarkData.notes || '',
      created_at: bookmarkData.created_at || new Date().toISOString(),
      updated_at: bookmarkData.updated_at || new Date().toISOString()
    };
    if (itemUuid) payload.id = itemUuid;

    const { data, error } = await supabase
      .from('ootie_bookmarks')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase bookmark insert error:', error);
      return null;
    }
    return data || payload;
  } catch (err) {
    console.warn('Supabase bookmark insert failed:', err);
    return null;
  }
}

/**
 * Update bookmark in Supabase ootie_bookmarks
 */
export async function updateBookmarkInSupabase(bookmarkId, bookmarkData) {
  if (!isUuid(bookmarkId)) return true;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return false;
    const profileId = (await getAuthenticatedProfileId()) || userId;
    const payload = {
      product_url: bookmarkData.product_url || '',
      title: bookmarkData.title,
      image_url: bookmarkData.image_url || '',
      image_storage_path: bookmarkData.image_storage_path || '',
      brand: bookmarkData.brand || '',
      price: bookmarkData.price || '',
      currency: bookmarkData.currency || 'TWD',
      variant_name: bookmarkData.variant_name || '',
      color: bookmarkData.color || '',
      size: bookmarkData.size || '',
      source_domain: bookmarkData.source_domain || '',
      notes: bookmarkData.notes || '',
      updated_at: new Date().toISOString()
    };

    let query = supabase
      .from('ootie_bookmarks')
      .update(payload)
      .eq('id', bookmarkId);

    if (profileId && profileId !== userId) {
      query = query.or(`owner_id.eq.${profileId},owner_id.eq.${userId}`);
    } else {
      query = query.eq('owner_id', userId);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) {
      console.warn('Supabase bookmark update error:', error);
      return null;
    }
    return data || true;
  } catch (err) {
    console.warn('Supabase bookmark update failed:', err);
    return null;
  }
}

/**
 * Delete bookmark from Supabase
 */
export async function deleteBookmarkFromSupabase(bookmarkId) {
  if (!isUuid(bookmarkId)) return true;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return false;
    const profileId = (await getAuthenticatedProfileId()) || userId;

    let query = supabase
      .from('ootie_bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (profileId && profileId !== userId) {
      query = query.or(`owner_id.eq.${profileId},owner_id.eq.${userId}`);
    } else {
      query = query.eq('owner_id', userId);
    }

    const { error } = await query;

    if (error) {
      console.warn('Supabase bookmark delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase bookmark delete failed:', err);
    return false;
  }
}

/**
 * Batch delete bookmarks from Supabase
 */
export async function deleteBatchBookmarksFromSupabase(bookmarkIds) {
  if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) return true;
  const validUuids = bookmarkIds.filter(isUuid);
  if (!validUuids.length) return true;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return false;
    const profileId = (await getAuthenticatedProfileId()) || userId;

    let query = supabase
      .from('ootie_bookmarks')
      .delete()
      .in('id', validUuids);

    if (profileId && profileId !== userId) {
      query = query.or(`owner_id.eq.${profileId},owner_id.eq.${userId}`);
    } else {
      query = query.eq('owner_id', userId);
    }

    const { error } = await query;

    if (error) {
      console.warn('Supabase batch delete bookmarks error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase batch delete bookmarks failed:', err);
    return false;
  }
}

/**
 * Upload bookmark image to Supabase Storage bucket 'ootie-bookmarks-images'
 */
export async function uploadBookmarkImageToStorage(file) {
  if (!file) return null;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return null;
    const fileExt = (file.name ? file.name.split('.').pop() : 'jpg').toLowerCase();
    const storagePath = `bookmarks/${userId}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('ootie-bookmarks-images')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.warn('Supabase bookmark storage upload error:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('ootie-bookmarks-images')
      .getPublicUrl(storagePath);

    return {
      publicUrl: publicUrlData?.publicUrl || '',
      storagePath
    };
  } catch (err) {
    console.warn('Supabase bookmark image upload exception:', err);
    return null;
  }
}

