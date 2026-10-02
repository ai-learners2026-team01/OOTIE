import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import {
  STORAGE_KEY,
  defaultItems,
  defaultProfile,
  defaultOotdPosts,
  defaultNotifications,
  defaultSosPosts,
  defaultFollowingUsers
} from '@/constants';
import { fetchProfileAvatar, syncProfileAvatar } from '@/services/supabase';

export const useAppStore = defineStore('app', () => {
  // Load state from localStorage or use defaults (including migration from legacy qingnian keys)
  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : {};

      // Migrate from legacy/qingnian standalone notification storage if present
      const qingnianNotifs = localStorage.getItem('ootie-notifications-v1');
      if (qingnianNotifs && (!state || !state.notifications)) {
        try {
          const parsed = JSON.parse(qingnianNotifs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            state.notifications = parsed;
          }
        } catch (e) {
          /* ignore */
        }
      }

      return Object.keys(state).length > 0 ? state : null;
    } catch (e) {
      return null;
    }
  };

  const saved = loadState();

  const normalizeUsername = (raw) => {
    if (!raw) return '';
    const trimmed = String(raw).trim();
    return trimmed.startsWith('@') ? trimmed.toLowerCase() : `@${trimmed.toLowerCase()}`;
  };

  const items = ref(saved && saved.items ? saved.items : JSON.parse(JSON.stringify(defaultItems)));
  const profile = ref(saved && saved.profile ? saved.profile : JSON.parse(JSON.stringify(defaultProfile)));
  defaultItems.forEach((sampleItem) => {
    const samplePhotoId = String(sampleItem.photo || '').match(/photo-[^/?]+/)?.[0];
    const savedSample = items.value.find((item) =>
      String(item.id) === String(sampleItem.id) && samplePhotoId && String(item.photo || '').includes(samplePhotoId)
    );
    if (!savedSample) return;

    Object.assign(savedSample, {
      name: sampleItem.name,
      name_zh: sampleItem.name_zh,
      brand: sampleItem.brand,
      category: sampleItem.category,
      shape: sampleItem.shape,
      primary_color: sampleItem.primary_color,
      secondary_color: sampleItem.secondary_color,
      color_hex: sampleItem.color_hex,
      style: sampleItem.style,
      season: sampleItem.season
    });

    if (savedSample.virtual_heart_count === undefined) {
      savedSample.virtual_heart_count = Number(sampleItem.virtual_heart_count) || 0;
      savedSample.heart_count = (Number(savedSample.heart_count) || 0) + savedSample.virtual_heart_count;
    } else if (savedSample.heart_count === undefined) {
      savedSample.heart_count = Number(savedSample.virtual_heart_count) || 0;
    }
  });
  profile.value.hearts = items.value.reduce((total, item) => total + (Number(item.heart_count) || 0), 0);
  const ootdPosts = ref(saved && saved.ootdPosts ? saved.ootdPosts : JSON.parse(JSON.stringify(defaultOotdPosts)));
  ootdPosts.value.forEach((post) => {
    const comments = Array.isArray(post.commentList) ? post.commentList : [];
    const demoPost = defaultOotdPosts.find((item) => String(item.id) === String(post.id));
    if (demoPost && comments.length < demoPost.commentList.length) {
      const commentIds = new Set(comments.map((comment) => comment.id));
      const missingDemoComments = demoPost.commentList.filter((comment) => !commentIds.has(comment.id));
      comments.push(...missingDemoComments.slice(0, demoPost.commentList.length - comments.length));
    }
    post.commentList = comments;
    post.comments = comments.length;
  });
  const notifications = ref(saved && saved.notifications ? saved.notifications : JSON.parse(JSON.stringify(defaultNotifications)));
  const sosPosts = ref(saved && saved.sosPosts ? saved.sosPosts : JSON.parse(JSON.stringify(defaultSosPosts)));
  const outfitSuggestions = ref((saved && saved.outfitSuggestions) || []);

  // Following users state
  const initialFollowing = saved && Array.isArray(saved.followingUsers)
    ? saved.followingUsers
    : (defaultFollowingUsers || ['@minji', '@nora', '@jules']);
  const followingUsers = ref(initialFollowing.map(normalizeUsername).filter((u) => u !== normalizeUsername(profile.value.username)));

  // Sidebar collapsed state
  const isSidebarCollapsed = ref(localStorage.getItem('ootie-sidebar-collapsed') === 'true');
  const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
    try {
      localStorage.setItem('ootie-sidebar-collapsed', String(isSidebarCollapsed.value));
    } catch (e) {
      /* ignore */
    }
  };

  const isFollowingUser = (rawUsername) => {
    const user = normalizeUsername(rawUsername);
    if (!user || user === normalizeUsername(profile.value.username)) return false;
    return followingUsers.value.includes(user);
  };

  const setFollowingUser = (rawUsername, shouldFollow) => {
    const user = normalizeUsername(rawUsername);
    if (!user || user === normalizeUsername(profile.value.username)) return false;
    if (shouldFollow) {
      if (!followingUsers.value.includes(user)) {
        followingUsers.value.push(user);
      }
    } else {
      followingUsers.value = followingUsers.value.filter((u) => u !== user);
    }
    // Sync following state across posts
    ootdPosts.value.forEach((post) => {
      if (normalizeUsername(post.username) === user) {
        post.following = shouldFollow;
      }
    });
    return shouldFollow;
  };

  // Try fetching avatar from Supabase if empty or on init
  const loadRemoteAvatar = async () => {
    const remoteAvatar = await fetchProfileAvatar();
    if (remoteAvatar) {
      profile.value.avatar_url = remoteAvatar;
    }
  };

  const syncAvatar = async (avatarUrl) => {
    profile.value.avatar_url = avatarUrl;
    await syncProfileAvatar(avatarUrl);
  };

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
  const sosTargetItemId = ref(null);
  const isSuggestionFormOpen = ref(false);
  const activeSosId = ref(null);
  const isSosDetailOpen = ref(false);
  const activeSosDetailId = ref(null);
  const isSosCloseConfirmOpen = ref(false);
  const sosToCloseId = ref(null);

  const isProfileEditOpen = ref(false);
  const isCommentOpen = ref(false);
  const activeCommentPostId = ref(null);
  const highlightedCommentId = ref(null);
  const isNotificationOpen = ref(false);

  const bookmarkToMove = ref(null);
  const pendingBookmarkRemovalId = ref(null);

  // Persistence watcher
  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: items.value,
        profile: profile.value,
        ootdPosts: ootdPosts.value,
        notifications: notifications.value,
        sosPosts: sosPosts.value,
        outfitSuggestions: outfitSuggestions.value,
        followingUsers: followingUsers.value
      }));
    } catch (e) {
      /* ignore */
    }
  };

  watch(
    [items, profile, ootdPosts, notifications, sosPosts, outfitSuggestions, followingUsers],
    () => {
      saveState();
    },
    { deep: true }
  );

  const addNotification = (text, target = 'profile', options = {}) => {
    notifications.value.unshift({
      id: `notification-${Date.now()}`,
      text,
      time: '剛剛',
      read: false,
      target,
      type: options.type || 'system',
      postId: options.postId,
      commentId: options.commentId,
      sosId: options.sosId,
      userId: options.userId
    });
  };

  return {
    items,
    profile,
    ootdPosts,
    notifications,
    sosPosts,
    outfitSuggestions,
    followingUsers,
    isSidebarCollapsed,
    toggleSidebar,
    normalizeUsername,
    isFollowingUser,
    setFollowingUser,
    loadRemoteAvatar,
    syncAvatar,
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
    sosTargetItemId,
    isSuggestionFormOpen,
    activeSosId,
    isSosDetailOpen,
    activeSosDetailId,
    isSosCloseConfirmOpen,
    sosToCloseId,
    isProfileEditOpen,
    isCommentOpen,
    activeCommentPostId,
    highlightedCommentId,
    isNotificationOpen,
    bookmarkToMove,
    pendingBookmarkRemovalId,

    addNotification
  };
});


