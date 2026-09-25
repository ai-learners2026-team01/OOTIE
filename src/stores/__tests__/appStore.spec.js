import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../app';

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('should initialize with default state', () => {
    const store = useAppStore();
    expect(store.items.length).toBeGreaterThan(0);
    expect(store.profile.username).toBe('@hayley');
    expect(store.notifications.length).toBeGreaterThan(0);
    expect(store.toastVisible).toBe(false);
  });

  it('should handle toast messages and auto-hide', () => {
    const store = useAppStore();
    store.showToast('Test Toast Notification');

    expect(store.toastMessage).toBe('Test Toast Notification');
    expect(store.toastVisible).toBe(true);

    vi.advanceTimersByTime(2300);
    expect(store.toastVisible).toBe(false);
  });

  it('should add notifications correctly', () => {
    const store = useAppStore();
    const initialCount = store.notifications.length;

    store.addNotification('Someone liked your outfit', 'explore');

    expect(store.notifications.length).toBe(initialCount + 1);
    expect(store.notifications[0].text).toBe('Someone liked your outfit');
    expect(store.notifications[0].read).toBe(false);
    expect(store.notifications[0].target).toBe('explore');
  });

  it('should toggle modal visibility states', () => {
    const store = useAppStore();

    expect(store.isItemFormOpen).toBe(false);
    store.isItemFormOpen = true;
    expect(store.isItemFormOpen).toBe(true);

    expect(store.isDetailOpen).toBe(false);
    store.selectedItemId = '1';
    store.isDetailOpen = true;
    expect(store.isDetailOpen).toBe(true);
    expect(store.selectedItemId).toBe('1');
  });
});
