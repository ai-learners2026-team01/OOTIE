import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import OotdFormModal from '../OotdFormModal.vue';
import { useAppStore } from '@/stores/app';
import { useClosetStore } from '@/stores/closet';

describe('OotdFormModal.vue Component Test', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders modal when isOotdFormOpen is true and enforces photo requirement before adding an item', async () => {
    const appStore = useAppStore();
    const closetStore = useClosetStore();
    appStore.isOotdFormOpen = true;

    const wrapper = mount(OotdFormModal);
    expect(wrapper.find('.modal.ootd-form-modal').exists()).toBe(true);

    const initialItemCount = appStore.items.length;

    // Toggle quick add section
    const addTagBtn = wrapper.find('.btn-add-tag-item');
    expect(addTagBtn.exists()).toBe(true);
    await addTagBtn.trigger('click');

    expect(wrapper.find('.quick-add-item-box').exists()).toBe(true);

    // 1. Try to add when no photo is provided -> should be blocked
    const input = wrapper.find('.quick-input');
    await input.setValue('未附照片之單品');

    const submitAddBtn = wrapper.find('.quick-add-btn');
    await submitAddBtn.trigger('click');

    expect(appStore.items.length).toBe(initialItemCount);
    expect(appStore.toastMessage).toContain('請先上傳 OOTD 照片');

    // 2. Simulate OOTD photo upload
    const fileInput = wrapper.find('#ootdPhotoFile');
    const dummyFile = new File(['mock content'], 'test.png', { type: 'image/png' });
    Object.defineProperty(fileInput.element, 'files', {
      value: [dummyFile]
    });
    const originalFileReader = window.FileReader;
    window.FileReader = class MockFileReader {
      readAsDataURL() {
        this.onload({ target: { result: 'data:image/png;base64,mockootdphoto' } });
      }
    };
    await fileInput.trigger('change');
    window.FileReader = originalFileReader;

    // 3. Now add item with OOTD photo enabled
    await input.setValue('測試夏日洋裝');
    const select = wrapper.find('.quick-select');
    await select.setValue('Dress');
    await submitAddBtn.trigger('click');

    // Verify item was added to store items
    expect(appStore.items.length).toBe(initialItemCount + 1);
    const addedItem = appStore.items[0];
    expect(addedItem.name).toBe('測試夏日洋裝');
    expect(addedItem.category).toBe('Dress');
    expect(addedItem.photo).toBe('data:image/png;base64,mockootdphoto');

    // Verify item is NOT in disused items
    expect(closetStore.isDisusedItem(addedItem)).toBe(false);

    // Verify the newly created item is automatically checked
    const checkedBox = wrapper.find(`input[type="checkbox"][value="${addedItem.id}"]`);
    expect(checkedBox.exists()).toBe(true);
    expect(checkedBox.element.checked).toBe(true);

    // 4. Test remove item button
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const removeBtn = wrapper.findAll('.tag-item-remove-btn')[0];
    await removeBtn.trigger('click');

    expect(confirmSpy).toHaveBeenCalled();
    expect(appStore.items.length).toBe(initialItemCount);
  });
});
