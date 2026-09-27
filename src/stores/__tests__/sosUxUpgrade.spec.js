import { afterEach, beforeEach, expect, it } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, disposePinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useAppStore } from '../app';
import { useSosStore } from '../sos';
import { outfitRows } from '@/features/sos/outfitBoard';
import SosOutfitBoard from '@/features/sos/components/SosOutfitBoard.vue';
import SosDetailModal from '@/components/modal/SosDetailModal.vue';

let pinia;
const wrappers = [];
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/sos?sos_mode=fixture');
  pinia = createPinia(); setActivePinia(pinia);
});
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  disposePinia(pinia);
});

const item = (id, category, photo = `https://example.test/${id}.jpg`) => ({ id, name: id, category, photo });
const layoutCases = [
  [['Tops', 'Bottoms', 'Shoes'], ['tops', 'bottoms', 'shoes']],
  [['Dress', 'Shoes'], ['dress', 'shoes']],
  [['Outerwear', 'Tops', 'Bottoms'], ['outerwear', 'tops', 'bottoms']],
  [['Bags', 'Accessories'], ['bags', 'accessories']],
  [['Unknown category'], ['other']]
];

it.each(layoutCases)('presents %j as a head-to-toe collage without empty slots', (categories, expected) => {
  const pieces = categories.map((category, index) => item(`piece-${index}`, category));
  const rows = outfitRows(pieces);
  expect(rows.flat().map(group => group.key)).toEqual(expected);
  const board = mount(SosOutfitBoard, { props: { items: pieces } }); wrappers.push(board);
  expect(board.findAll('.sos-outfit-piece')).toHaveLength(pieces.length);
  expect(board.findAll('.sos-outfit-row')).toHaveLength(rows.length);
  expect(board.findAll('.sos-outfit-photo img')).toHaveLength(pieces.length);
});

it('keeps a valid real photo while a broken photo falls back neutrally', async () => {
  const board = mount(SosOutfitBoard, { props: { items: [item('real', 'Tops'), item('broken', 'Bottoms')] } }); wrappers.push(board);
  expect(board.get('img[src="https://example.test/real.jpg"]').attributes('alt')).toBe('real');
  await board.get('img[src="https://example.test/broken.jpg"]').trigger('error');
  expect(board.findAll('img')).toHaveLength(1);
  expect(board.get('[role="img"]').text()).toContain('衣物照片');
});

function openDetail(sos, app, id) {
  app.activeSosDetailId = id; app.isSosDetailOpen = true;
  const detail = mount(SosDetailModal, { attachTo: document.body }); wrappers.push(detail);
  return detail;
}

it('gives the existing SOS fields a readable requirement hierarchy', async () => {
  const sos = useSosStore(); const app = useAppStore();
  const detail = openDetail(sos, app, 'fixture-sos-2'); await nextTick();
  expect(detail.get('.sos-requirement-when').text()).toContain('明天');
  expect(detail.findAll('.sos-requirement-grid dt').map(node => node.text())).toEqual(['場合', '天氣', '想要的風格', '我的穿搭困擾']);
  expect(detail.get('.sos-requirement-grid').text()).toContain('約會');
  expect(detail.get('.sos-requirement-grid').text()).toContain('涼爽');
  expect(detail.get('.sos-requirement-grid').text()).toContain('不想太正式');
});

async function makeTwoSuggestions(sos) {
  const sosId = 'fixture-sos-2';
  const selectedIds = ['fixture-b-shirt', 'fixture-b-pants'];
  expect(await sos.submitSuggestion({ sosId, selectedIds, message: '第一套：乾淨簡約，適合走一整天。' })).toBe(true);
  const firstId = sos.getSuggestionsForSos(sosId)[0].id;
  expect(sos.switchFixtureProfile('fixture-c')).toBe(true);
  expect(await sos.submitSuggestion({ sosId, selectedIds: ['fixture-b-jacket'], message: '第二套：外套晚上再穿。' })).toBe(true);
  expect(sos.switchFixtureProfile('fixture-b')).toBe(true);
  expect(await sos.toggleLikeSuggestion({ sosId, suggestionId: firstId })).toBe(true);
  expect(await sos.adoptSuggestion({ sosId, suggestionId: firstId })).toBe(true);
  return { sosId, firstId };
}

