import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia, disposePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { useAppStore } from '../app';
import { useSosStore } from '../sos';
import SosView from '@/views/SosView.vue';
import SosFormModal from '@/components/modal/SosFormModal.vue';
import SosDetailModal from '@/components/modal/SosDetailModal.vue';
import SuggestionModal from '@/components/modal/SuggestionModal.vue';
import SosClothingImage from '@/features/sos/components/SosClothingImage.vue';

let pinia;
const wrappers = [];
beforeEach(() => {
  localStorage.clear(); window.history.replaceState({}, '', '/sos?sos_mode=fixture');
  pinia = createPinia(); setActivePinia(pinia);
});
afterEach(() => { wrappers.splice(0).forEach(w => w.unmount()); disposePinia(pinia); vi.restoreAllMocks(); });
async function page(url = '/sos?sos_mode=fixture') {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/sos', component: SosView }, { path: '/closet', component: { template: '<div>衣櫃</div>' } }] });
  await router.push(url); await router.isReady();
  const wrapper = mount(SosView, { global: { plugins: [router] }, attachTo: document.body });
  wrappers.push(wrapper); await flushPromises();
  return { wrapper, router, sos: useSosStore(), app: useAppStore() };
}

it('consumes a Closet target once, preselects only that owned item, and clears it on the next open', async () => {
  const { router, sos, app } = await page('/sos?sos_mode=fixture&item_id=fixture-a-shirt');
  const modal = mount(SosFormModal); wrappers.push(modal); await nextTick();
  expect(router.currentRoute.value.query.item_id).toBeUndefined();
  expect(modal.findAll('.sos-share-items input:checked').map(e => e.element.value)).toEqual(['fixture-a-shirt']);
  modal.find('[aria-label="關閉視窗"]').trigger('click'); await nextTick();
  expect(app.sosTargetItemId).toBeNull();
  app.isSosFormOpen = true; await nextTick();
  expect(modal.findAll('.sos-share-items input:checked')).toHaveLength(0);
  expect(sos.ownedClosetItems).toHaveLength(6);
});

it('does not pass the publish click MouseEvent as a target item', async () => {
  const { wrapper, app } = await page();
  await wrapper.get('[data-testid="sos-publish"]').trigger('click');
  expect(app.sosTargetItemId).toBeNull();
  expect(app.isSosFormOpen).toBe(true);
});

it('prevents duplicate suggestions in the UI and still allows viewing the existing detail', async () => {
  const { sos, app, wrapper } = await page();
  const post = sos.receivedSosPosts[0];
  await sos.submitSuggestion({ sosId: post.id, selectedIds: [post.closet_item_ids[0]], message: '試試這套' });
  app.activeSosId = post.id; app.isSuggestionFormOpen = true;
  const modal = mount(SuggestionModal); wrappers.push(modal); await nextTick();
  expect(modal.get('button[type="submit"]').element.disabled).toBe(true);
  expect(modal.text()).toContain('你已提供搭配建議');
  expect(wrapper.text()).toContain('已提供建議');
});

it('renders SOS comments as text, keeps OOTD untouched, and disables commenting after close', async () => {
  const { sos, app, router } = await page();
  const ootd = JSON.stringify(app.ootdPosts);
  app.activeSosDetailId = 'fixture-sos-1'; app.isSosDetailOpen = true;
  const detail = mount(SosDetailModal, { global: { plugins: [router] } }); wrappers.push(detail);
  await detail.get('#sos-comment-input').setValue('<img src=x onerror=alert(1)>');
  await detail.get('[data-testid="sos-comment-form"]').trigger('submit'); await flushPromises();
  expect(detail.find('.sos-comment-body img').exists()).toBe(false);
  expect(detail.text()).toContain('<img src=x onerror=alert(1)>');
  expect(JSON.stringify(app.ootdPosts)).toBe(ootd);
  await sos.closeSosPost('fixture-sos-1'); await nextTick();
  expect(detail.find('#sos-comment-input').exists()).toBe(false);
  expect(detail.text()).toContain('留言已保留');
});

it('opens deep-linked detail after reload and leaves other module dialogs alone', async () => {
  const { app, router } = await page('/sos?sos_mode=fixture&sos=fixture-sos-2');
  expect(app.isSosDetailOpen).toBe(true);
  expect(app.activeSosDetailId).toBe('fixture-sos-2');
  app.isCommentOpen = true;
  await router.push('/closet'); await flushPromises();
  expect(app.isSosDetailOpen).toBe(false);
  expect(app.isCommentOpen).toBe(true);
});

it('shows an unavailable link message instead of an invisible stuck modal', async () => {
  const { wrapper, app } = await page('/sos?sos_mode=fixture&sos=missing');
  expect(app.isSosDetailOpen).toBe(false);
  expect(wrapper.text()).toContain('找不到這筆求救');
});

