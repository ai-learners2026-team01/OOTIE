import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import {
  STORAGE_KEY,
  defaultItems,
  defaultProfile,
  defaultOotdPosts,
  defaultNotifications,
  defaultSosPosts
} from '@/constants';

export const useAppStore = defineStore('app', () => {
  // Load state from localStorage or use defaults
  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const saved = loadState();

  const items = ref(saved && saved.items ? saved.items : JSON.parse(JSON.stringify(defaultItems)));
  const profile = ref(saved && saved.profile ? saved.profile : JSON.parse(JSON.stringify(defaultProfile)));
  const ootdPosts = ref(saved && saved.ootdPosts ? saved.ootdPosts : JSON.parse(JSON.stringify(defaultOotdPosts)));
  const notifications = ref(saved && saved.notifications ? saved.notifications : JSON.parse(JSON.stringify(defaultNotifications)));
  const sosPosts = ref(saved && saved.sosPosts ? saved.sosPosts : JSON.parse(JSON.stringify(defaultSosPosts)));
  const outfitSuggestions = ref((saved && saved.outfitSuggestions) || []);

  // Toast state
  const toastMessage = ref('');
  const toastVisible = ref(false);
  let toastTimer = null;

  const showToast = (message) => {
    toastMessage.value = message;
    toastVisible.value = true;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastVisible.value = false;
    }, 2200);
  };

  // Modals visibility state
  const isItemFormOpen = ref(false);
  const editingItemId = ref(null);
  const isDetailOpen = ref(false);
  const selectedItemId = ref(null);

  const isOotdFormOpen = ref(false);
  const isSosFormOpen = ref(false);
  const isSuggestionFormOpen = ref(false);
  const activeSosId = ref(null);

  const isProfileEditOpen = ref(false);
  const isCommentOpen = ref(false);
  const activeCommentPostId = ref(null);
  const isNotificationOpen = ref(false);

  // Persistence watcher
  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: items.value,
        profile: profile.value,
        ootdPosts: ootdPosts.value,
        notifications: notifications.value,
        sosPosts: sosPosts.value,
        outfitSuggestions: outfitSuggestions.value
      }));
    } catch (e) {
      /* ignore */
    }
  };

  watch(
    [items, profile, ootdPosts, notifications, sosPosts, outfitSuggestions],
    () => {
      saveState();
    },
    { deep: true }
  );

  const addNotification = (text, target = 'profile') => {
    notifications.value.unshift({
      id: `notification-${Date.now()}`,
      text,
      time: '剛剛',
      read: false,
      target
    });
  };

  return {
    items,
    profile,
    ootdPosts,
    notifications,
    sosPosts,
    outfitSuggestions,
    toastMessage,
    toastVisible,
    showToast,
    // Modals
    isItemFormOpen,
    editingItemId,
    isDetailOpen,
    selectedItemId,
    isOotdFormOpen,
    isSosFormOpen,
    isSuggestionFormOpen,
    activeSosId,
    isProfileEditOpen,
    isCommentOpen,
    activeCommentPostId,
    isNotificationOpen,
    addNotification
  };
});
