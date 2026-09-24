/*
   Supabase Remote Read Adapter + Browser-Safe Data Interface
   Task ID: DB-002
*/

(function(global) {
  'use strict';

  function getSupabaseConfig() {
    if (global.OOTIE_SUPABASE_CONFIG && typeof global.OOTIE_SUPABASE_CONFIG === 'object') {
      return global.OOTIE_SUPABASE_CONFIG;
    }
    return { url: '', publishableKey: '', enabled: false };
  }

  function isRemoteConfigured() {
    const cfg = getSupabaseConfig();
    return Boolean(cfg.url && cfg.publishableKey);
  }

  async function supabaseGetRequest(endpoint) {
    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.publishableKey) {
      throw new Error('Supabase client not configured: missing url or publishableKey.');
    }
    const cleanUrl = cfg.url.endsWith('/') ? cfg.url.slice(0, -1) : cfg.url;
    const url = cleanUrl + '/rest/v1/' + endpoint;
    const headers = {
      'apikey': cfg.publishableKey,
      'Authorization': 'Bearer ' + cfg.publishableKey,
      'Accept': 'application/json'
    };

    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      let errBody = '';
      try { errBody = await res.text(); } catch (e) {}
      throw new Error('Supabase GET error [' + res.status + '] on ' + endpoint + ': ' + (errBody || res.statusText));
    }
    return await res.json();
  }

  function mapRemoteProfileToFrontend(row) {
    if (!row) return null;
    return {
      id: row.id,
      user_id: row.user_id || row.id,
      name: row.name || '衣友',
      username: row.username || (row.name ? '@' + row.name : '@衣友'),
      initials: row.initials || (row.name ? row.name.slice(0, 2).toUpperCase() : '衣友'),
      avatar_url: row.avatar_url || '',
      bio: row.bio || '',
      hearts: typeof row.hearts === 'number' ? row.hearts : 0,
      helped: typeof row.helped === 'number' ? row.helped : 0,
      likes: typeof row.likes === 'number' ? row.likes : 0,
      public_closet: Boolean(row.public_closet),
      created_at: row.created_at || new Date().toISOString()
    };
  }

  function mapRemoteClothingToFrontend(row) {
    if (!row) return null;
    return {
      id: row.id,
      owner_id: row.owner_id || row.user_id || '',
      name: row.name || row.name_zh || '未命名單品',
      name_zh: row.name_zh || row.name || '未命名單品',
      brand: row.brand || '',
      category: row.category || 'Tops',
      shape: row.shape || '',
      primary_color: row.primary_color || '',
      secondary_color: row.secondary_color || '',
      color_hex: row.color_hex || '#000000',
      style: row.style || 'Minimal',
      season: row.season || 'All year',
      photo: row.photo || row.image_url || '',
      wear_count: typeof row.wear_count === 'number' ? row.wear_count : 0,
      last_worn: row.last_worn || '',
      purchase_date: row.purchase_date || '',
      favorite: Boolean(row.favorite),
      hidden: Boolean(row.hidden),
      notes: row.notes || '',
      created_at: row.created_at || new Date().toISOString()
    };
  }

  function mapRemoteSosToFrontend(row, profilesMap) {
    if (!row) return null;
    const pMap = profilesMap || {};
    const ownerProfile = pMap[row.user_id] || pMap[row.closet_owner_id] || {};

    let vibes = [];
    if (Array.isArray(row.vibes)) {
      vibes = row.vibes;
    } else if (typeof row.vibes === 'string') {
      try { vibes = JSON.parse(row.vibes); } catch (e) { vibes = [row.vibes]; }
    }

    const closetItemIds = Array.isArray(row.closet_item_ids) ? row.closet_item_ids : [];
    const likedSuggestionIds = Array.isArray(row.liked_suggestion_ids) ? row.liked_suggestion_ids : [];

    return {
      id: row.id,
      sender_id: row.user_id,
      closet_owner_id: row.closet_owner_id || row.user_id,
      username: ownerProfile.username || (ownerProfile.name ? '@' + ownerProfile.name : '@衣友'),
      initials: ownerProfile.initials || (ownerProfile.name ? ownerProfile.name.slice(0, 2).toUpperCase() : '衣友'),
      title: row.title || '穿搭求救',
      occasion: row.occasion || '未設定',
      weather: row.weather || '未設定',
      when_label: row.when_label || '未設定',
      vibes: vibes,
      details: row.details || '',
      notes: row.notes || null,
      closet_item_ids: closetItemIds,
      closet_count: closetItemIds.length,
      status: row.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
      adopted_suggestion_id: row.picked_suggestion_id || null,
      liked_suggestion_ids: likedSuggestionIds,
      created_at: row.created_at || new Date().toISOString()
    };
  }

  function mapRemoteSuggestionToFrontend(row, sosPosts) {
    if (!row) return null;
    const pSosList = Array.isArray(sosPosts) ? sosPosts : [];
    const parentSos = pSosList.find(p => p.id === row.sos_id);
    const likedIds = parentSos && Array.isArray(parentSos.liked_suggestion_ids)
      ? parentSos.liked_suggestion_ids
      : (Array.isArray(row.liked_suggestion_ids) ? row.liked_suggestion_ids : []);

    return {
      id: row.id,
      sos_id: row.sos_id,
      responder_id: row.user_id,
      item_ids: Array.isArray(row.item_ids) ? row.item_ids : [],
      message: row.message || '',
      hearts: typeof row.hearts === 'number' ? row.hearts : 0,
      requester_liked: likedIds.includes(row.id),
      created_at: row.created_at || new Date().toISOString()
    };
  }

  const OOTIE_DATA = {
    isRemoteConfigured,

    async getRemoteHealth() {
      if (!isRemoteConfigured()) {
        return { ok: false, reason: 'NOT_CONFIGURED' };
      }
      try {
        await supabaseGetRequest('ootie_profiles?select=id&limit=1');
        return { ok: true };
      } catch (err) {
        console.warn('[OOTie Remote Health Check]', err.message);
        return { ok: false, error: err.message };
      }
    },

    async fetchProfiles() {
      const rows = await supabaseGetRequest('ootie_profiles?select=*');
      return Array.isArray(rows) ? rows.map(mapRemoteProfileToFrontend) : [];
    },

    async fetchClothingItems() {
      const rows = await supabaseGetRequest('ootie_clothing_items?select=*');
      return Array.isArray(rows) ? rows.map(mapRemoteClothingToFrontend) : [];
    },

    async fetchClothingItemsByIds(itemIds) {
      if (!Array.isArray(itemIds) || itemIds.length === 0) return [];
      const cleanIds = itemIds.filter(Boolean);
      if (cleanIds.length === 0) return [];
      const rows = await supabaseGetRequest('ootie_clothing_items?id=in.(' + cleanIds.join(',') + ')');
      return Array.isArray(rows) ? rows.map(mapRemoteClothingToFrontend) : [];
    },

    async fetchSosPosts() {
      const rows = await supabaseGetRequest('ootie_sos_posts?select=*&order=created_at.desc');
      return Array.isArray(rows) ? rows : [];
    },

    async fetchSuggestions() {
      const rows = await supabaseGetRequest('ootie_outfit_suggestions?select=*&order=created_at.desc');
      return Array.isArray(rows) ? rows : [];
    },

    async fetchSosBundle() {
      try {
        const [rawProfiles, rawSos, rawSuggestions] = await Promise.all([
          this.fetchProfiles().catch(err => { console.warn('fetchProfiles failed', err); return []; }),
          this.fetchSosPosts().catch(err => { console.warn('fetchSosPosts failed', err); return []; }),
          this.fetchSuggestions().catch(err => { console.warn('fetchSuggestions failed', err); return []; })
        ]);

        const itemIdsSet = new Set();
        rawSos.forEach(post => {
          if (Array.isArray(post.closet_item_ids)) {
            post.closet_item_ids.forEach(id => { if (id) itemIdsSet.add(id); });
          }
        });
        rawSuggestions.forEach(sug => {
          if (Array.isArray(sug.item_ids)) {
            sug.item_ids.forEach(id => { if (id) itemIdsSet.add(id); });
          }
        });

        const neededItemIds = Array.from(itemIdsSet);
        const rawItems = neededItemIds.length > 0
          ? await this.fetchClothingItemsByIds(neededItemIds).catch(err => { console.warn('fetchClothingItemsByIds failed', err); return []; })
          : [];

        const profilesMap = {};
        rawProfiles.forEach(p => { if (p && p.id) profilesMap[p.id] = p; });

        const sosPosts = rawSos.map(row => mapRemoteSosToFrontend(row, profilesMap));
        const outfitSuggestions = rawSuggestions.map(row => mapRemoteSuggestionToFrontend(row, rawSos));

        return {
          profiles: rawProfiles,
          items: rawItems,
          sosPosts,
          outfitSuggestions
        };
      } catch (err) {
        console.warn('[OOTie Remote Bundle Error]', err.message);
        return { profiles: [], items: [], sosPosts: [], outfitSuggestions: [], error: err.message };
      }
    },

    async createSosPost() { throw new Error('Remote mutation not implemented in DB-002.'); },
    async updateSosStatus() { throw new Error('Remote mutation not implemented in DB-002.'); },
    async updatePickedSuggestion() { throw new Error('Remote mutation not implemented in DB-002.'); },
    async updateLikedSuggestions() { throw new Error('Remote mutation not implemented in DB-002.'); },
    async createSuggestion() { throw new Error('Remote mutation not implemented in DB-002.'); }
  };

  OOTIE_DATA.mapRemoteSosToFrontend = mapRemoteSosToFrontend;
  OOTIE_DATA.mapRemoteSuggestionToFrontend = mapRemoteSuggestionToFrontend;
  OOTIE_DATA.mapRemoteProfileToFrontend = mapRemoteProfileToFrontend;
  OOTIE_DATA.mapRemoteClothingToFrontend = mapRemoteClothingToFrontend;

  global.OOTIE_DATA = OOTIE_DATA;
  global.SosAdapter = OOTIE_DATA;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OOTIE_DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
