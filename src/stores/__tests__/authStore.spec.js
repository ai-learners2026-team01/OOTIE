import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import { supabase } from '@/services/supabase';

describe('authStore Unit Test', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  afterEach(() => vi.restoreAllMocks());

  it('initializes with default logged-out state', () => {
    const authStore = useAuthStore();
    expect(authStore.isLoggedIn).toBe(false);
    expect(authStore.user).toBeNull();
    expect(authStore.isAuthModalOpen).toBe(false);
    expect(authStore.authMode).toBe('login');
  });

  it('opens and closes auth modal with specific mode', () => {
    const authStore = useAuthStore();

    authStore.openAuthModal('register');
    expect(authStore.isAuthModalOpen).toBe(true);
    expect(authStore.authMode).toBe('register');

    authStore.closeAuthModal();
    expect(authStore.isAuthModalOpen).toBe(false);
  });

  it('requireAuth triggers modal if guest, or executes callback if logged in', () => {
    const authStore = useAuthStore();
    const mockCallback = vi.fn();

    // Guest state
    const resultGuest = authStore.requireAuth(mockCallback);
    expect(resultGuest).toBe(false);
    expect(authStore.isAuthModalOpen).toBe(true);
    expect(mockCallback).not.toHaveBeenCalled();

    // Logged in state
    authStore.user = { id: 'user-01', email: 'test@example.com' };
    const resultUser = authStore.requireAuth(mockCallback);
    expect(resultUser).toBe(true);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('loginWithDemo successfully logs user in and executes pending action', () => {
    const authStore = useAuthStore();
    const pendingAction = vi.fn();

    authStore.openAuthModal('login', pendingAction);
    const success = authStore.loginWithDemo('hayley@example.com', 'Hayley Lin');

    expect(success).toBe(true);
    expect(authStore.isLoggedIn).toBe(true);
    expect(authStore.user.email).toBe('hayley@example.com');
    expect(authStore.user.user_metadata.full_name).toBe('Hayley Lin');
    expect(authStore.isAuthModalOpen).toBe(false);
    expect(pendingAction).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('ootie-auth-state-v1')).toBe('true');
  });

  it('authenticates demo credentials with Supabase and clears any local demo session', async () => {
    const user = { id: 'auth-demo-uuid', email: 'demo@ootie.com', user_metadata: { full_name: 'Demo User' } };
    const session = { access_token: 'supabase-token', user };
    const signIn = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: { user, session }, error: null
    });
    localStorage.setItem('ootie-demo-session-v1', JSON.stringify({ id: 'user-01', email: 'demo@ootie.com' }));
    const authStore = useAuthStore();
    const success = await authStore.login('demo@ootie.com', 'password123');

    expect(success).toBe(true);
    expect(authStore.isLoggedIn).toBe(true);
    expect(authStore.user.id).toBe('auth-demo-uuid');
    expect(authStore.session).toEqual(session);
    expect(authStore.isDemo).toBe(false);
    expect(localStorage.getItem('ootie-demo-session-v1')).toBeNull();
    expect(signIn).toHaveBeenCalledWith({ email: 'demo@ootie.com', password: 'password123' });
  });

  it('does not restore a persisted fake demo identity after reload', async () => {
    localStorage.setItem('ootie-demo-session-v1', JSON.stringify({ id: 'user-01', email: 'demo@ootie.com' }));
    const getSession = vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null }, error: null
    });
    const authStore = useAuthStore();

    await authStore.initAuth();

    expect(getSession).toHaveBeenCalledOnce();
    expect(authStore.user).toBeNull();
    expect(authStore.session).toBeNull();
    expect(localStorage.getItem('ootie-demo-session-v1')).toBeNull();
  });

  it('logout resets user state and clears session', async () => {
    const authStore = useAuthStore();
    authStore.loginWithDemo();
    expect(authStore.isLoggedIn).toBe(true);

    await authStore.logout();
    expect(authStore.isLoggedIn).toBe(false);
    expect(authStore.user).toBeNull();
    expect(authStore.session).toBeNull();
    expect(localStorage.getItem('ootie-auth-state-v1')).toBeNull();
  });
});
