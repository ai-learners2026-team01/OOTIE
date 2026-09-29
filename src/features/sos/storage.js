export const SOS_LOCAL_KEY = 'ootie-sos-local-v1';
export const FIXTURE_WORLD_KEY = 'ootie-fixture-world-v1';
export const FIXTURE_PROFILE_KEY = 'ootie-fixture-active-profile-v1';
export const clone = value => JSON.parse(JSON.stringify(value));

export function emptyWorld(posts = [], suggestions = [], profiles = [], items = []) {
  return {
    version: 1,
    revision: 0,
    profiles: clone(profiles),
    items: clone(items),
    sosPosts: clone(posts),
    outfitSuggestions: clone(suggestions),
    comments: [],
    likes: [],
    notifications: []
  };
}

export function readWorld(key, fallback) {
  let raw = null;
  try {
    raw = localStorage.getItem(key);
    if (!raw) return { world: fallback(), raw, error: '' };
    const world = JSON.parse(raw);
    const fields = ['sosPosts', 'outfitSuggestions', 'comments', 'likes', 'notifications'];
    if (world?.version !== 1 || fields.some(name => !Array.isArray(world[name])) ||
      fields.some(name => world[name].some(row => !row || typeof row !== 'object' || !row.id))) {
      throw new Error('Unsupported SOS data');
    }
    return { world, raw, error: '' };
  } catch {
    return { world: fallback(), raw, error: '無法讀取已儲存的 SOS 資料。原始資料已保留，請先備份或聯絡團隊協助。' };
  }
}

// Persist the entire transaction before exposing it to components. Detect stale tabs.
export function writeWorld(key, world, expectedRaw) {
  if (localStorage.getItem(key) !== expectedRaw) throw new Error('STALE');
  const raw = JSON.stringify(world);
  localStorage.setItem(key, raw);
  return raw;
}
