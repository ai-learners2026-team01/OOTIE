import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia, disposePinia } from 'pinia';
import { useAppStore } from '../app';
import { useSosStore } from '../sos';

const remote = vi.hoisted(() => ({ read: vi.fn().mockResolvedValue([]), write: vi.fn().mockResolvedValue(true) }));
vi.mock('@/services/supabase', () => ({
  fetchSosPostsFromSupabase: remote.read, fetchOutfitSuggestionsFromSupabase: remote.read,
  insertSosPostToSupabase: remote.write, insertOutfitSuggestionToSupabase: remote.write,
  updateSosStatusInSupabase: remote.write, updateAdoptedSuggestionInSupabase: remote.write,
  fetchProfileAvatar: vi.fn(), syncProfileAvatar: vi.fn()
}));

let pinia;
const setup = () => {
  const app = useAppStore();
  const sos = useSosStore();
  app.items = [
    { id: 'mine', owner_id: 'profile-01', name: '外套' },
    { id: 'public', owner_id: 'profile-02', name: '白上衣' },
    { id: 'private', owner_id: 'profile-02', name: '私人衣物' }
  ];
  sos.sosPosts.splice(0, sos.sosPosts.length, {
    id: 'request', sender_id: 'profile-02', title: '聚餐', status: 'OPEN',
    closet_item_ids: ['public'], adopted_suggestion_id: null
  });
  sos.outfitSuggestions.splice(0);
  return { app, sos };
};
const suggestion = { sosId: 'request', selectedIds: ['public'], message: '白上衣搭牛仔褲，適合輕鬆聚餐。' };

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/sos');
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
  remote.read.mockResolvedValue([]);
  remote.write.mockResolvedValue(true);
});
afterEach(() => { disposePinia(pinia); vi.restoreAllMocks(); });

