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
