import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useAppStore } from './app';
import { getSosMode } from '@/features/sos/mode';
import { resolveSosIdentity } from '@/features/sos/identity';
import { asArray, LIMITS, publicItemsForSos, suggestionBlockReason, ownerActionReason, isActiveSuggestion, textValue, validText } from '@/features/sos/domain';
import { clone, emptyWorld, readWorld, writeWorld, SOS_LOCAL_KEY, FIXTURE_WORLD_KEY, FIXTURE_PROFILE_KEY } from '@/features/sos/storage';
import { createFixtureWorld, fixtureProfiles } from '@/features/sos/fixture';

export const useSosStore = defineStore('sos', () => {
  const appStore = useAppStore();
  const mode = getSosMode();
  const isFixture = mode === 'FIXTURE';
  const key = isFixture ? FIXTURE_WORLD_KEY : SOS_LOCAL_KEY;
  const loaded = readWorld(key, () => isFixture ? createFixtureWorld() : emptyWorld());
  const world = ref(loaded.world);
  let savedRaw = loaded.raw;
  const storageError = ref(loaded.error);
  const lastError = ref(loaded.error);
  const authUser = ref(null);
  const activeProfileId = ref(fixtureProfiles[0].id);
  if (isFixture) {
    try {
      const savedId = localStorage.getItem(FIXTURE_PROFILE_KEY);
      if (fixtureProfiles.some(p => p.id === savedId)) activeProfileId.value = savedId;
    } catch { /* Actions surface storage failure without losing input. */ }
    if (!Array.isArray(world.value.profiles) || !Array.isArray(world.value.items) ||
      world.value.profiles.some(p => !p?.id || !fixtureProfiles.some(expected => expected.id === p.id)) ||
      fixtureProfiles.some(p => !world.value.profiles.some(saved => saved?.id === p.id)) ||
      world.value.items.some(item => !item?.id || !fixtureProfiles.some(p => p.id === item.owner_id))) {
      storageError.value = '測試資料格式不相容，請使用「重設體驗」建立新的測試資料。';
      world.value = createFixtureWorld(); // In-memory recovery only; stored data is kept until explicit Reset.
    }
  }
  const activeTab = ref('received');
  const searchQuery = ref('');
  const historyFilter = ref('all');
  const occasionFilter = ref('');
  const isInboxOpen = ref(false);
  const highlightedSuggestionId = ref(null);
  const highlightedCommentId = ref(null);
  const remoteLoading = ref(false);
  const remoteLoaded = ref(false);
  const remoteWorld = ref(emptyWorld());
  // Formal browser mode is a remote-read surface. Keep its source isolated
  // from the local SOS world even before the first response or after a read
  // failure, so a network error can never masquerade as local/fixture data.
  const formalRemoteRead = computed(() => !isFixture && import.meta.env.MODE !== 'test');
  const source = computed(() => {
    if (isFixture) return world.value;
    if (mode === 'REMOTE_READ' || formalRemoteRead.value) return remoteLoaded.value ? remoteWorld.value : emptyWorld();
    return remoteLoaded.value ? remoteWorld.value : world.value;
  });
  const sosPosts = computed(() => source.value.sosPosts);
  const outfitSuggestions = computed(() => source.value.outfitSuggestions);
  const actorProfile = computed(() => {
    if (isFixture) return asArray(world.value.profiles).find(p => p.id === activeProfileId.value) || fixtureProfiles[0];
    const profiles = asArray(source.value.profiles);
    const authId = authUser.value?.id;
    return profiles.find(profile => profile.id === appStore.profile?.id) ||
      (authId && profiles.find(profile => profile.user_id === authId)) ||
      profiles.find(profile => profile.user_id === appStore.profile?.user_id) ||
      appStore.profile;
  });
  const identity = computed(() => resolveSosIdentity({ mode, profile: actorProfile.value, authUser: authUser.value }));
  const actorId = computed(() => identity.value.id);
  const interactionReason = computed(() => storageError.value || identity.value.reason);
  // In the browser, the normal SOS route is a Supabase read-only surface until
  // Auth/RLS ownership is ready. Tests keep explicit LOCAL state isolated.
  const canInteract = computed(() => !formalRemoteRead.value && !interactionReason.value && Boolean(actorId.value));
  const closetItems = computed(() => {
    if (isFixture) return asArray(world.value.items);
    if (mode === 'REMOTE_READ' || formalRemoteRead.value) return remoteLoaded.value ? asArray(source.value.items) : [];
    return remoteLoaded.value ? asArray(source.value.items) : asArray(appStore.items);
  });
  const ownedClosetItems = computed(() => closetItems.value.filter(item => item?.id != null && item.owner_id === actorId.value));
  const notifications = computed(() => source.value.notifications.filter(n => n.recipientId === actorId.value));
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);
  const receivedSosPosts = computed(() => sosPosts.value.filter(p => (!actorId.value || p.sender_id !== actorId.value) && p.status === 'OPEN'));
  const sentSosPosts = computed(() => sosPosts.value.filter(p => actorId.value && p.sender_id === actorId.value));
  const filteredSosPosts = computed(() => {
    const list = activeTab.value === 'received' ? receivedSosPosts.value : sentSosPosts.value;
    const query = textValue(searchQuery.value).toLocaleLowerCase();
    return list.filter(p =>
      (!occasionFilter.value || p.occasion === occasionFilter.value) &&
      (activeTab.value !== 'sent' || historyFilter.value === 'all' || p.status === historyFilter.value) &&
      (!query || [p.username, p.title, p.occasion, p.weather, ...asArray(p.vibes), p.details].join(' ').toLocaleLowerCase().includes(query))
    );
  });

  // Compatibility mirror; no Fixture data crosses into the shared app state.
  const mirrorLocal = () => {
    if (mode !== 'LOCAL' || import.meta.env.MODE !== 'test') return;
    appStore.sosPosts = world.value.sosPosts;
    appStore.outfitSuggestions = world.value.outfitSuggestions;
  };
  mirrorLocal();
  const fail = message => { lastError.value = message; appStore.showToast(message); return false; };
  const clearError = () => { lastError.value = ''; };
  const setAuthUser = user => { authUser.value = user || null; };
  const getPublicItemsForSos = (post, items = closetItems.value) => publicItemsForSos(post, items);
  const getSuggestionsForSos = id => outfitSuggestions.value.filter(s => s.sos_id === id && isActiveSuggestion(s));
  const getCommentsForSos = id => source.value.comments.filter(c => c.sos_id === id);
  const getHelperCountForSos = id => new Set(getSuggestionsForSos(id).map(s => s.responder_id || s.user_id).filter(Boolean)).size;
  const isOwner = post => Boolean(actorId.value && post?.sender_id === actorId.value);
  const getSuggestionBlockReason = post => suggestionBlockReason({
    post, actorId: canInteract.value ? actorId.value : null, identityReason: interactionReason.value,
    suggestions: outfitSuggestions.value, publicItems: getPublicItemsForSos(post)
  });
  const hasLiked = suggestionId => source.value.likes.some(l => l.suggestionId === suggestionId && l.actorId === actorId.value);
  const getLikeCount = suggestionId => Math.max(0, Number(outfitSuggestions.value.find(s => s.id === suggestionId)?.hearts) || 0)
    + source.value.likes.filter(l => l.suggestionId === suggestionId).length;
  const newId = prefix => `${prefix}-${crypto.randomUUID()}`;
  const timestamp = () => new Date().toISOString();

  function commit(change, successMessage = '') {
    if (!canInteract.value) return fail(interactionReason.value);
    const draft = clone(world.value);
    change(draft);
    draft.revision = (Number(draft.revision) || 0) + 1;
    try { savedRaw = writeWorld(key, draft, savedRaw); }
    catch (error) {
      return fail(error.message === 'STALE'
        ? '另一個分頁已更新 SOS，請重新整理後再試。你的輸入尚未送出。'
        : '無法儲存，尚未送出。請確認瀏覽器儲存空間後重試，輸入內容仍保留。');
    }
    world.value = draft;
    mirrorLocal();
    clearError();
    if (successMessage) appStore.showToast(successMessage);
    return true;
  }
  function notify(draft, { recipientId, type, sosId, suggestionId = null, commentId = null, text }) {
    if (!recipientId || recipientId === actorId.value) return;
    draft.notifications.unshift({ id: newId('sos-notice'), recipientId, actorId: actorId.value, type, sosId, suggestionId, commentId, text, read: false, created_at: timestamp() });
  }

  async function createSosPost(input = {}) {
    if (!canInteract.value) return fail(interactionReason.value);
    const owned = new Set(ownedClosetItems.value.map(i => i.id));
    const ids = [...new Set(asArray(input.closet_item_ids))].filter(id => owned.has(id));
    if (!ids.length) return fail('請至少選擇 1 件自己的衣物。');
    if (!validText(input.title, LIMITS.title)) return fail(`請填寫 1–${LIMITS.title} 字的求救標題。`);
    if (!validText(input.details, LIMITS.details)) return fail(`請填寫穿搭需求，最多 ${LIMITS.details} 字。`);
    const vibes = [...new Set(asArray(input.vibes).filter(v => typeof v === 'string' && v.trim() && v.length <= 40))].slice(0, 6);
    if (!vibes.length) return fail('請至少選一個想呈現的風格。');
    const post = {
      id: newId('sos'), sender_id: actorId.value, closet_owner_id: actorId.value,
      username: actorProfile.value.username, initials: actorProfile.value.initials,
      title: textValue(input.title), details: textValue(input.details),
      occasion: textValue(input.occasion) || '日常', weather: textValue(input.weather) || '未設定', when_label: textValue(input.when_label) || '未設定',
      vibes, closet_item_ids: ids, status: 'OPEN', adopted_suggestion_id: null, created_at: timestamp()
    };
    const success = commit(draft => draft.sosPosts.unshift(post), isFixture ? '求救已發布到體驗空間' : '求救已儲存於這台裝置');
    if (success) { activeTab.value = 'sent'; searchQuery.value = ''; historyFilter.value = 'all'; occasionFilter.value = ''; }
    return success;
  }
  async function submitSuggestion({ sosId, selectedIds, message } = {}) {
    const post = sosPosts.value.find(p => p.id === sosId);
    const reason = getSuggestionBlockReason(post);
    if (reason) return fail(reason);
    const publicIds = new Set(getPublicItemsForSos(post).map(i => i.id));
    const ids = [...new Set(asArray(selectedIds))];
    if (!ids.length || ids.some(id => !publicIds.has(id))) return fail('請重新選擇這筆求救公開的衣物。');
    if (!validText(message, LIMITS.message)) return fail(`請填寫搭配建議，最多 ${LIMITS.message} 字。`);
    const suggestion = { id: newId('suggestion'), sos_id: sosId, responder_id: actorId.value, username: actorProfile.value.username, item_ids: ids, message: textValue(message), hearts: 0, created_at: timestamp() };
    const success = commit(draft => {
      draft.outfitSuggestions.unshift(suggestion);
      if (isFixture) {
        const profile = draft.profiles.find(p => p.id === actorId.value);
        profile.helped = (Number(profile.helped) || 0) + 1;
      }
      notify(draft, { recipientId: post.sender_id, type: 'sos_suggestion', sosId, suggestionId: suggestion.id, text: `${actorProfile.value.username || '衣友'} 提供了一套搭配` });
    }, isFixture ? '搭配建議已送出' : '搭配建議已儲存於這台裝置');
    if (success && !isFixture) appStore.profile.helped = (Number(appStore.profile.helped) || 0) + 1;
    return success;
  }
  async function adoptSuggestion({ sosId, suggestionId } = {}) {
    const post = sosPosts.value.find(p => p.id === sosId);
    const reason = ownerActionReason(post, canInteract.value ? actorId.value : null, interactionReason.value);
    if (reason) return fail(reason);
    const suggestion = getSuggestionsForSos(sosId).find(s => s.id === suggestionId);
    if (!suggestion) return fail('找不到這筆求救的搭配建議。');
    const adopted = post.adopted_suggestion_id === suggestionId ? null : suggestionId;
    return commit(draft => {
      draft.sosPosts.find(p => p.id === sosId).adopted_suggestion_id = adopted;
      if (adopted) notify(draft, { recipientId: suggestion.responder_id, type: 'sos_adopt', sosId, suggestionId, text: `${actorProfile.value.username || '發布者'} 採納了你的搭配` });
    }, adopted ? '已採納搭配，求救仍開放；準備好時可按「結束求救」' : '已取消採納');
  }
  async function closeSosPost(sosId) {
    const post = sosPosts.value.find(p => p.id === sosId);
    const reason = ownerActionReason(post, canInteract.value ? actorId.value : null, interactionReason.value);
    if (reason) return fail(reason);
    return commit(draft => {
      const target = draft.sosPosts.find(p => p.id === sosId);
      target.status = 'CLOSED'; target.closed_at = timestamp();
      const recipients = new Set([...getSuggestionsForSos(sosId).map(s => s.responder_id), ...getCommentsForSos(sosId).map(c => c.author_id)]);
      recipients.forEach(recipientId => notify(draft, { recipientId, type: 'sos_close', sosId, text: '你參與的穿搭求救已結束，搭配和留言已保留' }));
    }, '求救已結束，可在「我發出的求救」查看紀錄');
  }
  async function toggleLikeSuggestion({ sosId, suggestionId } = {}) {
    if (!canInteract.value) return fail(interactionReason.value);
    if (!sosPosts.value.some(p => p.id === sosId) || !getSuggestionsForSos(sosId).some(s => s.id === suggestionId)) return fail('找不到這套搭配。');
    return commit(draft => {
      const index = draft.likes.findIndex(l => l.actorId === actorId.value && l.suggestionId === suggestionId);
      if (index >= 0) draft.likes.splice(index, 1);
      else draft.likes.push({ id: newId('sos-like'), actorId: actorId.value, sosId, suggestionId });
    });
  }
  async function addComment({ sosId, text } = {}) {
    if (!canInteract.value) return fail(interactionReason.value);
    const post = sosPosts.value.find(p => p.id === sosId);
    if (!post || post.status !== 'OPEN') return fail('這筆求救已停止接受新留言。');
    if (!validText(text, LIMITS.comment)) return fail(`請填寫 1–${LIMITS.comment} 字的留言。`);
    const comment = { id: newId('sos-comment'), sos_id: sosId, author_id: actorId.value, username: actorProfile.value.username, text: textValue(text), created_at: timestamp() };
    return commit(draft => {
      draft.comments.push(comment);
      const recipients = new Set([post.sender_id]);
      if (isOwner(post)) {
        getCommentsForSos(sosId).forEach(c => recipients.add(c.author_id));
        getSuggestionsForSos(sosId).forEach(s => recipients.add(s.responder_id));
      }
      recipients.forEach(recipientId => notify(draft, { recipientId, type: 'sos_comment', sosId, commentId: comment.id, text: `${actorProfile.value.username || '衣友'} 留下了新留言` }));
    }, isFixture ? '留言已送出' : '留言已儲存於這台裝置');
  }
  const markNotificationRead = id => commit(draft => {
    const notification = draft.notifications.find(n => n.id === id && n.recipientId === actorId.value);
    if (notification) notification.read = true;
  });
  const closeDialogs = () => {
    appStore.isSosFormOpen = false; appStore.sosTargetItemId = null;
    appStore.isSuggestionFormOpen = false; appStore.activeSosId = null;
    appStore.isSosDetailOpen = false; appStore.activeSosDetailId = null;
    appStore.isSosCloseConfirmOpen = false; appStore.sosToCloseId = null;
    isInboxOpen.value = false; highlightedSuggestionId.value = null; highlightedCommentId.value = null;
  };
  watch(actorId, () => { closeDialogs(); clearError(); });
  function switchFixtureProfile(id) {
    if (!isFixture || !fixtureProfiles.some(p => p.id === id)) return false;
    try { localStorage.setItem(FIXTURE_PROFILE_KEY, id); }
    catch { return fail('無法儲存體驗角色，請確認瀏覽器儲存空間。'); }
    activeProfileId.value = id;
    activeTab.value = 'received'; searchQuery.value = ''; historyFilter.value = 'all'; occasionFilter.value = '';
    closeDialogs();
    return true;
  }
  function resetFixture() {
    if (!isFixture) return false;
    const fresh = createFixtureWorld();
    try {
      savedRaw = writeWorld(key, fresh, localStorage.getItem(key));
      world.value = fresh; storageError.value = ''; clearError(); closeDialogs();
      // Keep the selected profile: Reset clears only interactions in the shared world.
      appStore.showToast('體驗資料已重設，個人衣櫃與其他頁面不受影響');
      return true;
    } catch { return fail('無法儲存重設結果，請確認瀏覽器儲存空間。'); }
  }
  async function loadRemote() {
    const requestedMode = getSosMode();
    if (isFixture || remoteLoading.value ||
      (mode === 'LOCAL' && import.meta.env.MODE === 'test' && requestedMode !== 'REMOTE_READ')) return false;
    remoteLoading.value = true; clearError();
    try {
      const { readRemoteSos } = await import('@/features/sos/remote');
      const result = await readRemoteSos();
      remoteWorld.value = { ...emptyWorld(), ...result }; remoteLoaded.value = true;
      return true;
    } catch { return fail('暫時無法讀取遠端求救，請稍後重試。本機紀錄未受影響。'); }
    finally { remoteLoading.value = false; }
  }
  return {
    mode, isFixture, formalRemoteRead, fixtureProfiles, actorProfile, actorId, closetItems, ownedClosetItems, canInteract, interactionReason,
    activeTab, searchQuery, historyFilter, occasionFilter, sosPosts, outfitSuggestions, receivedSosPosts, sentSosPosts, filteredSosPosts,
    lastError, clearError, setAuthUser, notifications, unreadCount, isInboxOpen, highlightedSuggestionId, highlightedCommentId,
    remoteLoading, remoteLoaded, loadRemote, isOwner, getPublicItemsForSos, getSuggestionsForSos, getCommentsForSos, getHelperCountForSos,
    getSuggestionBlockReason, getLikeCount, hasLiked, createSosPost, submitSuggestion, adoptSuggestion, closeSosPost, toggleLikeSuggestion,
    addComment, markNotificationRead, switchFixtureProfile, resetFixture, closeDialogs
  };
});
