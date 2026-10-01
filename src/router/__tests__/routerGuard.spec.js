import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import router from '../index';
import { useAuthStore } from '@/stores/auth';

describe('Router Guest Protection Guard', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    await router.push('/explore');
  });

  it('allows guest to access /explore without login', async () => {
    await router.push('/explore');
    expect(router.currentRoute.value.path).toBe('/explore');
  });

  it('allows guests to open another profile and its public closet by username', async () => {
    await router.push({ path: '/profile', query: { user: '@minji' } });
    expect(router.currentRoute.value.path).toBe('/profile');
    expect(router.currentRoute.value.query.user).toBe('@minji');

    await router.push({ path: '/closet', query: { user: '@minji' } });
    expect(router.currentRoute.value.path).toBe('/closet');
    expect(router.currentRoute.value.query.user).toBe('@minji');
  });

  it('redirects unauthenticated guest from /closet to /explore and opens auth modal', async () => {
    const authStore = useAuthStore();
    expect(authStore.isLoggedIn).toBe(false);

    await router.push('/closet');

    expect(router.currentRoute.value.path).toBe('/explore');
    expect(authStore.isAuthModalOpen).toBe(true);
  });

  it('redirects unauthenticated guest from / to /explore and opens auth modal', async () => {
    const authStore = useAuthStore();
    expect(authStore.isLoggedIn).toBe(false);

    await router.push('/');

    expect(router.currentRoute.value.path).toBe('/explore');
    expect(authStore.isAuthModalOpen).toBe(true);
  });

  it('allows authenticated user to visit protected routes like /closet and /profile', async () => {
    const authStore = useAuthStore();
    authStore.user = { id: 'user-01', email: 'test@example.com' };
    expect(authStore.isLoggedIn).toBe(true);

    await router.push('/closet');
    expect(router.currentRoute.value.path).toBe('/closet');

    await router.push('/profile');
    expect(router.currentRoute.value.path).toBe('/profile');
  });
});
