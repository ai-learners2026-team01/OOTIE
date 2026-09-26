<template>
  <div v-if="appStore.isSosCloseConfirmOpen" class="modal-backdrop open" @click.self="close">
    <section class="modal sos-close-confirm-modal">
      <button class="modal-close" aria-label="關閉" @click="close">×</button>
      <p class="eyebrow">Style SOS</p>
      <h2 style="font-family:'Playfair Display',serif; font-size:26px; margin: 10px 0 14px;">結束這次求救？</h2>
      <p style="color:var(--muted); font-size:13px; line-height:1.6; margin-bottom:24px;">
        結束後將不再接受新的搭配建議，但你仍可以查看目前收到的所有回覆。
      </p>
      <div class="form-actions">
        <button type="button" class="secondary" @click="close">取消</button>
        <button type="button" class="primary" @click="handleConfirm">確認結束</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { useSosStore } from '@/stores/sos';

const appStore = useAppStore();
const sosStore = useSosStore();

const close = () => {
  appStore.isSosCloseConfirmOpen = false;
  appStore.sosToCloseId = null;
};

const handleConfirm = () => {
  if (appStore.sosToCloseId) {
    sosStore.closeSosPost(appStore.sosToCloseId);
  }
  close();
};
</script>
