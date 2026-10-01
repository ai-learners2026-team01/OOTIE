<template>
  <section class="page active sos-module" id="sosPage">
    <div class="sos-page-heading">
      <div><p class="eyebrow">Style SOS · Wear what you own</p><h1>穿搭求救</h1><p class="intro">把穿搭煩惱交給衣友，一起找到衣櫃裡的新可能。</p></div>
      <button v-if="sosStore.mode !== 'REMOTE_READ'" class="sos-inbox-button" @click="sosStore.isInboxOpen = true; sosStore.clearError()">互動通知 <span v-if="sosStore.unreadCount">{{ sosStore.unreadCount }}</span></button>
    </div>
    <SosModePanel v-if="sosStore.isFixture" />
    <p v-if="sosStore.interactionReason && sosStore.mode !== 'REMOTE_READ' && !sosStore.formalRemoteRead" class="sos-page-alert" role="alert">{{ sosStore.interactionReason }}</p>
    <p v-if="!sosStore.isFixture && sosStore.remoteLoaded && !sosStore.canPublish && sosStore.remoteWriteReason" class="sos-page-alert" role="status">{{ sosStore.remoteWriteReason }}</p>
    <p v-if="routeError" class="sos-page-alert" role="alert">{{ routeError }}</p>

    <div class="sos-toolbar">
      <label class="sos-search"><span aria-hidden="true">⌕</span><input v-model="sosStore.searchQuery" type="search" placeholder="搜尋場合、衣友或穿搭需求" aria-label="搜尋場合或穿搭需求" /></label>
      <button class="primary" data-testid="sos-publish" :disabled="!sosStore.canPublish" @click="openSosForm()">＋ 發布求救</button>
    </div>
    <div class="sos-tabs" aria-label="穿搭求救分類">
      <button :class="['sos-tab', { active: sosStore.activeTab === 'received' }]" :aria-pressed="sosStore.activeTab === 'received'" @click="sosStore.activeTab = 'received'">衣友求救板 ({{ sosStore.receivedSosPosts.length }})</button>
      <button :class="['sos-tab', { active: sosStore.activeTab === 'sent' }]" :aria-pressed="sosStore.activeTab === 'sent'" @click="sosStore.activeTab = 'sent'">我發出的求救 ({{ sosStore.sentSosPosts.length }})</button>
    </div>
    <div class="sos-filter-row">
      <label>場合 <select v-model="sosStore.occasionFilter" aria-label="篩選場合"><option value="">全部場合</option><option v-for="occasion in occasions" :key="occasion">{{ occasion }}</option></select></label>
      <label v-if="sosStore.activeTab === 'sent'">狀態 <select v-model="sosStore.historyFilter" aria-label="篩選求救狀態"><option value="all">全部紀錄</option><option value="OPEN">徵求搭配中</option><option value="CLOSED">已結束</option></select></label>
      <span aria-live="polite">{{ sosStore.filteredSosPosts.length }} 筆求救</span>
    </div>
    <div v-if="sosStore.mode !== 'FIXTURE' && (!sosStore.remoteLoaded || sosStore.lastError)" class="sos-remote-status" :aria-busy="sosStore.remoteLoading ? 'true' : 'false'">
      <p v-if="sosStore.remoteLoading" role="status">正在讀取求救…</p>
      <p v-if="sosStore.lastError" role="alert">{{ sosStore.lastError }}</p>
      <button class="secondary" :disabled="sosStore.remoteLoading" @click="sosStore.loadRemote()">重新讀取</button>
    </div>
    <div class="sos-feed">
      <article v-for="post in sosStore.filteredSosPosts" :key="post.id" class="sos-feed-card" :data-sos-id="post.id">
        <div class="sos-feed-user">
          <div class="sos-feed-avatar">{{ post.initials || '衣友' }}</div>
          <div><strong>{{ post.username || '衣友' }} <small v-if="sosStore.isOwner(post)" class="sos-own-indicator">我的求救</small></strong><span>{{ formatTime(post.created_at) }}<em :class="['sos-status-badge', { 'is-closed': post.status === 'CLOSED', 'is-unknown': !['OPEN', 'CLOSED'].includes(post.status) }]">{{ sosStatusLabel(post.status) }}</em></span></div>
        </div>
        <h2>{{ post.title }}</h2>
        <div class="sos-meta"><span>時間｜{{ post.when_label || '未提供' }}</span><span>場合｜{{ post.occasion || '未提供' }}</span></div>
        <div v-if="Array.isArray(post.vibes) && post.vibes.length" class="sos-vibes">想要感覺：{{ post.vibes.map(vibeLabel).join(' · ') }}</div>
        <div v-if="getPublicItemThumbs(post).length" class="sos-card-clothing-preview">
          <div class="sos-card-clothing-list">
            <div v-for="item in getPublicItemThumbs(post).slice(0, 4)" :key="item.id" class="sos-card-clothing-thumb"><SosClothingImage :src="item.photo" :alt="item.name_zh || item.name" /><span>{{ item.name_zh || item.name }}</span></div>
          </div>
        </div>
        <p v-else class="sos-no-clothing">{{ publicClothingMessage(post, sosStore.mode) }}</p>
        <div class="sos-card-footer">
          <span class="sos-available">{{ getPublicItemThumbs(post).length }} 件公開衣物 · {{ sosStore.getHelperCountForSos(post.id) }} 位衣友建議 · {{ sosStore.getCommentsForSos(post.id).length }} 則留言</span>
          <div class="sos-card-actions">
            <button class="sos-cta secondary-btn" @click="openSosDetail(post.id)">查看詳情</button>
            <button v-if="sosStore.activeTab === 'received' && post.status === 'OPEN'" class="sos-cta" :disabled="!!sosStore.getSuggestionBlockReason(post)" @click="openSuggestion(post.id)">{{ hasSuggestion(post.id) ? '已提供建議' : '幫忙搭配' }}</button>
            <button v-if="sosStore.isOwner(post) && post.status === 'OPEN'" class="sos-cta sos-close-action" @click="openCloseConfirm(post.id)">結束求救</button>
          </div>
        </div>
      </article>
      <div v-if="!sosStore.filteredSosPosts.length && !sosStore.remoteLoading" class="sos-empty">
        <h2>{{ hasFilters ? '找不到符合條件的求救' : sosStore.activeTab === 'sent' ? '從一件不知道怎麼搭的衣服開始' : '目前沒有開放中的求救' }}</h2>
        <p>{{ hasFilters ? '試試其他關鍵字，或清除篩選看看。' : sosStore.activeTab === 'sent' ? '選擇自己的衣物，說說你的場合，讓衣友一起出主意。' : '可以先發布自己的求救，或稍後再回來看看。' }}</p>
        <button v-if="hasFilters" class="secondary" @click="clearFilters">清除篩選</button>
        <button v-else-if="sosStore.canPublish" class="primary" @click="openSosForm()">發布第一筆求救</button>
      </div>
    </div>
    <SosInbox />
  </section>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useSosStore } from '@/stores/sos';
