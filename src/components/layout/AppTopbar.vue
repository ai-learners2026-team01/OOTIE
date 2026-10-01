<template>
  <header class="topbar">
    <span class="mobile-brand">OOTie</span>
    <div class="top-actions">
      <button class="icon-button" aria-label="通知" @click="openNotifications">
        ♧
        <span
          v-if="authStore.isLoggedIn && unreadCount > 0"
          class="notification-badge"
        >{{ unreadCount }}</span>
      </button>

      <!-- Auth State Indicator -->
      <button v-if="!authStore.isLoggedIn" class="btn-primary auth-btn-sm" @click="authStore.openAuthModal('login')">
        登入 / 註冊
      </button>

      <div v-else class="avatar-group">
        <div 
          class="avatar is-logged-in" 
          :class="{ 'has-image': appStore.profile.avatar_url }"
          tabindex="0"
          role="button"
          aria-label="會員功能"
          @click="toggleProfileMenu"
          @keydown.enter.prevent="toggleProfileMenu"
          @keydown.space.prevent="toggleProfileMenu"
        >
          <img v-if="appStore.profile.avatar_url" :src="appStore.profile.avatar_url" :alt="`${appStore.profile.name} 的大頭貼`" />
          <template v-else>{{ appStore.profile.initials || 'HL' }}</template>
        </div>
      </div>
    </div>

    <!-- Profile Popover Menu (legacy/qingnian integration) -->
    <div v-if="isProfileMenuOpen" class="popover-backdrop open" @click.self="closeProfileMenu">
      <section class="popover profile-popover">
        <button class="popover-close" aria-label="關閉" @click="closeProfileMenu">×</button>
        <div class="popover-avatar">
          <img v-if="appStore.profile.avatar_url" :src="appStore.profile.avatar_url" :alt="appStore.profile.name" />
          <template v-else>{{ appStore.profile.initials || 'HL' }}</template>
        </div>
        <div class="popover-copy">
          <strong>{{ appStore.profile.name || 'Hayley Lin' }}</strong>
          <span>{{ appStore.profile.username || '@hayley' }}</span>
        </div>
        <div class="popover-stats">
          <div class="popover-stat">
            <strong>{{ appStore.profile.hearts || 0 }}</strong>
            <span>Hearts</span>
          </div>
          <div class="popover-stat">
            <strong>{{ appStore.profile.helped || 0 }}</strong>
            <span>幫助衣友</span>
          </div>
          <div class="popover-stat">
            <strong>{{ appStore.profile.likes || 0 }}</strong>
            <span>獲得讚數</span>
          </div>
        </div>
        <div class="popover-actions">
          <router-link to="/profile" class="btn-primary popover-btn" @click="closeProfileMenu">
            前往個人檔案
          </router-link>
          <button class="btn-secondary popover-btn" @click="handleLogout">
            登出
          </button>
        </div>
      </section>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const appStore = useAppStore();
const authStore = useAuthStore();
const isProfileMenuOpen = ref(false);

const unreadCount = computed(() => {
  if (!authStore.isLoggedIn) return 0;
  return appStore.notifications.filter((n) => !n.read).length;
});

const openNotifications = () => {
  if (!authStore.isLoggedIn) {
    authStore.openAuthModal('login');
    return;
  }
  appStore.notifications.forEach((n) => (n.read = true));
  appStore.isNotificationOpen = true;
};

watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  if (!isLoggedIn) appStore.isNotificationOpen = false;
});

const toggleProfileMenu = () => {
  isProfileMenuOpen.value = !isProfileMenuOpen.value;
};

const closeProfileMenu = () => {
  isProfileMenuOpen.value = false;
};

const handleLogout = async () => {
  closeProfileMenu();
  await authStore.logout();
  appStore.showToast('已登出');
};

onMounted(() => {
  authStore.initAuth();
});
</script>

<style scoped>
.auth-btn-sm {
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 20px;
}

.avatar-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  cursor: pointer;
  transition: transform 0.18s ease;
  user-select: none;
}
.avatar:hover {
  transform: scale(1.08);
}

.popover-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding-top: 60px;
  padding-right: 20px;
}

.profile-popover {
  width: min(320px, calc(100vw - 32px));
  max-height: calc(100dvh - 80px);
  overflow-y: auto;
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  column-gap: 12px;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow);
  padding: 20px;
  position: relative;
  color: var(--ink);
}

.popover-close {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 28px;
  height: 28px;
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--muted);
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.popover-close:hover {
  background: #f0f2ec;
  color: var(--ink);
}
.popover-close:focus-visible {
  outline: 2px solid var(--sage-dark);
  outline-offset: 2px;
}

.popover-avatar {
  grid-column: 1;
  grid-row: 1;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #d9c8b8;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 0;
  overflow: hidden;
  align-self: center;
}
.popover-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.popover-copy {
  display: flex;
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
  margin-bottom: 0;
}
.popover-copy strong,
.popover-copy span {
  max-width: 100%;
  overflow-wrap: anywhere;
}
.popover-copy strong {
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink);
}
.popover-copy span {
  color: var(--muted);
  font-size: 0.8rem;
}

.popover-stats {
  display: grid;
  grid-column: 1 / -1;
  grid-row: 2;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 18px 0 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.popover-stat {
  text-align: center;
  min-width: 0;
}
.popover-stat strong {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ink);
}
.popover-stat span {
  color: var(--muted);
  font-size: 0.72rem;
}

.popover-actions {
  display: flex;
  grid-column: 1 / -1;
  grid-row: 3;
  flex-direction: column;
  gap: 8px;
}

.popover-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 40px;
  box-sizing: border-box;
  text-align: center;
  border-radius: 10px;
  padding: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.popover-actions .popover-btn.btn-primary {
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--white);
}

.popover-actions .popover-btn.btn-primary:hover {
  background: #383838;
}

.popover-actions .popover-btn.btn-secondary {
  border: 1px solid var(--line);
  background: var(--white);
  color: var(--ink);
}

.popover-actions .popover-btn.btn-secondary:hover {
  background: #f0f2ec;
}

@media (max-width: 480px) {
  .popover-backdrop {
    padding-right: 16px;
    padding-left: 16px;
  }

  .profile-popover {
    width: min(320px, calc(100vw - 32px));
    max-height: calc(100dvh - 76px);
  }
}
</style>