describe('SOS action contracts', () => {
  it('refuses CLOSED and unknown-status suggestions without side effects', async () => {
    const { app, sos } = setup();
    for (const status of ['CLOSED', 'unexpected', undefined]) {
      sos.sosPosts[0].status = status;
      const before = JSON.stringify({ posts: sos.sosPosts, suggestions: sos.outfitSuggestions, profile: app.profile });
      expect(await sos.submitSuggestion(suggestion)).toBe(false);
      expect(JSON.stringify({ posts: sos.sosPosts, suggestions: sos.outfitSuggestions, profile: app.profile })).toBe(before);
    }
    expect(remote.write).not.toHaveBeenCalled();
  });

  it('rejects duplicate and rapid double submission without overwriting the first suggestion', async () => {
    const { app, sos } = setup();
    const helped = app.profile.helped;
    const result = await Promise.all([sos.submitSuggestion(suggestion), sos.submitSuggestion({ ...suggestion, message: '第二次' })]);
    expect(result).toEqual([true, false]);
    expect(sos.outfitSuggestions).toHaveLength(1);
    expect(sos.outfitSuggestions[0].message).toBe(suggestion.message);
    expect(app.profile.helped).toBe(helped + 1);
    expect(remote.write).not.toHaveBeenCalled();
  });

  it('rejects self, empty, whitespace and out-of-scope suggestions', async () => {
    const { sos } = setup();
    for (const input of [
      { ...suggestion, selectedIds: [] }, { ...suggestion, message: '   ' },
      { ...suggestion, selectedIds: ['public', 'private'] }
    ]) expect(await sos.submitSuggestion(input)).toBe(false);
    sos.sosPosts[0].sender_id = 'profile-01';
    expect(await sos.submitSuggestion(suggestion)).toBe(false);
    expect(sos.outfitSuggestions).toHaveLength(0);
  });

  it('only lets the owner adopt an existing suggestion on the same OPEN SOS, then explicitly close', async () => {
    const { app, sos } = setup();
    await sos.submitSuggestion(suggestion);
    const id = sos.outfitSuggestions[0].id;
    expect(await sos.adoptSuggestion({ sosId: 'request', suggestionId: id })).toBe(false);
    expect(await sos.closeSosPost('request')).toBe(false);
    app.profile = { id: 'profile-02', username: '@owner' };
    expect(await sos.adoptSuggestion({ sosId: 'request', suggestionId: 'missing' })).toBe(false);
    sos.outfitSuggestions.push({ id: 'elsewhere', sos_id: 'other', responder_id: 'profile-03' });
    expect(await sos.adoptSuggestion({ sosId: 'request', suggestionId: 'elsewhere' })).toBe(false);
    expect(await sos.adoptSuggestion({ sosId: 'request', suggestionId: id })).toBe(true);
    expect(sos.sosPosts[0].status).toBe('OPEN');
    expect(await sos.closeSosPost('request')).toBe(true);
    expect(await sos.closeSosPost('request')).toBe(false);
    expect(await sos.adoptSuggestion({ sosId: 'request', suggestionId: id })).toBe(false);
    expect(sos.sentSosPosts[0].adopted_suggestion_id).toBe(id);
  });

  it('does not infer Auth ID = Profile ID or borrow the demo identity', async () => {
    const { app, sos } = setup();
    sos.setAuthUser({ id: 'real-auth-id' });
    expect(sos.canInteract).toBe(false);
    expect(await sos.submitSuggestion(suggestion)).toBe(false);
    app.profile = { id: 'separate-profile-id', user_id: 'real-auth-id', username: '@real' };
    expect(sos.canInteract).toBe(true);
    expect(sos.actorId).toBe('separate-profile-id');
    expect(await sos.submitSuggestion(suggestion)).toBe(true);
    expect(sos.outfitSuggestions[0].responder_id).toBe('separate-profile-id');
  });

  it('stops acting as a real profile after logout and does not let the demo login borrow it', async () => {
    const { app, sos } = setup();
    app.profile = { id: 'real-profile', user_id: 'real-auth-id', username: '@real' };
    sos.setAuthUser({ id: 'real-auth-id' });
    expect(sos.canInteract).toBe(true);
    sos.setAuthUser(null);
    expect(sos.canInteract).toBe(false);
    expect(await sos.submitSuggestion(suggestion)).toBe(false);
    sos.setAuthUser({ id: 'user-01' });
    expect(sos.canInteract).toBe(false);
    expect(await sos.submitSuggestion(suggestion)).toBe(false);
    expect(sos.outfitSuggestions).toHaveLength(0);
  });

  it('saves comments, likes and recipient notifications separately from OOTD and restores them after reload', async () => {
    const { app, sos } = setup();
    const ootd = JSON.stringify(app.ootdPosts);
    await sos.submitSuggestion(suggestion);
    const id = sos.outfitSuggestions[0].id;
    await sos.toggleLikeSuggestion({ sosId: 'request', suggestionId: id });
    expect(sos.getLikeCount(id)).toBe(1);
    expect(await sos.addComment({ sosId: 'request', text: '需要穿外套嗎？' })).toBe(true);
    expect(sos.getCommentsForSos('request')).toHaveLength(1);
    expect(sos.getCommentsForSos('request')[0].author_id).toBe('profile-01');
    app.profile = { id: 'profile-02', username: '@owner' };
    expect(sos.notifications.some(n => n.sosId === 'request' && n.suggestionId === id && n.actorId === 'profile-01')).toBe(true);
    expect(sos.hasLiked(id)).toBe(false);
    await sos.toggleLikeSuggestion({ sosId: 'request', suggestionId: id });
    expect(sos.getLikeCount(id)).toBe(2);
    await sos.closeSosPost('request');
    expect(await sos.addComment({ sosId: 'request', text: 'closed' })).toBe(false);
    expect(JSON.stringify(app.ootdPosts)).toBe(ootd);
    disposePinia(pinia);
    pinia = createPinia(); setActivePinia(pinia);
    const restored = useSosStore();
    expect(restored.getCommentsForSos('request')).toHaveLength(1);
    expect(restored.getLikeCount(id)).toBe(2);
    expect(restored.sosPosts[0].status).toBe('CLOSED');
  });

  it('keeps unsaved input and data unchanged when storage fails', async () => {
    const { sos } = setup();
    const before = JSON.stringify(sos.sosPosts);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    expect(await sos.submitSuggestion(suggestion)).toBe(false);
    expect(sos.outfitSuggestions).toHaveLength(0);
    expect(JSON.stringify(sos.sosPosts)).toBe(before);
    expect(sos.lastError).toContain('儲存');
  });

  it('never silently reads or writes remote data in LOCAL', async () => {
    const { sos } = setup();
    await sos.submitSuggestion(suggestion);
    expect(remote.read).not.toHaveBeenCalled();
    expect(remote.write).not.toHaveBeenCalled();
  });

  it('refuses to overwrite corrupt storage or updates from a different tab', async () => {
    localStorage.setItem('ootie-sos-local-v1', '{broken');
    const { sos } = setup();
    expect(sos.canInteract).toBe(false);
    expect(await sos.submitSuggestion(suggestion)).toBe(false);
    expect(localStorage.getItem('ootie-sos-local-v1')).toBe('{broken');
    disposePinia(pinia); localStorage.clear(); pinia = createPinia(); setActivePinia(pinia);
    const next = setup().sos;
    localStorage.setItem('ootie-sos-local-v1', '{"changedByOtherTab":true}');
    expect(await next.submitSuggestion(suggestion)).toBe(false);
    expect(next.lastError).toContain('另一個分頁');
    expect(localStorage.getItem('ootie-sos-local-v1')).toBe('{"changedByOtherTab":true}');
  });

  it('keeps remote reading isolated, preserves unknown profile identity and rejects mutations', async () => {
    window.history.replaceState({}, '', '/sos?sos_mode=remote_read');
    const before = localStorage.getItem('ootie-sos-local-v1');
    remote.read.mockResolvedValueOnce([{ id: 'remote-post', user_id: 'auth-user-123', closet_owner_id: 'profile-01', closet_item_ids: ['1'], status: 'OPEN' }]);
    remote.read.mockResolvedValueOnce([]);
    const sos = useSosStore();
    expect(remote.read).not.toHaveBeenCalled();
    expect(await sos.loadRemote()).toBe(true);
    expect(sos.receivedSosPosts).toHaveLength(1);
    expect(sos.sosPosts[0].sender_id).toBeNull();
    expect(sos.getPublicItemsForSos(sos.sosPosts[0])).toEqual([]);
    expect(await sos.closeSosPost('remote-post')).toBe(false);
    expect(await sos.addComment({ sosId: 'remote-post', text: 'cannot send' })).toBe(false);
    expect(await sos.submitSuggestion({ ...suggestion, sosId: 'remote-post' })).toBe(false);
    expect(localStorage.getItem('ootie-sos-local-v1')).toBe(before);
    expect(remote.write).not.toHaveBeenCalled();
    remote.read.mockResolvedValue(null);
    expect(await sos.loadRemote()).toBe(false);
    expect(sos.lastError).toContain('無法讀取遠端');
    expect(sos.sosPosts).toHaveLength(1);
  });

  it('does not fall back to local SOS data when the first remote read fails', async () => {
    window.history.replaceState({}, '', '/sos?sos_mode=remote_read');
    localStorage.setItem('ootie-sos-local-v1', JSON.stringify({
      version: 1,
      revision: 1,
      sosPosts: [{ id: 'local-only', sender_id: 'profile-01', status: 'OPEN' }],
      outfitSuggestions: [], comments: [], likes: [], notifications: [], profiles: [], items: []
    }));
    remote.read.mockResolvedValue(null);

    const sos = useSosStore();
    expect(sos.sosPosts).toHaveLength(0);
    expect(sos.ownedClosetItems).toHaveLength(0);
    expect(await sos.loadRemote()).toBe(false);
    expect(sos.sosPosts).toHaveLength(0);
    expect(sos.ownedClosetItems).toHaveLength(0);
    expect(sos.lastError).toContain('無法讀取遠端');
  });
});

