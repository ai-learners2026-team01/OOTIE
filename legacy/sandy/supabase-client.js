/* ==========================================================================
   Supabase Auth Client & Current Profile Identity Mapping
   Task ID: AUTH-001
   Description:
     Browser-safe Supabase Auth Client using Publishable Key only.
     Maps Auth User ID (auth.users.id) to ootie_profiles.user_id and returns
     the active ootie_profiles.id (Profile UUID) as the Current Profile ID.
   ========================================================================== */

(function(global) {
  'use strict';

  const AUTH_SESSION_KEY = 'ootie_supabase_auth_session';
  const listeners = new Set();
  let currentProfileCache = null;

  function getSupabaseConfig() {
    if (global.OOTIE_SUPABASE_CONFIG && typeof global.OOTIE_SUPABASE_CONFIG === 'object') {
      return global.OOTIE_SUPABASE_CONFIG;
    }
    return { url: '', publishableKey: '', enabled: false };
  }

  function isConfigured() {
    const cfg = getSupabaseConfig();
    return Boolean(cfg.url && cfg.publishableKey);
  }

  async function authFetch(endpoint, options = {}) {
    const cfg = getSupabaseConfig();
    if (!cfg.url || !cfg.publishableKey) {
      throw new Error('Supabase config missing (url or publishableKey).');
    }
    const cleanUrl = cfg.url.endsWith('/') ? cfg.url.slice(0, -1) : cfg.url;
    const url = cleanUrl + '/auth/v1/' + endpoint;
    const headers = {
      'apikey': cfg.publishableKey,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (options.token) {
      headers['Authorization'] = 'Bearer ' + options.token;
    }

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error_description || data.msg || data.message || ('Auth error ' + res.status);
      throw new Error(msg);
    }
    return data;
  }

  async function fetchProfileByUserId(userId) {
    if (!userId || !global.OOTIE_DATA || typeof global.OOTIE_DATA.mapRemoteProfileToFrontend !== 'function') {
      return null;
    }
    const cfg = getSupabaseConfig();
    const cleanUrl = cfg.url.endsWith('/') ? cfg.url.slice(0, -1) : cfg.url;
    const url = cleanUrl + '/rest/v1/ootie_profiles?user_id=eq.' + encodeURIComponent(userId);
    const headers = {
      'apikey': cfg.publishableKey,
      'Authorization': 'Bearer ' + cfg.publishableKey,
      'Accept': 'application/json'
    };

    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return global.OOTIE_DATA.mapRemoteProfileToFrontend(rows[0]);
  }

  function getStoredSession() {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (session && session.expires_at && Date.now() > session.expires_at) {
        localStorage.removeItem(AUTH_SESSION_KEY);
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  function saveStoredSession(data) {
    try {
      if (!data) {
        localStorage.removeItem(AUTH_SESSION_KEY);
        return;
      }
      const expires_at = Date.now() + ((data.expires_in || 3600) * 1000);
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at,
        user: data.user
      };
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      return session;
    } catch (e) {
      return null;
    }
  }

  function notifyListeners(event, session) {
    listeners.forEach(fn => {
      try { fn(event, session); } catch (e) { console.error('[OOTie Auth Listener Error]', e); }
    });
  }

  const OOTIE_AUTH = {
    isConfigured,

    isAuthenticated() {
      const session = getStoredSession();
      return Boolean(session && session.user && session.user.id);
    },

    getSession() {
      return getStoredSession();
    },

    getUser() {
      const session = getStoredSession();
      return session ? session.user : null;
    },

    async getProfile() {
      const user = this.getUser();
      if (!user) {
        currentProfileCache = null;
        return null;
      }
      if (currentProfileCache && currentProfileCache.user_id === user.id) {
        return currentProfileCache;
      }
      const profile = await fetchProfileByUserId(user.id);
      currentProfileCache = profile;
      return profile;
    },

    async getProfileId() {
      const profile = await this.getProfile();
      return profile ? profile.id : null;
    },

    async signIn(email, password) {
      if (!isConfigured()) {
        throw new Error('Supabase is not configured.');
      }
      const data = await authFetch('token?grant_type=password', {
        method: 'POST',
        body: { email, password }
      });

      const session = saveStoredSession(data);
      const user = data.user;
      const profile = await fetchProfileByUserId(user.id);

      if (!profile) {
        currentProfileCache = null;
        notifyListeners('SIGNED_IN_NO_PROFILE', session);
        return {
          ok: false,
          error: 'PROFILE_NOT_FOUND',
          user,
          session
        };
      }

      currentProfileCache = profile;
      notifyListeners('SIGNED_IN', session);
      return {
        ok: true,
        user,
        profile,
        session
      };
    },

    async signOut() {
      const session = getStoredSession();
      if (session && session.access_token && isConfigured()) {
        try {
          await authFetch('logout', {
            method: 'POST',
            token: session.access_token
          });
        } catch (e) {
          // ignore logout network errors and proceed with local cleanup
        }
      }
      saveStoredSession(null);
      currentProfileCache = null;
      notifyListeners('SIGNED_OUT', null);
      return { ok: true };
    },

    onAuthStateChange(callback) {
      if (typeof callback === 'function') {
        listeners.add(callback);
        return () => listeners.delete(callback);
      }
      return () => {};
    }
  };

  global.OOTIE_AUTH = OOTIE_AUTH;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OOTIE_AUTH;
  }
})(typeof window !== 'undefined' ? window : globalThis);
