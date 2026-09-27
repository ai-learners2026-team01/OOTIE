import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../app';
import { useSosStore } from '../sos';
import SosView from '@/views/SosView.vue';
import SosFormModal from '@/components/modal/SosFormModal.vue';
import SosDetailModal from '@/components/modal/SosDetailModal.vue';
import SuggestionModal from '@/components/modal/SuggestionModal.vue';

const remote = vi.hoisted(() => ({
  fetchSosPosts: vi.fn().mockResolvedValue([]),
  fetchSuggestions: vi.fn().mockResolvedValue([]),
  insertSosPost: vi.fn().mockResolvedValue(true),
  insertSuggestion: vi.fn().mockResolvedValue(true),
  updateStatus: vi.fn().mockResolvedValue(true),
  updateAdoptedSuggestion: vi.fn().mockResolvedValue(true),
  fetchProfileAvatar: vi.fn().mockResolvedValue(null),
  syncProfileAvatar: vi.fn().mockResolvedValue(true)
}));

vi.mock('@/services/supabase', () => ({
  fetchSosPostsFromSupabase: remote.fetchSosPosts,
  fetchOutfitSuggestionsFromSupabase: remote.fetchSuggestions,
  insertSosPostToSupabase: remote.insertSosPost,
  insertOutfitSuggestionToSupabase: remote.insertSuggestion,
  updateSosStatusInSupabase: remote.updateStatus,
  updateAdoptedSuggestionInSupabase: remote.updateAdoptedSuggestion,
  fetchProfileAvatar: remote.fetchProfileAvatar,
  syncProfileAvatar: remote.syncProfileAvatar
}));

const ownItem = { id: 'item-01', owner_id: 'profile-01', name: 'Own item', name_zh: '本人衣物', photo: '' };
const foreignItem = { id: 'item-02', owner_id: 'profile-02', name: 'Foreign item', name_zh: '他人衣物', photo: '' };

const makeSos = (overrides = {}) => ({
  id: 'sos-test',
  sender_id: 'profile-02',
  closet_owner_id: 'profile-02',
  username: '@other',
  initials: 'OT',
  title: 'Test SOS',
  occasion: '約會',
  weather: '晴天',
  when_label: '明天',
  vibes: [],
  closet_item_ids: ['item-02'],
  details: '',
  status: 'OPEN',
  adopted_suggestion_id: null,
  liked_suggestion_ids: [],
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides
});

const setPosts = (sosStore, posts) => {
  sosStore.sosPosts.splice(0, sosStore.sosPosts.length, ...posts);
};