describe('SOS Fixture isolation', () => {
  it('handles malformed fixture identities without crashing or overwriting the stored world', () => {
    window.history.replaceState({}, '', '/sos?sos_mode=fixture');
    const broken = JSON.stringify({ version: 1, sosPosts: [], outfitSuggestions: [], comments: [], likes: [], notifications: [], profiles: [null], items: [] });
    localStorage.setItem('ootie-fixture-world-v1', broken);
    const sos = useSosStore();
    expect(() => sos.actorProfile).not.toThrow();
    expect(sos.canInteract).toBe(false);
    expect(localStorage.getItem('ootie-fixture-world-v1')).toBe(broken);
    expect(sos.resetFixture()).toBe(true);
    expect(sos.canInteract).toBe(true);
  });

  it('shares the world across A/B/C and reload, resets only fixture state, and makes zero remote calls', async () => {
    const marker = JSON.stringify({ profile: { id: 'untouched' }, items: [] });
    localStorage.setItem('weary-app-state-v1', marker);
    window.history.replaceState({}, '', '/sos?sos_mode=fixture');
    const sos = useSosStore();
    expect(sos.mode).toBe('FIXTURE');
    const [a, b, c] = sos.fixtureProfiles;
    expect(sos.actorId).toBe(a.id);
    const post = sos.receivedSosPosts[0];
    expect(await sos.submitSuggestion({ sosId: post.id, selectedIds: [sos.getPublicItemsForSos(post)[0].id], message: '試試這樣搭' })).toBe(true);
    const id = sos.outfitSuggestions[0].id;
    expect(sos.switchFixtureProfile(b.id)).toBe(true);
    expect(sos.outfitSuggestions.some(s => s.id === id)).toBe(true);
    expect(sos.switchFixtureProfile(c.id)).toBe(true);
    expect(sos.switchFixtureProfile('nonexistent')).toBe(false);
    expect(localStorage.getItem('weary-app-state-v1')).toBe(marker);
    disposePinia(pinia); pinia = createPinia(); setActivePinia(pinia);
    const restored = useSosStore();
    expect(restored.actorId).toBe(c.id);
    expect(restored.outfitSuggestions.some(s => s.id === id)).toBe(true);
    expect(restored.resetFixture()).toBe(true);
    expect(restored.outfitSuggestions.some(s => s.id === id)).toBe(false);
    expect(localStorage.getItem('weary-app-state-v1')).toBe(marker);
    expect(localStorage.getItem('ootie-fixture-world-v1')).toBeTruthy();
    expect(localStorage.getItem('ootie-fixture-active-profile-v1')).toBeTruthy();
    expect(remote.read).not.toHaveBeenCalled(); expect(remote.write).not.toHaveBeenCalled();
  });
});