it('compares multiple outfits and filters all, liked, and adopted without changing OPEN', async () => {
  const sos = useSosStore(); const app = useAppStore();
  const { sosId, firstId } = await makeTwoSuggestions(sos);
  const detail = openDetail(sos, app, sosId); await nextTick();
  expect(detail.findAll('.sos-compare-grid .sos-suggestion-card')).toHaveLength(2);
  expect(detail.findAll('.sos-suggestion-filters button').map(node => node.attributes('aria-pressed'))).toEqual(['true', 'false', 'false']);
  await detail.findAll('.sos-suggestion-filters button')[1].trigger('click');
  expect(detail.findAll('.sos-suggestion-card')).toHaveLength(1);
  expect(detail.get('.sos-suggestion-card').attributes('data-suggestion-id')).toBe(firstId);
  await detail.findAll('.sos-suggestion-filters button')[2].trigger('click');
  expect(detail.findAll('.sos-suggestion-card')).toHaveLength(1);
  expect(detail.get('.sos-adopt-badge').text()).toContain('已採用');
  await detail.findAll('.sos-suggestion-filters button')[0].trigger('click');
  expect(detail.findAll('.sos-suggestion-card')).toHaveLength(2);
  expect(sos.sosPosts.find(post => post.id === sosId).status).toBe('OPEN');
});

it('uses the existing requester liked IDs for read-only comparison without adding state', async () => {
  const sos = useSosStore(); const app = useAppStore();
  const { sosId, firstId } = await makeTwoSuggestions(sos);
  expect(await sos.toggleLikeSuggestion({ sosId, suggestionId: firstId })).toBe(true);
  sos.sosPosts.find(post => post.id === sosId).liked_suggestion_ids = [firstId];
  const detail = openDetail(sos, app, sosId); await nextTick();
  await detail.findAll('.sos-suggestion-filters button')[1].trigger('click');
  expect(detail.findAll('.sos-suggestion-card')).toHaveLength(1);
  expect(detail.get('.sos-requester-liked').text()).toContain('發布者喜歡');
});

it('retains the collage and comments in CLOSED history without allowing another suggestion', async () => {
  const sos = useSosStore(); const app = useAppStore();
  const { sosId } = await makeTwoSuggestions(sos);
  expect(await sos.closeSosPost(sosId)).toBe(true);
  const detail = openDetail(sos, app, sosId); await nextTick();
  expect(detail.findAll('.sos-outfit-board')).toHaveLength(2);
  expect(detail.get('.sos-status-badge').text()).toContain('已結束');
  expect(detail.find('#sos-comment-input').exists()).toBe(false);
  expect(detail.findAll('button').some(button => button.text().includes('提供搭配建議'))).toBe(false);
  expect(sos.sentSosPosts.some(post => post.id === sosId)).toBe(true);
});

it('keeps unknown historical public IDs unknown and contains a long suggestion message as text', async () => {
  const sos = useSosStore(); const app = useAppStore();
  expect(sos.switchFixtureProfile('fixture-b')).toBe(true);
  await nextTick();
  const post = sos.sosPosts.find(entry => entry.id === 'fixture-history');
  post.sender_id = 'fixture-b';
  post.details = '穿搭困擾 '.repeat(120);
  sos.outfitSuggestions.push({ id: 'historical-suggestion', sos_id: post.id, responder_id: 'fixture-c', username: '@mika', item_ids: ['fixture-a-shirt'], message: '<長篇想法> '.repeat(120), created_at: '2026-09-26T08:00:00.000Z' });
  const detail = openDetail(sos, app, post.id); await flushPromises();
  expect(detail.text()).toContain('歷史求救，當時公開的衣物清單未保存。');
  expect(detail.findAll('.sos-outfit-piece')).toHaveLength(0);
  expect(detail.get('.sos-suggestion-message').text()).toContain('<長篇想法>');
  expect(detail.find('.sos-suggestion-message img').exists()).toBe(false);
});