describe('SOS Public Clothing', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('returns explicitly listed clothing owned by the SOS sender', () => {
    const sosStore = useSosStore();
    const sos = makeSos({ sender_id: 'profile-01', closet_item_ids: ['item-01'] });

    expect(sosStore.getPublicItemsForSos?.(sos, [ownItem])).toEqual([ownItem]);
  });

  it('filters SOS posts by search query', () => {
    const sosStore = useSosStore();

    sosStore.searchQuery = '約會';
    expect(sosStore.filteredSosPosts.every((post) => post.title.includes('約會') || post.occasion.includes('約會'))).toBe(true);
  });

  it('keeps OPEN and CLOSED posts in Sent SOS while excluding CLOSED posts from Community', () => {
    const sosStore = useSosStore();
    setPosts(sosStore, [
      makeSos({ id: 'own-open', sender_id: 'profile-01', status: 'OPEN' }),
      makeSos({ id: 'own-closed', sender_id: 'profile-01', status: 'CLOSED' }),
      makeSos({ id: 'other-open', sender_id: 'profile-02', status: 'OPEN' }),
      makeSos({ id: 'other-closed', sender_id: 'profile-02', status: 'CLOSED' })
    ]);

    expect(sosStore.sentSosPosts.map((post) => post.id)).toEqual(['own-open', 'own-closed']);
    expect(sosStore.receivedSosPosts.map((post) => post.id)).toEqual(['other-open']);
  });

  it('excludes a listed item owned by someone other than the SOS sender', () => {
    const sosStore = useSosStore();

    expect(sosStore.getPublicItemsForSos?.(makeSos({ closet_item_ids: ['item-01'] }), [ownItem])).toEqual([]);
  });

  it('returns no public clothing for an empty closet_item_ids array', () => {
    const sosStore = useSosStore();

    expect(sosStore.getPublicItemsForSos?.(makeSos({ closet_item_ids: [] }), [ownItem, foreignItem])).toEqual([]);
  });

  it('returns no public clothing when closet_item_ids is missing or undefined', () => {
    const sosStore = useSosStore();
    const missingIds = makeSos();
    delete missingIds.closet_item_ids;

    expect(sosStore.getPublicItemsForSos?.(missingIds, [foreignItem])).toEqual([]);
    expect(sosStore.getPublicItemsForSos?.(makeSos({ closet_item_ids: undefined }), [foreignItem])).toEqual([]);
    expect(sosStore.getPublicItemsForSos?.(makeSos({ closet_item_ids: null }), [foreignItem])).toEqual([]);
  });

  it('keeps only existing listed items owned by the SOS sender', () => {
    const sosStore = useSosStore();
    const items = [
      { ...foreignItem, id: 'valid-item' },
      { ...ownItem, id: 'foreign-item' }
    ];

    expect(sosStore.getPublicItemsForSos?.(
      makeSos({ closet_item_ids: ['valid-item', 'foreign-item', 'missing-item'] }),
      items
    )).toEqual([{ ...foreignItem, id: 'valid-item' }]);
  });

  it('does not fabricate clothing for a CLOSED historical SOS with unknown IDs', () => {
    const sosStore = useSosStore();

    expect(sosStore.getPublicItemsForSos?.(
      makeSos({ status: 'CLOSED', closet_item_ids: undefined }),
      [foreignItem]
    )).toEqual([]);
  });

  it('renders only owner-matched clothing on the Community Board', async () => {
    const appStore = useAppStore();
    const sosStore = useSosStore();
    appStore.items = [{ ...foreignItem, id: 'public-item' }, { ...ownItem, id: 'private-item' }];
    setPosts(sosStore, [makeSos({ closet_item_ids: ['public-item', 'private-item'] })]);

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/sos', component: SosView }]
    });
    await router.push('/sos');
    await router.isReady();
    const wrapper = mount(SosView, { global: { plugins: [router] } });

    expect(wrapper.text()).toContain('他人衣物');
    expect(wrapper.text()).not.toContain('本人衣物');
    expect(wrapper.text()).toContain('1 件公開衣物');
    wrapper.unmount();
  });

  it('starts SOS publish with no items selected and only preselects an owned target item', async () => {
    const appStore = useAppStore();
    useSosStore();
    appStore.items = [
      { ...ownItem, id: 'owned-target' },
      { ...foreignItem, id: 'foreign-target' },
      { ...ownItem, id: 'other-owned' }
    ];

    const wrapper = mount(SosFormModal);
    appStore.sosTargetItemId = null;
    appStore.isSosFormOpen = true;
    await nextTick();
    expect(wrapper.findAll('.sos-share-items input:checked')).toHaveLength(0);

    appStore.isSosFormOpen = false;
    appStore.sosTargetItemId = 'owned-target';
    await nextTick();
    appStore.isSosFormOpen = true;
    await nextTick();

    const checked = wrapper.findAll('.sos-share-items input:checked');
    expect(checked).toHaveLength(1);
    expect(checked[0].element.value).toBe('owned-target');
    expect(wrapper.text()).not.toContain('他人衣物');
    wrapper.unmount();
  });

  it('renders no full-closet fallback in the Suggestion Modal for empty public IDs', async () => {
    const appStore = useAppStore();
    const sosStore = useSosStore();
    appStore.items = [{ ...foreignItem }];
    setPosts(sosStore, [makeSos({ closet_item_ids: [] })]);
    appStore.activeSosId = 'sos-test';
    const wrapper = mount(SuggestionModal);
    appStore.isSuggestionFormOpen = true;
    await nextTick();

    expect(wrapper.find('.suggestion-items').exists()).toBe(false);
    expect(wrapper.text()).toContain('0 件衣物單品');
    expect(wrapper.text()).not.toContain('他人衣物');
    wrapper.unmount();
  });

  it('shows only existing owner-matched public items in the Suggestion Modal', async () => {
    const appStore = useAppStore();
    const sosStore = useSosStore();
    appStore.items = [
      { ...foreignItem, id: 'public-item' },
      { ...ownItem, id: 'private-item' }
    ];
    setPosts(sosStore, [makeSos({ closet_item_ids: ['public-item', 'private-item', 'missing-item'] })]);
    appStore.activeSosId = 'sos-test';
    const wrapper = mount(SuggestionModal);
    appStore.isSuggestionFormOpen = true;
    await nextTick();

    expect(wrapper.findAll('.suggestion-items label')).toHaveLength(1);
    expect(wrapper.text()).toContain('他人衣物');
    expect(wrapper.text()).not.toContain('本人衣物');
    wrapper.unmount();
  });

  it('rejects missing or foreign Publish IDs instead of selecting the whole closet', async () => {
    const appStore = useAppStore();
    const sosStore = useSosStore();
    appStore.items = [{ ...ownItem }, { ...foreignItem }];
    setPosts(sosStore, []);

    const missingIdsResult = await sosStore.createSosPost({ title: 'No selection' });
    expect(missingIdsResult).toBe(false);
    expect(sosStore.sosPosts).toHaveLength(0);
    expect(remote.insertSosPost).not.toHaveBeenCalled();

    const foreignOnlyResult = await sosStore.createSosPost({ title: 'Foreign selection', closet_item_ids: ['item-02'] });
    expect(foreignOnlyResult).toBe(false);
    expect(sosStore.sosPosts).toHaveLength(0);
    expect(remote.insertSosPost).not.toHaveBeenCalled();
  });

  it('publishes only valid selected IDs owned by the current profile', async () => {
    const appStore = useAppStore();
    const sosStore = useSosStore();
    appStore.items = [{ ...ownItem }, { ...foreignItem }];
    setPosts(sosStore, []);

    const result = await sosStore.createSosPost({
      title: 'Own item only',
      details: 'Help me style this item',
      vibes: ['Relaxed'],
      closet_item_ids: ['item-01', 'item-02', 'missing-item']
    });

    expect(result).toBe(true);
    expect(sosStore.sosPosts[0].closet_item_ids).toEqual(['item-01']);
    expect(remote.insertSosPost).not.toHaveBeenCalled();
  });

  it('rejects a Suggestion containing an item outside the SOS public scope without side effects', async () => {
    const appStore = useAppStore();
    const sosStore = useSosStore();
    appStore.items = [
      { id: 'public-item', owner_id: 'profile-02', name: 'Public item', photo: '' },
      { id: 'private-item', owner_id: 'profile-01', name: 'Private item', photo: '' },
      { id: 'unlisted-item', owner_id: 'profile-02', name: 'Unlisted item', photo: '' }
    ];
    setPosts(sosStore, [makeSos({ closet_item_ids: ['public-item', 'private-item'] })]);
    sosStore.outfitSuggestions.splice(0);
    appStore.profile.helped = 0;
    const notificationCount = appStore.notifications.length;

    for (const itemId of ['private-item', 'unlisted-item']) {
      const result = await sosStore.submitSuggestion({
        sosId: 'sos-test',
        selectedIds: [itemId],
        message: 'Out of scope'
      });
      expect(result).toBe(false);
    }

    expect(sosStore.sosPosts).toHaveLength(1);
    expect(sosStore.outfitSuggestions).toHaveLength(0);
    expect(appStore.profile.helped).toBe(0);
    expect(appStore.notifications).toHaveLength(notificationCount);
    expect(remote.insertSuggestion).not.toHaveBeenCalled();
  });

  it('still submits an in-scope Suggestion for another user’s OPEN SOS', async () => {
    const appStore = useAppStore();
    const sosStore = useSosStore();
    appStore.items = [{ id: 'public-item', owner_id: 'profile-02', name: 'Public item', photo: '' }];
    setPosts(sosStore, [makeSos({ closet_item_ids: ['public-item'] })]);
    sosStore.outfitSuggestions.splice(0);

    const result = await sosStore.submitSuggestion({
      sosId: 'sos-test',
      selectedIds: ['public-item'],
      message: 'A valid suggestion'
    });

    expect(result).toBe(true);
    expect(sosStore.outfitSuggestions[0].item_ids).toEqual(['public-item']);
    expect(remote.insertSuggestion).not.toHaveBeenCalled();
  });

  it('keeps an SOS OPEN after its owner adopts a Suggestion', async () => {
    const sosStore = useSosStore();
    setPosts(sosStore, [makeSos({ id: 'adopt-sos', sender_id: 'profile-01', status: 'OPEN' })]);
    sosStore.outfitSuggestions.splice(0, sosStore.outfitSuggestions.length, {
      id: 'adopt-suggestion',
      sos_id: 'adopt-sos',
      responder_id: 'profile-02',
      item_ids: ['item-02']
    });

    await sosStore.adoptSuggestion({ sosId: 'adopt-sos', suggestionId: 'adopt-suggestion' });

    expect(sosStore.sosPosts[0].adopted_suggestion_id).toBe('adopt-suggestion');
    expect(sosStore.sosPosts[0].status).toBe('OPEN');
  });

  it('keeps a CLOSED SOS in Sent History after Explicit Close', async () => {
    const sosStore = useSosStore();
    setPosts(sosStore, [makeSos({ id: 'close-sos', sender_id: 'profile-01', status: 'OPEN' })]);

    await sosStore.closeSosPost('close-sos');

    expect(sosStore.sosPosts[0].status).toBe('CLOSED');
    expect(sosStore.sentSosPosts.map((post) => post.id)).toEqual(['close-sos']);
    expect(sosStore.receivedSosPosts).toHaveLength(0);
  });

  it('keeps outfit board clothing inside the SOS public clothing scope', async () => {
    const appStore = useAppStore();
    const sosStore = useSosStore();
    appStore.items = [
      { ...foreignItem, id: 'public-item' },
      { ...ownItem, id: 'private-item' }
    ];
    setPosts(sosStore, [makeSos({ closet_item_ids: ['public-item', 'private-item'] })]);
    sosStore.outfitSuggestions.splice(0, sosStore.outfitSuggestions.length, {
      id: 'suggestion-test',
      sos_id: 'sos-test',
      responder_id: 'profile-01',
      item_ids: ['public-item', 'private-item'],
      message: 'Try this outfit',
      hearts: 0,
      created_at: '2026-01-01T00:00:00.000Z'
    });
    appStore.activeSosDetailId = 'sos-test';
    appStore.isSosDetailOpen = true;

    const wrapper = mount(SosDetailModal);

    expect(wrapper.findAll('.sos-detail-gallery-item')).toHaveLength(1);
    expect(wrapper.findAll('.sos-outfit-piece')).toHaveLength(1);
    expect(wrapper.text()).toContain('他人衣物');
    expect(wrapper.text()).not.toContain('本人衣物');
    wrapper.unmount();
  });
});
