import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useAppStore } from './app';
import {
  fetchSosPostsFromSupabase,
  insertSosPostToSupabase,
  updateSosStatusInSupabase,
  updateAdoptedSuggestionInSupabase,
  fetchOutfitSuggestionsFromSupabase,
  insertOutfitSuggestionToSupabase
} from '@/services/supabase';

export const useSosStore = defineStore('sos', () => {
  const appStore = useAppStore();

  const activeTab = ref('received'); // 'received' (衣友求救板) | 'sent' (我發出的求救)
  const searchQuery = ref('');

  // Initial SOS posts with Sandy's data model
  const initialSosPosts = [
    {
      id: 'sos-01',
      sender_id: 'profile-02',
      closet_owner_id: 'profile-02',
      username: '@ella',
      initials: 'EL',
      title: '明天第一次約會，我該穿什麼？',
      occasion: '約會',
      weather: '涼爽',
      when_label: '明天',
      vibes: ['Soft', 'Elegant'],
      closet_item_ids: ['1', '2', '3', '5', '6'],
      details: '下午先去咖啡廳，晚上會去義大利餐廳，希望看起來有打扮但不要太正式。',
      status: 'OPEN',
      adopted_suggestion_id: null,
      liked_suggestion_ids: [],
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'sos-02',
      sender_id: 'profile-03',
      closet_owner_id: 'profile-03',
      username: '@rachel',
      initials: 'RC',
      title: '面試新創公司，西裝會不會太正式？',
      occasion: '工作',
      weather: '晴天',
      when_label: '週五',
      vibes: ['Smart Casual', 'Confident'],
      closet_item_ids: ['1', '2', '4', '8'],
      details: '想要專業一點，但也希望保留自己的風格。',
      status: 'OPEN',
      adopted_suggestion_id: null,
      liked_suggestion_ids: [],
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'sos-03',
      sender_id: 'profile-04',
      closet_owner_id: 'profile-04',
      username: '@mika',
      initials: 'MK',
      title: '週末戶外聚餐，怎麼穿才不怕冷？',
      occasion: '聚餐',
      weather: '微涼有風',
      when_label: '週末',
      vibes: ['Relaxed', 'Layered'],
      closet_item_ids: ['2', '3', '6', '7', '8'],
      details: '會在戶外待一整天，希望活動方便又好看。',
      status: 'OPEN',
      adopted_suggestion_id: null,
      liked_suggestion_ids: [],
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'sos-04',
      sender_id: 'profile-01',
      closet_owner_id: 'profile-01',
      username: '@hayley',
      initials: 'HL',
      title: '旅行行李只能帶三套，拜託幫我選！',
      occasion: '旅行',
      weather: '晴天',
      when_label: '下週',
      vibes: ['Casual', 'Minimal'],
      closet_item_ids: ['1', '2', '3', '4', '6', '7'],
      details: '目的地白天溫暖、晚上偏涼，想要每件都能互相搭配。',
      status: 'OPEN',
      adopted_suggestion_id: null,
      liked_suggestion_ids: [],
      created_at: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  const sosPosts = ref(appStore.sosPosts || []);
  const outfitSuggestions = ref(appStore.outfitSuggestions || []);

  // Update appStore on change
  watch(
    sosPosts,
    (val) => {
      appStore.sosPosts = val;
    },
    { deep: true }
  );


  // Sync with Supabase on mount/init
  const initFromSupabase = async () => {
    try {
      const remotePosts = await fetchSosPostsFromSupabase();
      if (remotePosts && remotePosts.length) {
        sosPosts.value = remotePosts.map((p) => ({
          id: p.id,
          sender_id: p.user_id || p.sender_id,
          closet_owner_id: p.closet_owner_id || p.user_id,
          username: p.username || '@衣友',
          initials: p.initials || '衣友',
          title: p.title || '穿搭求救',
          occasion: p.occasion || '未設定',
          weather: p.weather || '未設定',
          when_label: p.when_label || '未設定',
          vibes: Array.isArray(p.vibes) ? p.vibes : [],
          closet_item_ids: Array.isArray(p.closet_item_ids) ? p.closet_item_ids : [],
          details: p.details || '',
          status: p.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
          adopted_suggestion_id: p.picked_suggestion_id || p.adopted_suggestion_id || null,
          liked_suggestion_ids: Array.isArray(p.liked_suggestion_ids) ? p.liked_suggestion_ids : [],
          created_at: p.created_at || new Date().toISOString()
        }));
      }

      const remoteSuggestions = await fetchOutfitSuggestionsFromSupabase();
      if (remoteSuggestions && remoteSuggestions.length) {
        outfitSuggestions.value = remoteSuggestions.map((s) => ({
          id: s.id,
          sos_id: s.sos_id,
          responder_id: s.user_id || s.responder_id,
          item_ids: Array.isArray(s.item_ids) ? s.item_ids : [],
          message: s.message || '',
          hearts: s.hearts || 0,
          created_at: s.created_at || new Date().toISOString()
        }));
      }
    } catch (e) {
      console.warn('Supabase SOS sync skipped or failed:', e);
    }
  };

  // Run initial sync asynchronously
  initFromSupabase();

  // Tab filtering & Search filtering
  const receivedSosPosts = computed(() => {
    // Other people's OPEN posts
    return sosPosts.value.filter((p) => p.sender_id !== appStore.profile.id && p.status === 'OPEN');
  });

  const sentSosPosts = computed(() => {
    // Current user's own sent SOS posts (both OPEN and CLOSED)
    return sosPosts.value.filter((p) => p.sender_id === appStore.profile.id);
  });

  const filteredSosPosts = computed(() => {
    const targetList = activeTab.value === 'received' ? receivedSosPosts.value : sentSosPosts.value;
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return targetList;
    return targetList.filter((post) => {
      const searchable = `${post.username} ${post.title} ${post.occasion} ${post.weather} ${post.vibes.join(' ')} ${post.details}`.toLowerCase();
      return searchable.includes(query);
    });
  });

  // Helpers
  const getSuggestionsForSos = (sosId) => {
    return outfitSuggestions.value.filter((s) => s.sos_id === sosId);
  };

  const getHelperCountForSos = (sosId) => {
    const sugs = getSuggestionsForSos(sosId);
    const responders = new Set(sugs.map((s) => s.responder_id || s.user_id));
    return responders.size;
  };

  // Actions
  const createSosPost = async ({ title, occasion, weather, when_label, vibes, details, closet_item_ids }) => {
    const finalItemIds = Array.isArray(closet_item_ids) ? closet_item_ids : appStore.items.map((i) => i.id);
    if (!finalItemIds.length) {
      appStore.showToast('請至少選擇 1 件要公開給衣友的衣物。');
      return false;
    }

    const newPost = {
      id: `sos-${Date.now()}`,
      sender_id: appStore.profile.id,
      closet_owner_id: appStore.profile.id,
      username: appStore.profile.username,
      initials: appStore.profile.initials,
      title: (title || '').trim(),
      occasion,
      weather,
      when_label,
      vibes: vibes || [],
      closet_item_ids: finalItemIds,
      details: (details || '').trim(),
      status: 'OPEN',
      adopted_suggestion_id: null,
      liked_suggestion_ids: [],
      created_at: new Date().toISOString()
    };

    sosPosts.value.unshift(newPost);
    appStore.showToast('穿搭求救已發布');

    // Remote sync
    insertSosPostToSupabase(newPost).catch((err) => console.warn('Supabase remote write error:', err));
    return true;
  };

  const submitSuggestion = async ({ sosId, selectedIds, message }) => {
    const targetSos = sosPosts.value.find((p) => p.id === sosId);
    if (!targetSos) return false;

    // Self-suggestion guard
    if (targetSos.sender_id === appStore.profile.id) {
      appStore.showToast('你不能為自己的求救貼文提交搭配建議。');
      return false;
    }

    // Single active suggestion per responder rule
    const existingIdx = outfitSuggestions.value.findIndex(
      (s) => s.sos_id === sosId && (s.responder_id === appStore.profile.id || s.user_id === appStore.profile.id)
    );
    const newSug = {
      id: existingIdx >= 0 ? outfitSuggestions.value[existingIdx].id : `suggestion-${Date.now()}`,
      sos_id: sosId,
      responder_id: appStore.profile.id,
      user_id: appStore.profile.id,
      item_ids: selectedIds || [],
      message: (message || '').trim(),
      hearts: 0,
      created_at: new Date().toISOString()
    };


    if (existingIdx >= 0) {
      outfitSuggestions.value[existingIdx] = newSug;
    } else {
      outfitSuggestions.value.unshift(newSug);
    }

    appStore.profile.helped += 1;
    appStore.addNotification('你的 SOS 穿搭建議已送出。', 'sos');
    appStore.showToast('穿搭建議已送出，謝謝你的搭配');

    insertOutfitSuggestionToSupabase(newSug).catch((err) => console.warn('Supabase remote write error:', err));
    return true;
  };

  const adoptSuggestion = async ({ sosId, suggestionId }) => {
    const targetSos = sosPosts.value.find((p) => p.id === sosId);
    if (!targetSos) return;

    // Adopt sets adopted_suggestion_id, but keeps SOS status as OPEN!
    targetSos.adopted_suggestion_id = targetSos.adopted_suggestion_id === suggestionId ? null : suggestionId;
    appStore.showToast(targetSos.adopted_suggestion_id ? '已採納此穿搭建議' : '已取消採納');

    updateAdoptedSuggestionInSupabase(sosId, targetSos.adopted_suggestion_id).catch((err) =>
      console.warn('Supabase remote write error:', err)
    );
  };

  const toggleLikeSuggestion = async ({ sosId, suggestionId }) => {
    const targetSos = sosPosts.value.find((p) => p.id === sosId);
    if (!targetSos) return;

    if (!Array.isArray(targetSos.liked_suggestion_ids)) {
      targetSos.liked_suggestion_ids = [];
    }

    const idx = targetSos.liked_suggestion_ids.indexOf(suggestionId);
    if (idx >= 0) {
      targetSos.liked_suggestion_ids.splice(idx, 1);
    } else {
      targetSos.liked_suggestion_ids.push(suggestionId);
    }
  };

  const closeSosPost = async (sosId) => {
    const targetSos = sosPosts.value.find((p) => p.id === sosId);
    if (!targetSos) return;

    targetSos.status = 'CLOSED';
    appStore.showToast('該筆穿搭求救已結束');

    updateSosStatusInSupabase(sosId, 'CLOSED').catch((err) => console.warn('Supabase remote write error:', err));
  };

  return {
    activeTab,
    searchQuery,
    sosPosts,
    outfitSuggestions,
    receivedSosPosts,
    sentSosPosts,
    filteredSosPosts,
    getSuggestionsForSos,
    getHelperCountForSos,
    createSosPost,
    submitSuggestion,
    adoptSuggestion,
    toggleLikeSuggestion,
    closeSosPost
  };
});
