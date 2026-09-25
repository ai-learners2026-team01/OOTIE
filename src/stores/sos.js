import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAppStore } from './app';

export const useSosStore = defineStore('sos', () => {
  const appStore = useAppStore();

  const searchQuery = ref('');

  const filteredSosPosts = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    return appStore.sosPosts.filter((post) => {
      const searchable = `${post.username} ${post.title} ${post.occasion} ${post.vibes.join(' ')}`.toLowerCase();
      return !query || searchable.includes(query);
    });
  });

  const createSosPost = ({ title, occasion, weather, when_label, vibes, details }) => {
    appStore.sosPosts.unshift({
      id: `sos-${Date.now()}`,
      username: appStore.profile.username,
      initials: appStore.profile.initials,
      title: title.trim(),
      occasion,
      weather,
      when_label,
      vibes,
      closet_count: appStore.items.length,
      details: details.trim()
    });
    appStore.showToast('穿搭求救已發布');
  };

  const submitSuggestion = ({ sosId, selectedIds, message }) => {
    appStore.outfitSuggestions.unshift({
      id: `suggestion-${Date.now()}`,
      sos_id: sosId,
      user_id: appStore.profile.id,
      item_ids: selectedIds,
      message: message.trim(),
      hearts: 0,
      created_at: new Date().toISOString()
    });
    appStore.profile.helped += 1;
    appStore.addNotification('你的 SOS 穿搭建議已送出。', 'sos');
    appStore.showToast('穿搭建議已送出，謝謝你的搭配');
  };

  return {
    searchQuery,
    filteredSosPosts,
    createSosPost,
    submitSuggestion
  };
});
