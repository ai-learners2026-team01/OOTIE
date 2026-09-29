import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ProfileView from '../ProfileView.vue';
import ProfileEditModal from '@/components/modal/ProfileEditModal.vue';
import OotdFormModal from '@/components/modal/OotdFormModal.vue';
import OotdDetailView from '../OotdDetailView.vue';
import { useAppStore } from '@/stores/app';
import { useOotdStore } from '@/stores/ootd';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/profile', component: ProfileView },
    { path: '/ootd/:id', component: OotdDetailView }
  ]
});

describe('Profile & OOTD Integration Tests (legacy/sinsin features)', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();

    const appStore = useAppStore();
    // Add an initial user post for @hayley
    appStore.ootdPosts.unshift({
      id: 'post-hayley-1',
      username: '@hayley',
      user_id: 'user-01',
      initials: 'HL',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b',
      caption: 'Hayley 的首篇穿搭測試',
      wearing: ['經典襯衫', '牛仔褲'],
      hashtags: ['#hayley', '#ootd'],
      likes: 12,
      comments: 3,
      created_at: '2026-09-25T10:00:00.000Z'
    });

    router.push('/profile');
    await router.isReady();
  });

  it('1. Profile Information & Avatar Upload/Crop Integration', async () => {
    const appStore = useAppStore();

    const viewWrapper = mount(ProfileView, {
      global: { plugins: [router] }
    });
    const modalWrapper = mount(ProfileEditModal);

    // Initial state check: no avatar image, shows initials
    expect(viewWrapper.find('.profile-avatar').text()).toBe('HL');
    expect(viewWrapper.find('.profile-avatar img').exists()).toBe(false);

    // Click "編輯資料" button
    await viewWrapper.find('.profile-actions button.secondary').trigger('click');
    expect(appStore.isProfileEditOpen).toBe(true);

    // Update form fields in ProfileEditModal
    const nameInput = modalWrapper.find('#editProfileName');
    await nameInput.setValue('Hayley Lin Updated');

    const usernameInput = modalWrapper.find('#editProfileUsername');
    await usernameInput.setValue('hayley_new');

    const bioInput = modalWrapper.find('#editProfileBio');
    await bioInput.setValue('新的個人簡介與穿搭靈感。');

    // Simulate avatar file selection
    const avatarInput = modalWrapper.find('#avatarUploadFile');
    const dummyFile = new File(['dummy content'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(avatarInput.element, 'files', {
      value: [dummyFile]
    });

    // Mock FileReader behavior for testing
    const originalFileReader = window.FileReader;
    window.FileReader = class MockFileReader {
      readAsDataURL() {
        this.onload({ target: { result: 'data:image/jpeg;base64,mockcroppedavatar' } });
      }
    };

    await avatarInput.trigger('change');
    await modalWrapper.vm.$nextTick();

    // Check crop controls are displayed
    expect(modalWrapper.find('.avatar-crop-controls').exists()).toBe(true);

    // Submit form
    await modalWrapper.find('form').trigger('submit.prevent');
    await viewWrapper.vm.$nextTick();

    // Restore FileReader
    window.FileReader = originalFileReader;

    // Verify Profile Store state
    expect(appStore.profile.name).toBe('Hayley Lin Updated');
    expect(appStore.profile.username).toBe('@hayley_new');
    expect(appStore.profile.bio).toBe('新的個人簡介與穿搭靈感。');
    expect(appStore.profile.avatar_url).toBe('data:image/jpeg;base64,mockcroppedavatar');

    // Verify View updates with image avatar
    expect(viewWrapper.find('.profile-avatar img').exists()).toBe(true);
    expect(viewWrapper.find('.profile-avatar img').attributes('src')).toBe(appStore.profile.avatar_url);
  });

  it('2. Public Closet Toggle Integration', async () => {
    const appStore = useAppStore();
    const wrapper = mount(ProfileView, {
      global: { plugins: [router] }
    });

    const initialStatus = appStore.profile.public_closet;
    const switchBtn = wrapper.find('.switch');

    await switchBtn.trigger('click');
    expect(appStore.profile.public_closet).toBe(!initialStatus);
    expect(appStore.toastMessage).toBe(appStore.profile.public_closet ? '衣櫥已公開' : '衣櫥已設為私人');

    await switchBtn.trigger('click');
    expect(appStore.profile.public_closet).toBe(initialStatus);
  });

  it('3. OOTD Create, Edit, Delete Lifecycle Integration', async () => {
    const appStore = useAppStore();
    const ootdStore = useOotdStore();

    const viewWrapper = mount(ProfileView, {
      global: { plugins: [router] }
    });
    const formModalWrapper = mount(OotdFormModal);

    // Initial user posts count
    const initialUserPostsCount = viewWrapper.findAll('.ootd-card').length;
    expect(initialUserPostsCount).toBeGreaterThan(0);

    // 3a. Create new OOTD post
    await viewWrapper.find('.profile-actions button.primary').trigger('click');
    expect(appStore.isOotdFormOpen).toBe(true);
    expect(ootdStore.editingPostId).toBeNull();

    // Fill in OOTD form
    const photoInput = formModalWrapper.find('#ootdPhotoFile');
    const photoFile = new File(['photo'], 'ootd.jpg', { type: 'image/jpeg' });
    Object.defineProperty(photoInput.element, 'files', { value: [photoFile] });

    const originalFileReader = window.FileReader;
    window.FileReader = class MockFileReader {
      readAsDataURL() {
        this.onload({ target: { result: 'data:image/jpeg;base64,mockootdphoto' } });
      }
    };

    await photoInput.trigger('change');
    await formModalWrapper.vm.$nextTick();

    await formModalWrapper.find('#ootdCaption').setValue('整合測試新發布 OOTD');
    await formModalWrapper.find('#ootdHashtags').setValue('#integration #test');

    await formModalWrapper.find('form').trigger('submit.prevent');
    await viewWrapper.vm.$nextTick();

    window.FileReader = originalFileReader;

    // Verify card added to ProfileView
    const newCards = viewWrapper.findAll('.ootd-card');
    expect(newCards.length).toBe(initialUserPostsCount + 1);
    expect(viewWrapper.text()).toContain('整合測試新發布 OOTD');
    expect(viewWrapper.text()).toContain('#integration　#test');

    // 3b. Edit OOTD post
    const createdPost = appStore.ootdPosts[0];
    const cardActions = newCards[0].findAll('.ootd-action');
    const cardEditBtn = cardActions.find((b) => b.text() === '編輯');

    await cardEditBtn.trigger('click');
    expect(appStore.isOotdFormOpen).toBe(true);
    expect(ootdStore.editingPostId).toBe(createdPost.id);

    // Update caption in modal
    await formModalWrapper.find('#ootdCaption').setValue('修改後的整合測試 Caption');
    await formModalWrapper.find('form').trigger('submit.prevent');
    await viewWrapper.vm.$nextTick();

    expect(createdPost.caption).toBe('修改後的整合測試 Caption');
    expect(viewWrapper.text()).toContain('修改後的整合測試 Caption');

    // 3c. Delete OOTD post
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const cardDeleteBtn = newCards[0].findAll('.ootd-action').find((b) => b.text() === '刪除');

    await cardDeleteBtn.trigger('click');
    await viewWrapper.vm.$nextTick();

    expect(confirmSpy).toHaveBeenCalled();
    expect(viewWrapper.findAll('.ootd-card').length).toBe(initialUserPostsCount);
    expect(viewWrapper.text()).not.toContain('修改後的整合測試 Caption');
    confirmSpy.mockRestore();
  });

  it('shows the full uploaded OOTD photo in the pre-publish preview', async () => {
    const appStore = useAppStore();
    appStore.isOotdFormOpen = true;
    const formModalWrapper = mount(OotdFormModal);
    const photoInput = formModalWrapper.find('#ootdPhotoFile');
    const photoFile = new File(['photo'], 'ootd.jpg', { type: 'image/jpeg' });
    Object.defineProperty(photoInput.element, 'files', { value: [photoFile] });

    const originalFileReader = window.FileReader;
    window.FileReader = class MockFileReader {
      readAsDataURL() {
        this.onload({ target: { result: 'data:image/jpeg;base64,fullphoto' } });
      }
    };

    try {
      await photoInput.trigger('change');
      const preview = formModalWrapper.find('.ootd-upload-preview');

      expect(preview.classes()).toContain('visible');
      expect(preview.attributes('src')).toBe('data:image/jpeg;base64,fullphoto');
      expect(preview.element.style.objectFit).toBe('contain');
    } finally {
      window.FileReader = originalFileReader;
    }
  });

  it('4. OOTD Share Link Integration', async () => {
    const ootdStore = useOotdStore();
    const shareSpy = vi.spyOn(ootdStore, 'sharePost');

    const wrapper = mount(ProfileView, {
      global: { plugins: [router] }
    });

    const firstCard = wrapper.find('.ootd-card');
    expect(firstCard.exists()).toBe(true);

    const firstCardActions = firstCard.findAll('.ootd-action');
    const shareBtn = firstCardActions.find((b) => b.text() === '分享連結');

    await shareBtn.trigger('click');
    expect(shareSpy).toHaveBeenCalled();
  });

  it('5. OOTD Single Detail Page Route Integration', async () => {
    const appStore = useAppStore();
    const testPost = appStore.ootdPosts[0];

    await router.push(`/ootd/${testPost.id}`);
    await router.isReady();

    const wrapper = mount(OotdDetailView, {
      global: {
        plugins: [router]
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('OOTD 分享');
    expect(wrapper.text()).toContain(testPost.caption);
    expect(wrapper.find('.ootd-photo').attributes('src')).toBe(testPost.image);
  });
});
