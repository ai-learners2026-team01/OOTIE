<template>
  <section class="page active" id="closetPage">
    <p class="eyebrow">{{ isViewingPublicCloset ? '公開衣櫥' : '數位衣櫥' }}</p>
    <h1>{{ isViewingPublicCloset ? publicClosetTitle : '我的衣櫥' }}</h1>
    <p class="intro">{{ isViewingPublicCloset ? '瀏覽這位衣友公開分享的穿搭單品。' : '把擁有的每一件衣服，準備成下一套日常。' }}</p>

    <section v-if="isOwnCloset" class="closet-visibility-section">
      <div>
        <strong>公開我的衣櫥</strong>
        <p>開啟後，訪客可以瀏覽未隱藏的單品；關閉後，衣物只對自己可見。</p>
        <p class="closet-visibility-status" aria-live="polite">
          目前狀態：{{ appStore.profile.public_closet ? '已開啟（公開）' : '已關閉（私人）' }}
        </p>
      </div>
      <button
        :class="['switch', { on: appStore.profile.public_closet }]"
        type="button"
        :aria-pressed="Boolean(appStore.profile.public_closet)"
        aria-label="切換公開衣櫥"
        :title="appStore.profile.public_closet ? '關閉公開衣櫥' : '開啟公開衣櫥'"
        :disabled="isSavingVisibility"
        @click="togglePublicCloset"
      ></button>
    </section>

    <div v-if="isViewingPublicCloset && publicClosetState === 'loading'" class="closet-privacy-notice">
      正在載入公開衣櫥…
    </div>
    <div v-else-if="isViewingPublicCloset && publicClosetState === 'unavailable'" class="closet-privacy-notice">
      此衣櫥未公開或不存在，無法瀏覽。
    </div>
    <div v-else-if="isViewingPublicCloset && publicClosetState === 'error'" class="closet-privacy-notice">
      目前無法載入公開衣櫥，請稍後再試。
    </div>
    <div v-if="isOwnCloset && remoteClosetState === 'loading'" class="closet-privacy-notice">
      正在載入 Supabase 衣櫥…
    </div>
    <div v-else-if="isOwnCloset && remoteClosetState === 'error'" class="closet-privacy-notice">
      無法載入 Supabase 衣櫥，請確認資料表設定及登入權限後重試。
    </div>

    <!-- 冷宮衣物提醒區塊 -->
    <section v-if="isOwnCloset && !isRemoteCloset" class="disused-section" aria-labelledby="disusedTitle">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Closet check-in</p>
          <h2 id="disusedTitle">冷宮衣物提醒</h2>
        </div>
        <span class="disused-count">
          {{ closetStore.disusedItems.length ? `${closetStore.disusedItems.length} 件需要關心` : '' }}
        </span>
      </div>

      <div class="disused-grid" v-if="closetStore.disusedItems.length">
        <article
          v-for="(item, index) in closetStore.disusedItems.slice(0, 3)"
          :key="item.id"
          class="disused-card"
          :style="{ animationDelay: `${index * 45}ms` }"
        >
          <img :src="item.photo" :alt="item.name_zh || item.name" loading="lazy" />
          <div class="disused-card-body">
            <h3>{{ item.name_zh || item.name }}</h3>
            <p>{{ getDisusedMessage(item) }}</p>
            <span class="disused-meta">
              穿著 {{ item.wear_count || 0 }} 次{{
                closetStore.getDaysSinceLastWorn(item.last_worn) !== null
                  ? ` · ${closetStore.getDaysSinceLastWorn(item.last_worn)} 天前`
                  : ' · 尚未穿過'
              }}
            </span>
            <div class="disused-actions">
              <button class="primary" type="button" @click="sendToSos(item.id)">
                丟到 SOS 求救
              </button>
              <button
                :class="['secondary', { 'is-marked': isMarkedClearance(item) }]"
                type="button"
                :disabled="isMarkedClearance(item)"
                @click="closetStore.markItemForClearance(item.id)"
              >
                {{ isMarkedClearance(item) ? '已標記待出清' : '標記為考慮出清' }}
              </button>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="disused-empty">
        太棒了！你的每件衣服都很常穿，衣櫥利用率很高！
      </div>

      <router-link
        v-if="closetStore.disusedItems.length > 3"
        class="disused-more-link"
        style="display: inline-block;"
        to="/stats"
      >
        查看完整冷宮排名 →
      </router-link>
    </section>

    <!-- Toolbar & Filters -->
    <div v-if="!isViewingPublicCloset || publicClosetState === 'public'" class="toolbar">
      <label class="search">
        <span>⌕</span>
        <input
          v-model="closetStore.searchQuery"
          type="search"
          placeholder="搜尋你的衣櫥"
          aria-label="搜尋你的衣櫥"
        />
      </label>

      <!-- 色系 / 顏色 篩選下拉選單 -->
      <div :class="['color-filter', { open: isColorMenuOpen }]" ref="colorMenuRef">
        <button
          class="select color-filter-toggle"
          type="button"
          aria-haspopup="listbox"
          :aria-expanded="isColorMenuOpen"
          @click="isColorMenuOpen = !isColorMenuOpen"
        >
          <span :class="['color-filter-preview', { 'is-all': !closetStore.colorFilter && !closetStore.colorFamilyFilter }]"></span>
          <span>{{ colorFilterDisplayLabel }}</span>
          <span class="color-filter-arrow">⌄</span>
        </button>

        <div v-if="isColorMenuOpen" class="color-filter-options" role="listbox" aria-label="依色系篩選">
          <div class="color-filter-group">
            <strong>色系</strong>
            <div class="color-filter-group-options">
              <button
                type="button"
                :class="['color-filter-option', { selected: !closetStore.colorFamilyFilter }]"
                @click="selectColorFamily('')"
              >
                全部色系
              </button>
              <button
                v-for="family in colorFamilies"
                :key="family"
                type="button"
                :class="['color-filter-option', { selected: closetStore.colorFamilyFilter === family }]"
                @click="selectColorFamily(family)"
              >
                {{ family }}
              </button>
            </div>
          </div>

          <div v-if="closetStore.colorFamilyFilter && colorDetailOptions.length" class="color-filter-group color-detail-group">
            <strong>主要顏色</strong>
            <div class="color-filter-group-options">
              <button
                type="button"
                :class="['color-filter-option', { selected: !closetStore.colorFilter }]"
                @click="selectDetailColor('')"
              >
                全部 {{ closetStore.colorFamilyFilter }}
              </button>
              <button
                v-for="[name, swatch] in colorDetailOptions"
                :key="name"
                type="button"
                :class="['color-filter-option', { selected: closetStore.colorFilter === name }]"
                @click="selectDetailColor(name)"
              >
                <span :class="['color-swatch', swatch]"></span>
                {{ name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <select v-model="closetStore.seasonFilter" class="select" aria-label="依季節篩選">
        <option value="">季節</option>
        <option value="Spring / Summer">春夏</option>
        <option value="Autumn / Winter">秋冬</option>
        <option value="All year">四季</option>
      </select>

      <select v-model="closetStore.styleFilter" class="select" aria-label="依風格篩選">
        <option value="">風格</option>
        <option value="Minimal">極簡</option>
        <option value="Casual">休閒</option>
        <option value="Smart Casual">簡約正式</option>
        <option value="Chic">時髦</option>
      </select>
    </div>

    <!-- Category Tabs -->
    <div v-if="!isViewingPublicCloset || publicClosetState === 'public'" class="category-row" aria-label="單品分類">
      <button
        v-for="cat in categories"
        :key="cat"
        :class="['category', { active: closetStore.activeCategory === cat }]"
        @click="closetStore.activeCategory = cat"
      >
        {{ labels[cat] }}
      </button>
    </div>

    <div v-if="!isViewingPublicCloset || publicClosetState === 'public'" class="closet-meta">
      <strong>{{ closetStore.filteredItems.length }} 件單品</strong>
      <div class="closet-meta-actions">
        <button class="clear" @click="clearAllFilters">清除篩選</button>
        <button v-if="isOwnCloset && !isRemoteCloset" class="add-item-button" @click="openAddForm">＋ 新增單品</button>
      </div>
    </div>

    <!-- Items Grid -->
    <div v-if="!isViewingPublicCloset || publicClosetState === 'public'" class="grid">
      <template v-if="closetStore.filteredItems.length">
        <article
          v-for="(item, index) in closetStore.filteredItems"
          :key="item.id"
          class="item-card"
          :style="{ animationDelay: `${index * 45}ms` }"
        >
          <div class="item-image" @click="isOwnCloset && openDetail(item.id)">
            <button
              v-if="isPublicHeartActionAvailable"
              :class="['favorite', 'item-hearts', { 'is-favorite': item.hearted_by_viewer }]"
              type="button"
              :aria-label="`給這件單品愛心，目前 ${Number(item.heart_count) || 0} 個`"
              :aria-pressed="Boolean(item.hearted_by_viewer)"
              :disabled="pendingHeartItemIds.includes(item.id)"
              @click.stop="toggleItemHeartForCloset(item)"
            >
              ♥ <span>{{ Number(item.heart_count) || 0 }}</span>
            </button>
            <span
              v-else
              class="favorite item-hearts item-heart-count"
              :aria-label="`收到 ${Number(item.heart_count) || 0} 個愛心`"
            >
              ♥ <span>{{ Number(item.heart_count) || 0 }}</span>
            </span>
            <img :src="item.photo" :alt="item.name_zh || item.name" loading="lazy" />
          </div>
          <div class="item-info">
            <h3>
              {{ item.name_zh || item.name }}
              <span v-if="isMarkedClearance(item)" style="color:#a65f5b; font-size:11px; margin-left:4px;">[待出清]</span>
            </h3>
            <p>{{ labels[item.category] || item.category }} · {{ labels[item.style] || item.style }}</p>
          </div>
        </article>
      </template>

      <div v-else class="empty">
        <template v-if="isViewingPublicCloset">這個公開衣櫥目前沒有符合條件的單品。</template>
        <template v-else>
          {{ isRemoteCloset ? 'Supabase 衣櫥目前沒有符合條件的單品。' : '沒有符合篩選條件的單品。' }}<br />
          <button v-if="!isRemoteCloset" @click="openAddForm">新增單品</button>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useClosetStore } from '@/stores/closet';
import {
  fetchItemHeartStats,
  fetchLegacyClosetFromSupabase,
  fetchPublicClosetFromSupabase,
  toggleItemHeart,
  updatePublicClosetVisibility
} from '@/services/supabase';
import { categories, labels, colorFamilies, colorDetailGroups } from '@/constants';

const appStore = useAppStore();
const authStore = useAuthStore();
const closetStore = useClosetStore();
const route = useRoute();
const router = useRouter();

const isColorMenuOpen = ref(false);
const colorMenuRef = ref(null);
const publicClosetState = ref('self');
const remoteClosetState = ref('idle');
const isRemoteCloset = ref(false);
const publicClosetProfile = ref(null);
const isSavingVisibility = ref(false);
const pendingHeartItemIds = ref([]);
const viewedUsername = computed(() => String(route.query.user || '').trim());
const isOwnCloset = computed(() => {
  if (!authStore.isLoggedIn) return false;
  if (!viewedUsername.value) return true;
  return appStore.normalizeUsername(viewedUsername.value) === appStore.normalizeUsername(appStore.profile.username);
});
const isViewingPublicCloset = computed(() => !isOwnCloset.value);
const isPublicHeartActionAvailable = computed(() => {
  return isViewingPublicCloset.value && publicClosetState.value === 'public';
});
const publicClosetTitle = computed(() => {
  const profileName = publicClosetProfile.value?.full_name || publicClosetProfile.value?.username;
  const closetOwner = profileName || viewedUsername.value;
  return closetOwner ? `${closetOwner} 的衣櫥` : '公開衣櫥';
});
let closetLoadRequest = 0;

const loadViewedCloset = async () => {
  const requestId = ++closetLoadRequest;
  if (isOwnCloset.value) {
    publicClosetProfile.value = null;
    publicClosetState.value = 'self';

    const hasRealSupabaseSession = Boolean(
      authStore.session?.user &&
      authStore.session?.access_token !== 'demo-access-token'
    );
    isRemoteCloset.value = hasRealSupabaseSession;
    if (hasRealSupabaseSession) {
      closetStore.setReadOnlyItems([]);
      remoteClosetState.value = 'loading';
      const result = await fetchLegacyClosetFromSupabase();
      if (requestId !== closetLoadRequest) return;
      if (result.status === 'success') {
        closetStore.setReadOnlyItems(result.items);
        remoteClosetState.value = 'success';
      } else {
        remoteClosetState.value = 'error';
      }
      return;
    }

    remoteClosetState.value = 'idle';
    closetStore.clearReadOnlyItems();
    const heartStats = await fetchItemHeartStats(appStore.items.map((item) => item.id));
    if (requestId !== closetLoadRequest) return;
    appStore.items = applyItemHeartStats(appStore.items, heartStats);
    return;
  }

  isRemoteCloset.value = false;
  remoteClosetState.value = 'idle';
  closetStore.setReadOnlyItems([]);
  publicClosetProfile.value = null;
  publicClosetState.value = 'loading';
  const result = await fetchPublicClosetFromSupabase(viewedUsername.value);
  if (requestId !== closetLoadRequest) return;

  if (result.status === 'public') {
    const heartStats = await fetchItemHeartStats(result.items.map((item) => item.id));
    if (requestId !== closetLoadRequest) return;
    publicClosetProfile.value = result.profile;
    closetStore.setReadOnlyItems(applyItemHeartStats(result.items, heartStats));
    publicClosetState.value = 'public';
  } else if (result.status === 'error') {
    publicClosetState.value = 'error';
  } else {
    publicClosetState.value = 'unavailable';
  }
};

const applyItemHeartStats = (items, stats) => {
  const statsByItemId = new Map((stats || []).map((stat) => [String(stat.item_id), stat]));
  return items.map((item) => {
    const statsForItem = statsByItemId.get(String(item.id));
    return {
      ...item,
      heart_count: statsForItem
        ? (Number(item.virtual_heart_count) || 0) + (Number(statsForItem.heart_count) || 0)
        : Number(item.heart_count) || Number(item.virtual_heart_count) || 0,
      hearted_by_viewer: statsForItem ? Boolean(statsForItem.liked_by_viewer) : Boolean(item.hearted_by_viewer)
    };
  });
};

const toggleItemHeartForCloset = async (item) => {
  if (!isPublicHeartActionAvailable.value || pendingHeartItemIds.value.includes(item.id)) return;
  pendingHeartItemIds.value.push(item.id);
  const result = await toggleItemHeart(item.id);
  pendingHeartItemIds.value = pendingHeartItemIds.value.filter((id) => id !== item.id);

  if (!result || typeof result.heart_count !== 'number') {
    appStore.showToast('愛心未能送出，衣櫥可能已設為私人');
    return;
  }
  item.heart_count = (Number(item.virtual_heart_count) || 0) + result.heart_count;
  item.hearted_by_viewer = Boolean(result.liked);
};

const togglePublicCloset = async () => {
  if (!isOwnCloset.value || isSavingVisibility.value) return;
  const previousValue = Boolean(appStore.profile.public_closet);
  const nextValue = !previousValue;

  if (authStore.session?.access_token === 'demo-access-token') {
    appStore.profile.public_closet = nextValue;
    appStore.showToast('示範模式：設定僅供本機預覽，尚未公開至雲端');
    return;
  }

  isSavingVisibility.value = true;
  appStore.profile.public_closet = nextValue;

  const saved = await updatePublicClosetVisibility(nextValue);
  isSavingVisibility.value = false;
  if (!saved) {
    appStore.profile.public_closet = previousValue;
    appStore.showToast('公開設定未能同步，請確認登入狀態後重試');
    return;
  }
  appStore.showToast(nextValue ? '衣櫥已公開' : '衣櫥已設為私人');
};

const colorDetailOptions = computed(() => {
  return colorDetailGroups[closetStore.colorFamilyFilter] || [];
});

const colorFilterDisplayLabel = computed(() => {
  if (closetStore.colorFilter) return closetStore.colorFilter;
  if (closetStore.colorFamilyFilter) return closetStore.colorFamilyFilter;
  return '色系／顏色';
});

const selectColorFamily = (family) => {
  closetStore.colorFamilyFilter = family;
  closetStore.colorFilter = '';
  if (!family) {
    isColorMenuOpen.value = false;
  }
};

const selectDetailColor = (color) => {
  closetStore.colorFilter = color;
  isColorMenuOpen.value = false;
};

const clearAllFilters = () => {
  closetStore.clearFilters();
  isColorMenuOpen.value = false;
};

const isMarkedClearance = (item) => {
  return String(item.notes || '').includes('[待出清]');
};

const getDisusedMessage = (item) => {
  const days = closetStore.getDaysSinceLastWorn(item.last_worn);
  if (item.wear_count === 0 && !item.last_worn) {
    return '你從來沒穿過耶！';
  }
  if (days !== null) {
    return `已經 ${days} 天沒穿囉！`;
  }
  return `只穿過 ${Number(item.wear_count || 0)} 次。`;
};

const sendToSos = (itemId) => {
  router.push({ path: '/sos', query: { item_id: itemId } });
};

const openAddForm = () => {
  appStore.editingItemId = null;
  appStore.isItemFormOpen = true;
};

const openDetail = (id) => {
  appStore.selectedItemId = id;
  appStore.isDetailOpen = true;
};

const handleOutsideClick = (e) => {
  if (colorMenuRef.value && !colorMenuRef.value.contains(e.target)) {
    isColorMenuOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

watch(
  [() => route.query.user, () => authStore.isLoggedIn, () => authStore.session?.access_token],
  loadViewedCloset,
  { immediate: true }
);

onBeforeUnmount(() => {
  closetLoadRequest += 1;
  closetStore.clearReadOnlyItems();
  document.removeEventListener('click', handleOutsideClick);
});
</script>
