<template>
  <SosDialog v-if="appStore.isSosDetailOpen && targetPost" :title="targetPost.title || '穿搭求救詳情'" panel-class="sos-detail-modal" :busy="busy" @close="close">
    <div ref="content">

      <div class="sos-detail-heading">
        <p class="eyebrow">Style SOS 詳情</p>
        <h2>{{ targetPost.title }}</h2>

        <div class="sos-detail-user">
          <div class="sos-feed-avatar">{{ targetPost.initials }}</div>
          <div>
            <strong>{{ targetPost.username }}</strong>
            <span>
              狀態：
              <em :class="['sos-status-badge', { 'is-closed': targetPost.status === 'CLOSED', 'is-unknown': !['OPEN', 'CLOSED'].includes(targetPost.status) }]">
                {{ sosStatusLabel(targetPost.status) }}
              </em>
            </span>
          </div>
        </div>

        <section class="sos-requirements" aria-label="這次的穿搭需求">
          <div class="sos-requirement-when"><span>什麼時候穿</span><strong>{{ targetPost.when_label || '時間未提供' }}</strong></div>
          <dl class="sos-requirement-grid">
            <div><dt>場合</dt><dd>{{ targetPost.occasion || '未提供' }}</dd></div>
            <div><dt>天氣</dt><dd>{{ targetPost.weather || '未提供' }}</dd></div>
            <div class="sos-requirement-wide"><dt>想要的風格</dt><dd>{{ (Array.isArray(targetPost.vibes) ? targetPost.vibes : []).map(vibeLabel).join(' · ') || '未提供' }}</dd></div>
            <div class="sos-requirement-wide"><dt>我的穿搭困擾</dt><dd>{{ targetPost.details || '未提供' }}</dd></div>
          </dl>
        </section>
      </div>

      <!-- Public Closet Gallery Section -->
      <div class="sos-detail-gallery">
        <h3>本次公開的衣物 ({{ publicItems.length }} 件)</h3>
        <div v-if="publicItems.length" class="sos-detail-gallery-grid">
          <div v-for="item in publicItems" :key="item.id" class="sos-detail-gallery-item">
            <SosClothingImage :src="item.photo" :alt="item.name_zh || item.name" />
            <span>{{ item.name_zh || item.name }}</span>
          </div>
        </div>
        <p v-else style="color:var(--muted); font-size:13px; font-style:italic;">
          {{ publicClothingMessage(targetPost, sosStore.mode) }}
        </p>
      </div>

      <!-- Actions for Owner vs Responder -->
      <div style="margin: 20px 0; display:flex; gap:12px; justify-content: flex-end;">
        <button
          v-if="isOwner && targetPost.status === 'OPEN' && sosStore.canInteract"
          class="secondary"
          @click="openCloseConfirm"
        >
          結束這次求救
        </button>
        <button
          v-if="!isOwner && targetPost.status === 'OPEN'"
          class="primary"
          :disabled="!!suggestionBlock"
          @click="openSuggestionForm"
        >
          提供搭配建議
        </button>
      </div>
      <p v-if="!isOwner && suggestionBlock" class="sos-note">{{ suggestionBlock }}</p>
      <p v-if="targetPost.adopted_suggestion_id && targetPost.status === 'OPEN'" class="sos-note">已找到喜歡的搭配。仍可繼續交流，或由發布者按「結束這次求救」保留紀錄。</p>

      <!-- Outfit Suggestions List -->
      <div class="sos-suggestions-section">
        <div class="sos-suggestions-header">
          <h3 style="font-size:16px; font-weight:600;">
            搭配建議 ({{ suggestions.length }})
          </h3>
          <span style="color:var(--muted); font-size:12px;">
            {{ helperCount }} 位衣友幫忙
          </span>
        </div>

        <div v-if="suggestions.length" class="sos-suggestion-filters" role="group" aria-label="篩選搭配建議">
          <button v-for="option in suggestionFilters" :key="option.key" type="button" :class="{ active: suggestionFilter === option.key }" :aria-pressed="suggestionFilter === option.key" @click="suggestionFilter = option.key">
            {{ option.label }} <span>{{ option.count }}</span>
          </button>
        </div>

        <div v-if="filteredSuggestions.length" class="sos-compare-grid">
          <div
            v-for="sug in filteredSuggestions"
            :key="sug.id"
            :class="['sos-suggestion-card', { 'is-adopted': targetPost.adopted_suggestion_id === sug.id, 'is-highlighted': sosStore.highlightedSuggestionId === sug.id }]"
            :data-suggestion-id="sug.id"
            tabindex="0"
          >
            <div v-if="targetPost.adopted_suggestion_id === sug.id" class="sos-adopt-badge">
              ✓ 已採用
            </div>
            <span v-if="requesterLiked(sug.id)" class="sos-requester-liked">♥ 發布者喜歡</span>

            <strong class="sos-suggestion-author">{{ sug.username || '衣友的搭配' }}</strong>

            <SosOutfitBoard :items="getSuggestedItems(sug.item_ids)" />

            <p class="sos-suggestion-message">{{ sug.message || '這位衣友尚未留下搭配說明。' }}</p>

            <div class="sos-suggestion-actions">
              <span style="color:var(--muted); font-size:11px;">
                {{ formatTime(sug.created_at) }}
              </span>

              <div style="display:flex; gap:10px; align-items:center;">
                <!-- Like button -->
                <button
                  :class="['sos-like-btn', { liked: sosStore.hasLiked(sug.id) }]"
                  :aria-pressed="sosStore.hasLiked(sug.id)"
                  :aria-label="`${sosStore.hasLiked(sug.id) ? '取消喜歡' : '喜歡'} ${sug.username || '衣友'} 的搭配，${sosStore.getLikeCount(sug.id)} 個喜歡`"
                  :disabled="busy || !sosStore.canInteract"
                  @click="toggleLike(sug.id)"
                >
                  {{ sosStore.hasLiked(sug.id) ? '♥ 已喜歡' : '♡ 喜歡' }} {{ sosStore.getLikeCount(sug.id) }}
                </button>

                <!-- Adopt button (only for SOS owner) -->
                <button
                  v-if="isOwner && targetPost.status === 'OPEN' && sosStore.canInteract"
                  :disabled="busy"
                  class="sos-cta"
                  :aria-label="`${targetPost.adopted_suggestion_id === sug.id ? '取消採納' : '採用'} ${sug.username || '衣友'} 的搭配`"
                  :style="{ background: targetPost.adopted_suggestion_id === sug.id ? 'var(--sage-dark)' : 'var(--ink)' }"
                  @click="adopt(sug.id)"
                >
                  {{ targetPost.adopted_suggestion_id === sug.id ? '取消採納' : '採用搭配' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="sos-suggestion-empty" role="status">
          {{ suggestions.length ? '這個篩選目前沒有搭配建議。' : '目前還沒有衣友提供搭配建議。' }}
        </div>
      </div>
      <SosComments :post="targetPost" />
      <p v-if="sosStore.lastError" class="sos-error" role="alert">{{ sosStore.lastError }}</p>
    </div>
  </SosDialog>
  <SosDialog v-else-if="appStore.isSosDetailOpen" title="求救無法查看" @close="close"><h2>找不到這筆求救</h2><p class="sos-note">請回求救板重新選擇。</p></SosDialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useAppStore } from '@/stores/app';
import { useSosStore } from '@/stores/sos';
import SosDialog from '@/features/sos/components/SosDialog.vue';
import SosClothingImage from '@/features/sos/components/SosClothingImage.vue';
import SosOutfitBoard from '@/features/sos/components/SosOutfitBoard.vue';
import SosComments from '@/features/sos/components/SosComments.vue';
import { formatTime, publicClothingMessage, sosStatusLabel, vibeLabel } from '@/features/sos/presentation';

const appStore = useAppStore();
const sosStore = useSosStore();
const busy = ref(false);
const content = ref(null);
const suggestionFilter = ref('all');
const suggestionBlock = computed(() => sosStore.getSuggestionBlockReason(targetPost.value));

const targetPost = computed(() => {
  return sosStore.sosPosts.find((p) => p.id === appStore.activeSosDetailId);
});

const isOwner = computed(() => {
  return sosStore.isOwner(targetPost.value);
});

const publicItems = computed(() => {
  return sosStore.getPublicItemsForSos(targetPost.value);
});

const suggestions = computed(() => {
  if (!targetPost.value) return [];
  return sosStore.getSuggestionsForSos(targetPost.value.id);
});

const requesterLiked = suggestionId => Array.isArray(targetPost.value?.liked_suggestion_ids) &&
  targetPost.value.liked_suggestion_ids.includes(suggestionId);
const isLikedForFilter = suggestionId => sosStore.hasLiked(suggestionId) || requesterLiked(suggestionId);

const suggestionFilters = computed(() => [
  { key: 'all', label: '全部', count: suggestions.value.length },
  { key: 'liked', label: '已喜歡', count: suggestions.value.filter(s => isLikedForFilter(s.id)).length },
  { key: 'adopted', label: '已採用', count: suggestions.value.filter(s => s.id === targetPost.value?.adopted_suggestion_id).length }
]);
const filteredSuggestions = computed(() => suggestions.value.filter(s =>
  suggestionFilter.value === 'all' ||
  (suggestionFilter.value === 'liked' && isLikedForFilter(s.id)) ||
  (suggestionFilter.value === 'adopted' && s.id === targetPost.value?.adopted_suggestion_id)
));

const helperCount = computed(() => {
  if (!targetPost.value) return 0;
  return sosStore.getHelperCountForSos(targetPost.value.id);
});

const getSuggestedItems = (itemIds) => {
  if (!Array.isArray(itemIds)) return [];
  const publicItems = sosStore.getPublicItemsForSos(targetPost.value);
  return publicItems.filter((item) => itemIds.includes(item.id));
};

const close = () => {
  if (busy.value) return;
  appStore.isSosDetailOpen = false;
  appStore.activeSosDetailId = null;
};

const openCloseConfirm = () => {
  appStore.sosToCloseId = targetPost.value.id;
  appStore.isSosCloseConfirmOpen = true;
};

const openSuggestionForm = () => {
  if (suggestionBlock.value) return;
  appStore.activeSosId = targetPost.value.id;
  appStore.isSuggestionFormOpen = true;
  appStore.isSosDetailOpen = false;
};

const adopt = async (suggestionId) => {
  if (busy.value) return;
  busy.value = true;
  try { await sosStore.adoptSuggestion({
    sosId: targetPost.value.id,
    suggestionId
  }); } finally { busy.value = false; }
};

const toggleLike = async (suggestionId) => {
  if (busy.value) return;
  busy.value = true;
  try { await sosStore.toggleLikeSuggestion({
    sosId: targetPost.value.id,
    suggestionId
  }); } finally { busy.value = false; }
};

watch(() => [appStore.isSosDetailOpen, appStore.activeSosDetailId, sosStore.highlightedSuggestionId, sosStore.highlightedCommentId], async ([open]) => {
  if (!open) return;
  suggestionFilter.value = 'all';
  sosStore.clearError();
  await nextTick();
  const target = [...(content.value?.querySelectorAll('[data-suggestion-id], [data-comment-id]') || [])].find(el =>
    (sosStore.highlightedSuggestionId && el.dataset.suggestionId === sosStore.highlightedSuggestionId) ||
    (sosStore.highlightedCommentId && el.dataset.commentId === sosStore.highlightedCommentId)
  );
  target?.scrollIntoView?.({ block: 'center' });
  target?.focus();
}, { immediate: true });
</script>

<style scoped>
.sos-requirements { margin-top: 20px; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: #faf8f4; }
.sos-requirement-when { padding: 17px 20px; background: #e9ede3; display: flex; flex-direction: column; gap: 4px; }
.sos-requirement-when span, .sos-requirement-grid dt { color: #69715f; font-size: 11px; letter-spacing: .07em; }
.sos-requirement-when strong { font-size: 22px; font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
.sos-requirement-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; }
.sos-requirement-grid > div { min-width: 0; padding: 14px 20px; border-top: 1px solid var(--line); }
.sos-requirement-grid > div:nth-child(2) { border-left: 1px solid var(--line); }
.sos-requirement-grid .sos-requirement-wide { grid-column: 1 / -1; }
.sos-requirement-grid dd { margin: 5px 0 0; color: var(--ink); font-size: 14px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
.sos-suggestion-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.sos-suggestion-filters button { min-height: 44px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 999px; background: white; color: var(--ink); cursor: pointer; font-size: 12px; }
.sos-suggestion-filters button.active { border-color: var(--sage-dark); background: #e9ede3; font-weight: 600; }
.sos-suggestion-filters button span { margin-left: 3px; color: var(--muted); }
.sos-compare-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
.sos-suggestion-card { min-width: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; overflow-wrap: anywhere; }
.sos-suggestion-card.is-highlighted, .sos-suggestion-card:focus-visible { outline: 2px solid var(--sage-dark); outline-offset: 2px; }
.sos-suggestion-author { font-size: 14px; display: block; color: var(--ink); }
.sos-requester-liked { align-self: flex-start; padding: 4px 9px; border-radius: 999px; background: #f5e7e3; color: #9c514b; font-size: 11px; font-weight: 600; }
.sos-suggestion-message { font-size: 13px; color: var(--ink); line-height: 1.65; margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.sos-suggestion-actions { flex-wrap: wrap; gap: 10px; margin-top: auto; }
.sos-suggestion-actions > div { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.sos-suggestion-actions button { min-height: 44px; }
.sos-suggestion-empty { padding: 24px; text-align: center; color: var(--muted); font-size: 13px; border: 1px dashed var(--line); border-radius: 12px; }
.sos-status-badge.is-unknown { background: #fff4db; color: #8c6b2d; }
@media (max-width: 680px) {
  .sos-compare-grid { grid-template-columns: 1fr; }
  .sos-requirement-grid { grid-template-columns: 1fr; }
  .sos-requirement-grid > div:nth-child(2) { border-left: 0; }
  .sos-requirement-grid .sos-requirement-wide { grid-column: 1; }
  .sos-suggestions-header { flex-wrap: wrap; gap: 6px; }
}
</style>