it('closes the detail when browser Back removes the deep link', async () => {
  const { wrapper, router, app } = await page();
  await wrapper.find('.sos-card-actions button').trigger('click');
  await flushPromises();
  expect(app.isSosDetailOpen).toBe(true);
  router.back(); await flushPromises();
  expect(router.currentRoute.value.query.sos).toBeUndefined();
  expect(app.isSosDetailOpen).toBe(false);
});

it('keeps the suggestion draft visible when saving fails', async () => {
  const { sos, app } = await page();
  const post = sos.receivedSosPosts[0]; app.activeSosId = post.id; app.isSuggestionFormOpen = true;
  const modal = mount(SuggestionModal); wrappers.push(modal);
  await modal.get('.suggestion-items input').setValue(true);
  await modal.get('#suggestionMessage').setValue('我的搭配想法');
  vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('Quota'); });
  await modal.get('form').trigger('submit'); await flushPromises();
  expect(app.isSuggestionFormOpen).toBe(true);
  expect(modal.get('#suggestionMessage').element.value).toBe('我的搭配想法');
  expect(modal.get('[role="alert"]').text()).toContain('無法儲存');
  expect(sos.getSuggestionsForSos(post.id)).toHaveLength(0);
});

it('shows an explicit empty state when the Community list has no posts', async () => {
  const { wrapper, sos } = await page();
  sos.sosPosts.splice(0);
  await nextTick();
  expect(wrapper.get('.sos-empty').text()).toContain('目前沒有開放中的求救');
});

it('keeps long card copy and more than three public clothing thumbnails bounded', async () => {
  const { wrapper, sos } = await page();
  const post = sos.receivedSosPosts[0];
  const longUsername = `@${'衣友'.repeat(20)}`;
  const longTitle = '這是一個很長的求救標題 '.repeat(12);
  post.username = longUsername;
  post.title = longTitle;
  const extra = { id: 'fixture-extra-item', owner_id: post.sender_id, name: '額外單品', name_zh: '額外單品', photo: '' };
  sos.closetItems.push(extra);
  post.closet_item_ids.push(extra.id);
  await nextTick();
  const card = wrapper.get(`[data-sos-id="${post.id}"]`);
  expect(card.findAll('.sos-card-clothing-thumb')).toHaveLength(4);
  expect(card.text()).toContain(longUsername);
  expect(card.get('h2').text()).toContain(longTitle.trim().slice(0, 20));
});

it('shows remote loading, error, and retry states instead of hiding a read failure', async () => {
  window.history.replaceState({}, '', '/sos?sos_mode=remote_read');
  const { wrapper, sos } = await page('/sos?sos_mode=remote_read');
  sos.remoteLoading = true;
  await nextTick();
  expect(wrapper.get('[role="status"]').text()).toContain('正在讀取求救');

  sos.remoteLoading = false;
  sos.lastError = '暫時無法讀取遠端求救';
  await nextTick();
  expect(wrapper.get('[role="alert"]').text()).toContain('暫時無法讀取遠端求救');
  expect(wrapper.get('.sos-remote-status button').text()).toContain('重新讀取');
});

it('uses a neutral fallback when a real clothing photo fails', async () => {
  const image = mount(SosClothingImage, { props: { src: 'https://example.invalid/broken.jpg', alt: '白色襯衫' } });
  wrappers.push(image);
  expect(image.get('img').attributes('alt')).toBe('白色襯衫');
  expect(image.get('img').classes()).toContain('sos-clothing-image');
  await image.get('img').trigger('error');
  expect(image.find('[role="img"]').attributes('aria-label')).toBe('白色襯衫');
  expect(image.find('img').exists()).toBe(false);
});

it('keeps long SOS copy readable as text in Detail', async () => {
  const { sos, app } = await page();
  const longTitle = `${'<'}長標題${'>'} ${'穿搭需求'.repeat(80)}`;
  sos.sosPosts[0].title = longTitle;
  sos.sosPosts[0].details = '詳細需求 '.repeat(160);
  app.activeSosDetailId = sos.sosPosts[0].id;
  app.isSosDetailOpen = true;
  const detail = mount(SosDetailModal); wrappers.push(detail); await nextTick();
  expect(detail.get('h2').text()).toBe(longTitle);
  expect(detail.find('h2 img').exists()).toBe(false);
  expect(detail.text()).toContain('詳細需求');
});

it('keeps a CLOSED historical SOS visible while disabling new actions', async () => {
  const { sos, app } = await page();
  expect(await sos.closeSosPost('fixture-sos-1')).toBe(true);
  app.activeSosDetailId = 'fixture-sos-1';
  app.isSosDetailOpen = true;
  const detail = mount(SosDetailModal); wrappers.push(detail); await nextTick();
  expect(detail.find('.sos-status-badge.is-closed').exists()).toBe(true);
  expect(detail.text()).toContain('留言已保留');
  expect(detail.findAll('button').some(button => button.text().includes('提供搭配建議'))).toBe(false);
  expect(detail.find('#sos-comment-input').exists()).toBe(false);
});
