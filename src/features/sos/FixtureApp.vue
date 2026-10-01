<template>
  <div class="sos-fixture-shell">
    <header class="sos-fixture-header"><a href="/sos">OOTie</a><span>SOS 多人體驗</span><a href="/sos">回到一般網站 →</a></header>
    <main><router-view /></main>
  </div>
  <SosFormModal />
  <SuggestionModal />
  <SosDetailModal />
  <SosCloseConfirmModal />
  <BaseToast />
</template>

<script setup>
import SosFormModal from '@/components/modal/SosFormModal.vue';
import SuggestionModal from '@/components/modal/SuggestionModal.vue';
import SosDetailModal from '@/components/modal/SosDetailModal.vue';
import SosCloseConfirmModal from '@/components/modal/SosCloseConfirmModal.vue';
import BaseToast from '@/components/ui/BaseToast.vue';
</script>

<style scoped>
.sos-fixture-shell { max-width: 1140px; margin: auto; padding: 0 28px; }
.sos-fixture-shell main { margin: 0; padding: 32px 0 70px; }
.sos-fixture-header { display: flex; align-items: center; gap: 20px; padding: 22px 0; border-bottom: 1px solid var(--line); font-size: 12px; }
.sos-fixture-header a { color: var(--ink); text-decoration: none; }
.sos-fixture-header a:first-child { font-family: "Nunito", sans-serif; font-size: 30px; }
.sos-fixture-header a:last-child { margin-left: auto; }
@media (max-width: 600px) { .sos-fixture-shell { padding: 0 18px; } .sos-fixture-header { gap: 12px; } }
</style>
