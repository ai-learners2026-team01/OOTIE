<template>
  <div :class="['toast', { show: appStore.toastVisible }]">
    {{ appStore.toastMessage }}
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
</script>
