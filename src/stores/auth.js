import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/services/supabase';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const session = ref(null);
  const isAuthModalOpen = ref(false);
  const authMode = ref('login'); // 'login' | 'register'
  const pendingAction = ref(null);
  const loading = ref(false);
  const errorMsg = ref('');

  const isLoggedIn = computed(() => !!user.value);
  const isDemo = computed(() => {
    return Boolean(user.value?.id === 'user-01' || localStorage.getItem('ootie-demo-session-v1'));
  });

  // Only a Supabase Auth session represents an authenticated identity.
  const initAuth = async () => {
    if (user.value) return;
    try {
      localStorage.removeItem('ootie-demo-session-v1');
    } catch (e) {
      /* ignore */
    }
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        session.value = data.session;
        user.value = data.session.user;
        return;
      }

      supabase.auth.onAuthStateChange((_event, currentSession) => {
        session.value = currentSession;
        user.value = currentSession?.user || null;
      });
    } catch (err) {
      console.error('Auth initialization error:', err);
    }
  };

  const openAuthModal = (mode = 'login', onAuthenticatedCallback = null) => {
    authMode.value = mode;
    errorMsg.value = '';
    pendingAction.value = onAuthenticatedCallback;
    isAuthModalOpen.value = true;
  };

  const closeAuthModal = () => {
    isAuthModalOpen.value = false;
    errorMsg.value = '';
    pendingAction.value = null;
  };

  /**
   * Guest-First Guard: Executes callback if logged in, otherwise opens Auth Modal.
   */
  const requireAuth = (callback) => {
    if (isLoggedIn.value) {
      if (typeof callback === 'function') callback();
      return true;
    } else {
      openAuthModal('login', callback);
      return false;
    }
  };

  const login = async (email, password) => {
    loading.value = true;
    errorMsg.value = '';
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          errorMsg.value = '無法連線至雲端認證服務，請檢查網路連線後再試。';
        } else {
          errorMsg.value = error.message || '登入失敗，請檢查 Email 與密碼';
        }
        return false;
      }

      user.value = data.user;
      session.value = data.session;
      try {
        localStorage.setItem('ootie-auth-state-v1', 'true');
        localStorage.removeItem('ootie-demo-session-v1');
      } catch (e) {
        /* ignore */
      }

      // Execute pending action if any
      if (pendingAction.value && typeof pendingAction.value === 'function') {
        const action = pendingAction.value;
        pendingAction.value = null;
        action();
      }

      closeAuthModal();
      return true;
    } catch (err) {
      errorMsg.value = err.message || '登入發生錯誤';
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fast Demo / Local Test Login
   */
  const loginWithDemo = (email = 'hayley@example.com', fullName = 'Hayley Lin') => {
    loading.value = false;
    errorMsg.value = '';
    user.value = {
      id: 'user-01',
      email,
      user_metadata: {
        full_name: fullName
      }
    };
    session.value = {
      access_token: 'demo-access-token',
      user: user.value
    };

    try {
      localStorage.setItem('ootie-auth-state-v1', 'true');
      localStorage.setItem('ootie-demo-session-v1', JSON.stringify(user.value));
    } catch (e) {
      /* ignore */
    }

    if (pendingAction.value && typeof pendingAction.value === 'function') {
      const action = pendingAction.value;
      pendingAction.value = null;
      action();
    }

    closeAuthModal();
    return true;
  };

  const register = async (email, password, fullName = '') => {
    loading.value = true;
    errorMsg.value = '';
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          errorMsg.value = '無法連線至雲端認證服務，請稍後再試。';
        } else {
          errorMsg.value = error.message || '註冊失敗，請重試';
        }
        return false;
      }

      if (data.user) {
        user.value = data.user;
        session.value = data.session;
        try {
          localStorage.setItem('ootie-auth-state-v1', 'true');
        } catch (e) {
          /* ignore */
        }
      }

      if (pendingAction.value && typeof pendingAction.value === 'function') {
        const action = pendingAction.value;
        pendingAction.value = null;
        action();
      }

      closeAuthModal();
      return true;
    } catch (err) {
      errorMsg.value = err.message || '註冊發生錯誤';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      user.value = null;
      session.value = null;
      try {
        localStorage.removeItem('ootie-auth-state-v1');
        localStorage.removeItem('ootie-demo-session-v1');
      } catch (e) {
        /* ignore */
      }
    }
  };

  return {
    user,
    session,
    isLoggedIn,
    isDemo,
    isAuthModalOpen,
    authMode,
    loading,
    errorMsg,
    initAuth,
    openAuthModal,
    closeAuthModal,
    requireAuth,
    login,
    loginWithDemo,
    register,
    logout
  };
});
