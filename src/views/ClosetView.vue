<template>
  <section class="page active" id="closetPage">
    <p class="eyebrow">數位衣櫥</p>
    <h1>我的衣櫥</h1>
    <p class="intro">把擁有的每一件衣服，準備成下一套日常。</p>

    <!-- 冷宮衣物提醒區塊 -->
    <section class="disused-section" aria-labelledby="disusedTitle">
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
    <div class="toolbar">
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
    <div class="category-row" aria-label="單品分類">
      <button
        v-for="cat in categories"
        :key="cat"
        :class="['category', { active: closetStore.activeCategory === cat }]"
        @click="closetStore.activeCategory = cat"
      >
        {{ labels[cat] }}
      </button>
    </div>

    <div class="closet-meta">
      <strong>{{ closetStore.filteredItems.length }} 件單品</strong>
      <div class="closet-meta-actions">
        <button class="clear" @click="clearAllFilters">清除篩選</button>
        <button class="add-item-button" @click="openAddForm">＋ 新增單品</button>
      </div>
    </div>

    <!-- Items Grid -->
    <div class="grid">
      <template v-if="closetStore.filteredItems.length">
        <article
          v-for="(item, index) in closetStore.filteredItems"
          :key="item.id"
          class="item-card"
          :style="{ animationDelay: `${index * 45}ms` }"
        >
          <div class="item-image" @click="openDetail(item.id)">
            <button
              :class="['favorite', { 'is-favorite': item.favorite }]"
              aria-label="收藏"
              @click.stop="closetStore.toggleFavorite(item.id)"
            >
              {{ item.favorite ? '♥' : '♡' }}
            </button>
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
        沒有符合篩選條件的單品。<br />
        <button @click="openAddForm">新增單品</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useClosetStore } from '@/stores/closet';
import { categories, labels, colorFamilies, colorDetailGroups } from '@/constants';

const appStore = useAppStore();
const closetStore = useClosetStore();
const router = useRouter();

const isColorMenuOpen = ref(false);
const colorMenuRef = ref(null);

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

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>