import SosModePanel from '@/features/sos/components/SosModePanel.vue';
import SosInbox from '@/features/sos/components/SosInbox.vue';
import SosClothingImage from '@/features/sos/components/SosClothingImage.vue';
import { formatTime, publicClothingMessage, sosStatusLabel, vibeLabel } from '@/features/sos/presentation';

const appStore = useAppStore();
const sosStore = useSosStore();
const route = useRoute();
const router = useRouter();
const routeError = ref('');
const occasions = ['約會', '工作', '上課', '聚餐', '戶外活動', '旅行', '日常', '其他'];
const hasFilters = computed(() => Boolean(sosStore.searchQuery || sosStore.occasionFilter || (sosStore.activeTab === 'sent' && sosStore.historyFilter !== 'all')));
const clearFilters = () => { sosStore.searchQuery = ''; sosStore.occasionFilter = ''; sosStore.historyFilter = 'all'; };
const getPublicItemThumbs = post => sosStore.getPublicItemsForSos(post);
const hasSuggestion = id => sosStore.getSuggestionsForSos(id).some(s => (s.responder_id || s.user_id) === sosStore.actorId);
const openSosForm = (itemId = null) => {
  if (!sosStore.canPublish) { appStore.showToast(sosStore.remoteWriteReason || sosStore.interactionReason); return; }
  appStore.sosTargetItemId = typeof itemId === 'string' ? itemId : null;
  appStore.isSosFormOpen = true;
};
watch(() => [route.path, route.query.item_id, route.query.quick], ([path, itemId, quick]) => {
  if (path !== '/sos') { sosStore.closeDialogs(); return; }
  if (typeof itemId !== 'string' && quick !== 'add-sos') return;
  if (typeof itemId === 'string' && !sosStore.ownedClosetItems.some(item => item.id === itemId)) {
    routeError.value = '這件衣物已不存在或不屬於目前使用者，請自行選擇要公開的衣物。';
    openSosForm();
  } else openSosForm(itemId);
  const { item_id, quick: consumedQuick, ...query } = route.query;
  router.replace({ path: '/sos', query });
}, { immediate: true });
watch(() => [route.path, route.query.sos, route.query.suggestion, route.query.comment, sosStore.remoteLoaded], ([path, sosId, suggestionId, commentId]) => {
  if (path !== '/sos') { sosStore.closeDialogs(); return; }
  if (!sosId) { appStore.isSosDetailOpen = false; appStore.activeSosDetailId = null; return; }
  const post = sosStore.sosPosts.find(p => p.id === sosId);
  if (!post) {
    appStore.isSosDetailOpen = false;
    if (sosStore.mode !== 'REMOTE_READ' || sosStore.remoteLoaded) routeError.value = '找不到這筆求救，請從求救板重新選擇。';
    return;
  }
  routeError.value = '';
  appStore.activeSosDetailId = post.id; appStore.isSosDetailOpen = true;
  sosStore.highlightedSuggestionId = typeof suggestionId === 'string' ? suggestionId : null;
  sosStore.highlightedCommentId = typeof commentId === 'string' ? commentId : null;
}, { immediate: true });
watch(() => appStore.isSosDetailOpen, (open, wasOpen) => {
  if (open && route.path === '/sos' && appStore.activeSosDetailId && route.query.sos !== appStore.activeSosDetailId) {
    router.push({ path: '/sos', query: { ...route.query, sos: appStore.activeSosDetailId, suggestion: sosStore.highlightedSuggestionId || undefined, comment: sosStore.highlightedCommentId || undefined } });
    return;
  }
  if (open || !wasOpen || appStore.isSuggestionFormOpen || route.path !== '/sos' || !route.query.sos) return;
  const { sos, suggestion, comment, ...query } = route.query;
  router.replace({ path: '/sos', query });
});
const openSuggestion = sosId => {
  const post = sosStore.sosPosts.find(p => p.id === sosId);
  if (sosStore.getSuggestionBlockReason(post)) return;
  appStore.activeSosId = sosId; appStore.isSuggestionFormOpen = true;
};
const openSosDetail = sosId => {
  routeError.value = '';
  sosStore.highlightedSuggestionId = null; sosStore.highlightedCommentId = null;
  appStore.activeSosDetailId = sosId; appStore.isSosDetailOpen = true;
  router.push({ path: '/sos', query: { ...route.query, sos: sosId, suggestion: undefined, comment: undefined } });
};
const openCloseConfirm = sosId => { appStore.sosToCloseId = sosId; appStore.isSosCloseConfirmOpen = true; };
// The production entry reads the shared Supabase SOS world. Vitest keeps
// explicit local mode isolated so the existing action contract tests remain
// deterministic; fixture mode never reaches this branch.
if (sosStore.mode !== 'FIXTURE' && import.meta.env.MODE !== 'test') sosStore.loadRemote();
onBeforeUnmount(() => sosStore.closeDialogs());
</script>

