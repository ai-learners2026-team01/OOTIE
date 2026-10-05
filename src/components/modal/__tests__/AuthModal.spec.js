import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import AuthModal from '../AuthModal.vue';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import { supabase } from '@/services/supabase';

describe('AuthModal.vue Component Test', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  afterEach(() => vi.restoreAllMocks());

  it('does not render when isAuthModalOpen is false', () => {
    const authStore = useAuthStore();
    authStore.isAuthModalOpen = false;

    const wrapper = mount(AuthModal);
    expect(wrapper.find('.modal-backdrop').exists()).toBe(false);
  });

  it('renders modal and switches between login and register tabs', async () => {
    const authStore = useAuthStore();
    authStore.openAuthModal('login');

    const wrapper = mount(AuthModal);
    expect(wrapper.find('.modal-backdrop').exists()).toBe(true);
    expect(wrapper.find('h2').text()).toBe('歡迎回到 OOTie');

    // Switch to register tab
    const registerTab = wrapper.findAll('.auth-tab')[1];
    await registerTab.trigger('click');

    expect(authStore.authMode).toBe('register');
    expect(wrapper.find('h2').text()).toBe('加入 OOTie 社群');
    expect(wrapper.find('#authFullName').exists()).toBe(true);
  });

  it('fills demo account when clicking quick demo button', async () => {
    const authStore = useAuthStore();
    authStore.openAuthModal('login');

    const wrapper = mount(AuthModal);
    const demoBtn = wrapper.find('.btn-quick-demo');
    await demoBtn.trigger('click');

    const emailInput = wrapper.find('#authEmail');
    const pwdInput = wrapper.find('#authPassword');

    expect(emailInput.element.value).toBe('demo@ootie.com');
    expect(pwdInput.element.value).toBe('password123');
  });

  it('toggles password visibility when show/hide button clicked', async () => {
    const authStore = useAuthStore();
    authStore.openAuthModal('login');

    const wrapper = mount(AuthModal);
    const pwdInput = wrapper.find('#authPassword');
    expect(pwdInput.attributes('type')).toBe('password');

    const toggleBtn = wrapper.find('.btn-toggle-pwd');
    await toggleBtn.trigger('click');

    expect(pwdInput.attributes('type')).toBe('text');
  });

  it('successfully logs in with demo credentials and updates app profile', async () => {
    const authStore = useAuthStore();
    const appStore = useAppStore();
    const user = { id: 'auth-demo-uuid', email: 'demo@ootie.com', user_metadata: { full_name: 'Demo User' } };
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: { user, session: { access_token: 'supabase-token', user } }, error: null
    });
    authStore.openAuthModal('login');

    const wrapper = mount(AuthModal);
    const demoBtn = wrapper.find('.btn-quick-demo');
    await demoBtn.trigger('click');

    await wrapper.find('form').trigger('submit.prevent');

    expect(authStore.isLoggedIn).toBe(true);
    expect(authStore.isAuthModalOpen).toBe(false);
  });
});
