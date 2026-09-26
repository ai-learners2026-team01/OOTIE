import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://tmegwwbmnwzgnbgadxwp.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TLCDkQkINOK9hBQE5h01-g_NuaQO7Fe';

export const CURRENT_USER_ID = 'user-01';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const isUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Fetch avatar_url from profiles table for current user
 */
export async function fetchProfileAvatar(userId = CURRENT_USER_ID) {
  try {
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
export async function syncProfileAvatar(avatarUrl, userId = CURRENT_USER_ID) {
  if (!avatarUrl) return false;
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, avatar_url: avatarUrl });

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
export async function fetchProfileFromSupabase(userId = CURRENT_USER_ID) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
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
export async function upsertProfileToSupabase(profileData, userId = CURRENT_USER_ID) {
  try {
    const payload = {
      user_id: userId,
      email: profileData.email || null,
      full_name: profileData.name || profileData.full_name || null,
      username: profileData.username || null,
      initials: profileData.initials || null,
      bio: profileData.bio || null,
      avatar_url: profileData.avatar_url || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
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
export async function fetchItemsFromSupabase(userId = CURRENT_USER_ID) {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
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
 * Insert item into Supabase items table
 */
export async function insertItemToSupabase(itemData, userId = CURRENT_USER_ID) {
  try {
    const itemUuid = isUuid(itemData.id) ? itemData.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);
    const payload = {
      user_id: userId,
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
      wear_count: itemData.wearCount || itemData.wear_count || 0,
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
export async function deleteItemFromSupabase(itemId, userId = CURRENT_USER_ID) {
  if (!isUuid(itemId)) return true;
  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

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
export async function fetchProfileOotdPosts(userId = CURRENT_USER_ID) {
  try {
    const { data, error } = await supabase
      .from('ootie_ootd_posts')
      .select('id, user_id, image, caption, item_ids, wearing, hashtags, likes, comments, created_at')
      .eq('user_id', userId)
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
export async function insertOotdPost(postData, userId = CURRENT_USER_ID) {
  try {
    const postUuid = isUuid(postData.id) ? postData.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);
    const payload = {
      user_id: userId,
      image: postData.image,
      caption: postData.caption,
      item_ids: postData.itemIds || postData.item_ids || [],
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
export async function updateOotdPost(postId, postData, userId = CURRENT_USER_ID) {
  if (!isUuid(postId)) return null;
  try {
    const payload = {
      image: postData.image,
      caption: postData.caption,
      item_ids: postData.itemIds || postData.item_ids || [],
      wearing: postData.wearing || [],
      hashtags: postData.hashtags || []
    };

    const { data, error } = await supabase
      .from('ootie_ootd_posts')
      .update(payload)
      .eq('id', postId)
      .eq('user_id', userId)
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
export async function deleteOotdPost(postId, userId = CURRENT_USER_ID) {
  if (!isUuid(postId)) return true;
  try {
    const { error } = await supabase
      .from('ootie_ootd_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

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
 * Insert new SOS post to Supabase ootie_sos_posts
 */
export async function insertSosPostToSupabase(sosData) {
  try {
    const postUuid = isUuid(sosData.id) ? sosData.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);
    const payload = {
      user_id: sosData.sender_id || CURRENT_USER_ID,
      closet_owner_id: sosData.closet_owner_id || sosData.sender_id || CURRENT_USER_ID,
      title: sosData.title,
      details: sosData.details,
      occasion: sosData.occasion,
      weather: sosData.weather,
      when_label: sosData.when_label,
      vibes: sosData.vibes || [],
      closet_item_ids: sosData.closet_item_ids || [],
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
    const { data, error } = await supabase
      .from('ootie_sos_posts')
      .update({ status })
      .eq('id', sosId)
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
    const { data, error } = await supabase
      .from('ootie_sos_posts')
      .update({ picked_suggestion_id: suggestionId })
      .eq('id', sosId)
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
    const sugUuid = isUuid(suggestionData.id) ? suggestionData.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);
    const payload = {
      sos_id: suggestionData.sos_id,
      user_id: suggestionData.responder_id || suggestionData.user_id || CURRENT_USER_ID,
      item_ids: suggestionData.item_ids || [],
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