<style scoped>
.sos-module { overflow-wrap: anywhere; }
.sos-page-heading { display: flex; justify-content: space-between; align-items: start; gap: 20px; }
.sos-page-heading .intro { max-width: 620px; }
.sos-inbox-button { border: 1px solid var(--line); background: white; border-radius: 24px; padding: 12px 17px; white-space: nowrap; font-size: 12px; }
.sos-inbox-button span { background: #576447; color: white; border-radius: 20px; padding: 2px 6px; margin-left: 4px; }
.sos-filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin: -4px 0 22px; font-size: 12px; }
.sos-filter-row select { padding: 8px; border: 1px solid var(--line); border-radius: 8px; background: white; margin-left: 4px; }
.sos-filter-row > span { margin-left: auto; color: var(--muted); }
.sos-feed-card { display: flex; flex-direction: column; }
.sos-feed-card h2 { font-size: 21px; line-height: 1.5; }
.sos-own-indicator { display: inline-block; margin-left: 6px; padding: 3px 7px; border-radius: 999px; background: #e9ede3; color: var(--sage-dark); font-size: 10px; white-space: nowrap; }
.sos-card-description { color: var(--muted); font-size: 13px; line-height: 1.7; margin: 0 0 18px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sos-card-footer { margin-top: auto; gap: 14px; align-items: start; flex-direction: column; }
.sos-card-actions { flex-wrap: wrap; width: 100%; justify-content: flex-end; }
.sos-card-actions button { min-height: 42px; }
.sos-close-action { background: #8a554d; }
.sos-status-badge.is-unknown { background: #fff4db; color: #8c6b2d; }
.sos-page-alert, .sos-remote-status { padding: 14px; background: #fff2eb; border: 1px solid #ead5c7; border-radius: 12px; font-size: 13px; line-height: 1.6; }
.sos-no-clothing { padding: 16px; border: 1px dashed var(--line); border-radius: 10px; color: var(--muted); font-size: 12px; line-height: 1.7; }
.sos-empty { grid-column: 1 / -1; padding: 42px 24px; } .sos-empty h2 { font-size: 20px; } .sos-empty p { margin: 12px 0 22px; font-size: 13px; }
button:disabled { opacity: .5; cursor: not-allowed; }
:focus-visible { outline: 2px solid var(--sage-dark); outline-offset: 3px; }
@media (max-width: 600px) {
  .sos-page-heading { flex-direction: column; gap: 10px; }
  .sos-inbox-button { align-self: flex-end; }
  .sos-toolbar { flex-wrap: wrap; margin: 20px 0; } .sos-search { min-width: 100%; }
  .sos-toolbar > button { margin-left: auto; }
  .sos-feed { grid-template-columns: 1fr; }
  .sos-card-clothing-list { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sos-card-clothing-thumb:nth-child(4) { display: none; }
  .sos-feed-card { padding: 18px; }
  .sos-tabs { gap: 0; } .sos-tab { padding: 12px 8px; flex: 1; }
}
</style>
