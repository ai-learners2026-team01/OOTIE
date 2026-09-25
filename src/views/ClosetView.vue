<template>
  <section class="page active" id="closetPage">
    <p class="eyebrow">數位衣櫥</p>
    <h1>我的衣櫥</h1>
    <p class="intro">把擁有的每一件衣服，準備成下一套日常。</p>

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
      <select v-model="closetStore.colorFilter" class="select" aria-label="依顏色篩選">
        <option value="">顏色</option>
        <option value="White">白色</option>
        <option value="Black">黑色</option>
        <option value="Blue">藍色</option>
        <option value="Beige">米色</option>
        <option value="Brown">棕色</option>
      </select>
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
        <button class="clear" @click="closetStore.clearFilters">清除篩選</button>
        <button class="add-item-button" @click="openAddForm">＋ 新增單品</button>
      </div>
    </div>

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
            <h3>{{ item.name_zh || item.name }}</h3>
            <p>{{ labels[item.category] }} · {{ labels[item.style] }}</p>
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
import { useAppStore } from '@/stores/app';
import { useClosetStore } from '@/stores/closet';
import { categories, labels } from '@/constants';

const appStore = useAppStore();
const closetStore = useClosetStore();

const openAddForm = () => {
  appStore.editingItemId = null;
  appStore.isItemFormOpen = true;
};

const openDetail = (id) => {
  appStore.selectedItemId = id;
  appStore.isDetailOpen = true;
};
</script>
