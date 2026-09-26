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

  // Initialize Auth state from Supabase
  const initAuth = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      session.value = data.session;
      user.value = data.session?.user || null;

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
        errorMsg.value = error.message || '登入失敗，請檢查 Email 與密碼';
        return false;
      }

      user.value = data.user;
      session.value = data.session;

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
        errorMsg.value = error.message || '註冊失敗，請重試';
        return false;
      }

      if (data.user) {
        user.value = data.user;
        session.value = data.session;
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
    }
  };

  return {
    user,
    session,
    isLoggedIn,
    isAuthModalOpen,
    authMode,
    loading,
    errorMsg,
    initAuth,
    openAuthModal,
    closeAuthModal,
    requireAuth,
    login,
    register,
    logout
  };
});
