<template>
  <img v-if="src && !failed" class="sos-clothing-image" :src="src" :alt="alt || '衣物照片'" loading="lazy" decoding="async" @error="failed = true" />
  <div v-else class="sos-image-fallback" role="img" :aria-label="alt || '衣物照片暫無法顯示'"><span>衣物照片<br />暫無法顯示</span></div>
</template>
<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ src: String, alt: String });
const failed = ref(false);
watch(() => props.src, () => { failed.value = false; });
</script>
<style scoped>
.sos-clothing-image { width: 100%; aspect-ratio: 3 / 4; object-fit: contain; object-position: center; display: block; background: #f3f0e9; }
.sos-image-fallback { width: 100%; aspect-ratio: 3/4; background: #f2efe9; display: grid; place-items: center; color: #79756c; text-align: center; font-size: 11px; }
:global(.current-outfit-images) .sos-image-fallback { width: 52px; height: 64px; aspect-ratio: auto; flex: 0 0 52px; border-radius: 8px; }
</style>
