<template>
  <div class="sos-outfit-board" role="group" :aria-label="`穿搭拼貼，${items.length} 件衣物`">
    <p class="sos-outfit-caption">THE OUTFIT <span>{{ items.length }} 件單品</span></p>
    <div v-if="rows.length" class="sos-outfit-flow">
      <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="sos-outfit-row" :class="{ 'is-accent-row': row.length > 1 }">
        <div v-for="group in row" :key="group.key" class="sos-outfit-group" :data-category="group.key">
          <span class="sos-outfit-category">{{ group.label }}</span>
          <div class="sos-outfit-pieces">
            <figure v-for="item in group.items" :key="item.id" class="sos-outfit-piece">
              <div class="sos-outfit-photo"><SosClothingImage :src="item.photo" :alt="item.name_zh || item.name || '衣物照片'" /></div>
              <figcaption>{{ item.name_zh || item.name || '未命名衣物' }}</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="sos-outfit-unavailable">這套搭配的公開衣物目前無法顯示。</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import SosClothingImage from './SosClothingImage.vue';
import { outfitRows } from '../outfitBoard';

const props = defineProps({ items: { type: Array, default: () => [] } });
const rows = computed(() => outfitRows(props.items));
</script>

<style scoped>
.sos-outfit-board { min-width: 0; padding: 14px; border: 1px solid #e5dfd5; border-radius: 16px; background: linear-gradient(145deg, #f6f3ed, #eeebe4); }
.sos-outfit-caption { display: flex; justify-content: space-between; gap: 8px; margin: 0 0 12px; color: #817b71; font-size: 10px; letter-spacing: .18em; }
.sos-outfit-caption span { letter-spacing: 0; white-space: nowrap; }
.sos-outfit-flow { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.sos-outfit-row { display: flex; justify-content: center; align-items: flex-start; gap: 10px; width: 100%; min-width: 0; }
.sos-outfit-group { min-width: 0; width: min(100%, 155px); text-align: center; }
.sos-outfit-row.is-accent-row .sos-outfit-group { width: min(48%, 125px); }
.sos-outfit-category { display: block; margin-bottom: 5px; color: #6e7464; font-size: 10px; letter-spacing: .08em; }
.sos-outfit-pieces { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px; }
.sos-outfit-piece { flex: 0 1 110px; min-width: 0; margin: 0; }
.sos-outfit-row.is-accent-row .sos-outfit-piece { flex-basis: 95px; }
.sos-outfit-photo { padding: 7px; border-radius: 12px; background: #fbfaf7; box-shadow: 0 5px 16px #4b40301a; }
.sos-outfit-photo :deep(.sos-clothing-image), .sos-outfit-photo :deep(.sos-image-fallback) { width: 100%; height: 88px; aspect-ratio: auto; object-fit: contain; background: transparent; border-radius: 7px; }
.sos-outfit-row.is-accent-row .sos-outfit-photo :deep(.sos-clothing-image), .sos-outfit-row.is-accent-row .sos-outfit-photo :deep(.sos-image-fallback) { height: 72px; }
.sos-outfit-piece figcaption { margin-top: 5px; color: #514d46; font-size: 10px; line-height: 1.35; overflow-wrap: anywhere; }
.sos-outfit-unavailable { margin: 24px 0; text-align: center; color: var(--muted); font-size: 12px; line-height: 1.6; }
</style>
